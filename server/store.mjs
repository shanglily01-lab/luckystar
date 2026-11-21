import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COSTS, FEATURE_LABEL, PACKAGES, REWARDS, todayKey } from './economy.mjs';

const file = join(dirname(fileURLToPath(import.meta.url)), 'data', 'db.json');

function empty() {
  return { users: [], sessions: [], ledger: [], unlocks: [], orders: [], usedActivations: [] };
}

function load() {
  try {
    if (!existsSync(file)) return empty();
    return { ...empty(), ...JSON.parse(readFileSync(file, 'utf8')) };
  } catch {
    return empty();
  }
}

const db = load();
let chain = Promise.resolve();

function persist() {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(db, null, 2));
}

function mutate(fn) {
  const run = chain.then(() => {
    const result = fn();
    persist();
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function id(prefix) {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return { salt, hash };
}

function samePassword(password, user) {
  const next = scryptSync(password, user.salt, 32);
  const prev = Buffer.from(user.hash, 'hex');
  return next.length === prev.length && timingSafeEqual(next, prev);
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeInviteCode() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const bytes = randomBytes(6);
    let code = '';
    for (let index = 0; index < 6; index += 1) code += CODE_ALPHABET[bytes[index] % CODE_ALPHABET.length];
    if (!db.users.some((user) => user.inviteCode === code)) return code;
  }
  throw httpError(500, '邀请码暂时发不出来，请再试一次');
}

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function balanceOf(userId) {
  return db.ledger.filter((entry) => entry.userId === userId).reduce((sum, entry) => sum + entry.delta, 0);
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email || '',
    inviteCode: user.inviteCode,
    createdAt: user.createdAt,
  };
}

function isActive(user) {
  return !user.email || Boolean(user.verifiedAt);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function sameHex(left, right) {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

function addCoin(userId, delta, reason, day = todayKey()) {
  db.ledger.push({
    id: id('c'),
    userId,
    delta,
    reason,
    day,
    at: new Date().toISOString(),
  });
}

export function sessionUser(token) {
  if (!token) return null;
  const now = Date.now();
  const session = db.sessions.find((item) => item.token === token && item.expiresAt > now);
  if (!session) return null;
  return db.users.find((user) => user.id === session.userId) ?? null;
}

export function snapshot(user) {
  const day = todayKey();
  return {
    user: user ? publicUser(user) : null,
    balance: user ? balanceOf(user.id) : 0,
    checkedInToday: user
      ? db.ledger.some((entry) => entry.userId === user.id && entry.kind === 'checkin' && entry.day === day)
      : false,
    invited: user
      ? db.users
          .filter((item) => item.invitedBy === user.id && isActive(item))
          .map((item) => ({ username: item.username, at: item.verifiedAt || item.createdAt }))
      : [],
    unlocks: user
      ? db.unlocks.filter((item) => item.userId === user.id && item.day === day).map((item) => item.feature)
      : [],
    costs: COSTS,
    rewards: REWARDS,
    packages: PACKAGES,
    orders: user
      ? db.orders
          .filter((order) => order.userId === user.id && order.status === 'paid')
          .slice(-8)
          .reverse()
          .map((order) => ({
            id: order.id,
            coins: order.coins,
            price: order.price,
            label: order.label,
            status: order.status,
            at: order.paidAt || order.createdAt,
          }))
      : [],
    ledger: user
      ? db.ledger
          .filter((entry) => entry.userId === user.id)
          .slice(-20)
          .reverse()
          .map((entry) => ({ delta: entry.delta, reason: entry.reason, at: entry.at }))
      : [],
  };
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;
}

function issueActivation(user) {
  const token = randomBytes(24).toString('hex');
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  user.activationHash = hashToken(token);
  user.activationExpires = Date.now() + 24 * 3600 * 1000;
  user.codeSalt = randomBytes(8).toString('hex');
  user.codeHash = hashToken(`${user.codeSalt}:${code}`);
  user.codeAttempts = 0;
  return { token, code };
}

function grantWelcome(user) {
  if (user.welcomeGranted) return;
  addCoin(user.id, REWARDS.register, '注册赠送');
  if (user.invitedBy) {
    const inviter = db.users.find((item) => item.id === user.invitedBy);
    addCoin(user.id, REWARDS.invitee, '使用邀请码');
    if (inviter) addCoin(inviter.id, REWARDS.inviter, `邀请 ${user.username} 注册`);
  }
  user.welcomeGranted = true;
}

export function register({ username, password, email, inviteCode }) {
  return mutate(() => {
    const name = String(username ?? '').trim();
    const secret = String(password ?? '');
    const mail = String(email ?? '').trim().toLowerCase();
    const code = String(inviteCode ?? '').trim().toUpperCase();
    if (!name) throw httpError(400, '请填写用户名');
    if (!validEmail(mail)) throw httpError(400, '请填写有效邮箱');
    if (secret.length > 64) throw httpError(400, '密码不能超过 64 位');
    if (db.users.some((user) => user.username.toLowerCase() === name.toLowerCase())) {
      throw httpError(409, '这个名字已经有人用了');
    }
    const existing = db.users.find((user) => user.email === mail);
    if (existing && !existing.verifiedAt) throw httpError(409, '这个邮箱还在等激活。请到登录页重发激活信');
    if (existing) throw httpError(409, '这个邮箱已经注册');
    let inviter = null;
    if (code) {
      inviter = db.users.find((user) => user.inviteCode === code) ?? null;
      if (!inviter) throw httpError(400, '邀请码不存在');
      if (!isActive(inviter)) throw httpError(400, '邀请人还没激活账号');
    }
    const passwordRecord = hashPassword(secret);
    const user = {
      id: id('u'),
      username: name,
      email: mail,
      salt: passwordRecord.salt,
      hash: passwordRecord.hash,
      inviteCode: makeInviteCode(),
      invitedBy: inviter?.id ?? null,
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      welcomeGranted: false,
    };
    const issued = issueActivation(user);
    db.users.push(user);
    return { email: mail, username: name, token: issued.token, code: issued.code };
  });
}

export function resendActivation({ email }) {
  return mutate(() => {
    const mail = String(email ?? '').trim().toLowerCase();
    if (!validEmail(mail)) throw httpError(400, '请填写有效邮箱');
    const user = db.users.find((item) => item.email === mail && !item.verifiedAt);
    if (!user) return { email: mail, username: '', token: '', code: '' };
    const issued = issueActivation(user);
    return { email: mail, username: user.username, token: issued.token, code: issued.code };
  });
}

export function activate(rawToken) {
  return mutate(() => {
    const token = String(rawToken ?? '').trim();
    if (!/^[a-f0-9]{48}$/.test(token)) throw httpError(400, '激活链接无效或已过期');
    const digest = hashToken(token);
    const user = db.users.find((item) => item.activationHash && sameHex(item.activationHash, digest));
    if (user) {
      if (!user.activationExpires || user.activationExpires < Date.now()) {
        throw httpError(400, '激活链接无效或已过期');
      }
      user.verifiedAt = new Date().toISOString();
      user.activationHash = '';
      user.activationExpires = 0;
      grantWelcome(user);
      db.usedActivations.push({ hash: digest, userId: user.id, at: new Date().toISOString() });
      db.usedActivations = db.usedActivations.slice(-200);
      const sessionToken = openSession(user.id);
      return { token: sessionToken, snapshot: snapshot(user) };
    }
    const used = db.usedActivations.find(
      (item) => sameHex(item.hash, digest) && Date.now() - Date.parse(item.at) < 10 * 60 * 1000,
    );
    if (!used) throw httpError(400, '激活链接无效或已过期');
    const again = db.users.find((item) => item.id === used.userId);
    if (!again) throw httpError(400, '激活链接无效或已过期');
    const sessionToken = openSession(again.id);
    return { token: sessionToken, snapshot: snapshot(again) };
  });
}

export function verifyCode({ email, code }) {
  return mutate(() => {
    const mail = String(email ?? '').trim().toLowerCase();
    const digits = String(code ?? '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(digits)) throw httpError(400, '请输入 6 位验证码');
    const user = db.users.find((item) => item.email === mail && !item.verifiedAt);
    if (!user || !user.codeHash || !user.codeSalt || !user.activationExpires || user.activationExpires < Date.now()) {
      throw httpError(400, '验证码不对或已过期');
    }
    if ((user.codeAttempts || 0) >= 8) throw httpError(429, '试得太多，请重新获取验证码');
    const digest = hashToken(`${user.codeSalt}:${digits}`);
    if (!sameHex(user.codeHash, digest)) {
      user.codeAttempts = (user.codeAttempts || 0) + 1;
      persist();
      throw httpError(400, '验证码不对');
    }
    user.verifiedAt = new Date().toISOString();
    user.activationHash = '';
    user.activationExpires = 0;
    user.codeHash = '';
    user.codeSalt = '';
    user.codeAttempts = 0;
    grantWelcome(user);
    const sessionToken = openSession(user.id);
    return { token: sessionToken, snapshot: snapshot(user) };
  });
}

export function login({ username, password }) {
  return mutate(() => {
    const name = String(username ?? '').trim();
    const secret = String(password ?? '');
    const user = db.users.find((item) => item.username.toLowerCase() === name.toLowerCase());
    if (!user || !samePassword(secret, user)) throw httpError(401, '账号或密码不对');
    if (user.email && !user.verifiedAt) throw httpError(403, '这个账号还没激活，请先填写邮箱里的验证码');
    const token = openSession(user.id);
    return { token, snapshot: snapshot(user) };
  });
}

function openSession(userId) {
  const token = randomBytes(24).toString('hex');
  db.sessions.push({
    token,
    userId,
    expiresAt: Date.now() + 14 * 24 * 3600 * 1000,
  });
  db.sessions = db.sessions.filter((item) => item.expiresAt > Date.now()).slice(-500);
  return token;
}

export function logout(token) {
  return mutate(() => {
    db.sessions = db.sessions.filter((item) => item.token !== token);
  });
}

export function checkin(user) {
  return mutate(() => {
    const day = todayKey();
    if (db.ledger.some((entry) => entry.userId === user.id && entry.kind === 'checkin' && entry.day === day)) {
      throw httpError(400, '今天已经签过了');
    }
    db.ledger.push({
      id: id('c'),
      userId: user.id,
      delta: REWARDS.checkin,
      reason: '每日签到',
      kind: 'checkin',
      day,
      at: new Date().toISOString(),
    });
    return snapshot(user);
  });
}

export function unlock(user, feature) {
  return mutate(() => {
    const cost = COSTS[feature];
    if (!cost) throw httpError(400, '没有这项排盘');
    const day = todayKey();
    const already = db.unlocks.some((item) => item.userId === user.id && item.feature === feature && item.day === day);
    if (already) return snapshot(user);
    if (balanceOf(user.id) < cost) throw httpError(402, '金币不够。可以购买金币、签到，或邀请朋友');
    addCoin(user.id, -cost, `解锁${FEATURE_LABEL[feature] ?? feature}`);
    db.unlocks.push({ userId: user.id, feature, day });
    return snapshot(user);
  });
}

function publicOrder(order) {
  return {
    id: order.id,
    coins: order.coins,
    price: order.price,
    label: order.label,
    status: order.status,
    at: order.createdAt,
  };
}

export function createOrder(user, packageId) {
  return mutate(() => {
    const pack = PACKAGES.find((item) => item.id === packageId);
    if (!pack) throw httpError(400, '没有这一档金币');
    for (const order of db.orders) {
      if (order.userId === user.id && order.status === 'pending') order.status = 'cancelled';
    }
    const order = {
      id: id('o'),
      userId: user.id,
      packageId: pack.id,
      coins: pack.coins,
      price: pack.price,
      label: pack.label,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paidAt: '',
    };
    db.orders.push(order);
    return publicOrder(order);
  });
}

export function payOrder(user, orderId) {
  return mutate(() => {
    const order = db.orders.find((item) => item.id === orderId && item.userId === user.id);
    if (!order) throw httpError(404, '没有这笔订单');
    if (order.status === 'cancelled') throw httpError(400, '这笔订单已取消，请重新选择');
    if (order.status !== 'paid') {
      if (db.ledger.some((entry) => entry.orderId === order.id)) {
        order.status = 'paid';
      } else {
        order.status = 'paid';
        order.paidAt = new Date().toISOString();
        db.ledger.push({
          id: id('c'),
          userId: user.id,
          delta: order.coins,
          reason: `购买${order.coins}金币`,
          kind: 'purchase',
          orderId: order.id,
          day: todayKey(),
          at: order.paidAt,
        });
      }
    }
    return snapshot(user);
  });
}
