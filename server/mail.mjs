import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTransport } from 'nodemailer';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnv() {
  const file = join(root, '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

export function publicOrigin() {
  return (process.env.LUCKYSTAR_PUBLIC_ORIGIN || 'http://127.0.0.1:5173').replace(/\/$/, '');
}

export function mailReady() {
  return Boolean(process.env.LUCKYSTAR_SMTP_HOST && process.env.LUCKYSTAR_SMTP_FROM);
}

export async function sendActivation({ to, username, link, code }) {
  const subject = '幸运星验证码';
  const lines = [
    `${username}，你好。`,
    '',
    `验证码：${code}`,
    '',
    '在注册页输入这 6 位数字即可激活。验证码 24 小时内有效，激活后注册金币才会到账。',
  ];
  if (link) lines.push('', `也可以打开这个链接：${link}`);
  lines.push('', '如果不是你本人注册，忽略这封信即可。');
  const text = lines.join('\n');

  if (!mailReady()) {
    const dir = join(root, 'server', 'data', 'outbox');
    mkdirSync(dir, { recursive: true });
    const safe = to.replace(/[^\w.@-]/g, '_');
    writeFileSync(join(dir, `${Date.now()}-${safe}.txt`), `To: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return false;
  }

  const port = Number(process.env.LUCKYSTAR_SMTP_PORT || 465);
  const transport = createTransport({
    host: process.env.LUCKYSTAR_SMTP_HOST,
    port,
    secure: process.env.LUCKYSTAR_SMTP_SECURE !== '0',
    auth: process.env.LUCKYSTAR_SMTP_USER
      ? { user: process.env.LUCKYSTAR_SMTP_USER, pass: process.env.LUCKYSTAR_SMTP_PASS || '' }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.LUCKYSTAR_SMTP_FROM,
    to,
    subject,
    text,
  });
  return true;
}
