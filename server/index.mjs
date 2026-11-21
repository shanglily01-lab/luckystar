import { createServer } from 'node:http';
import { loadEnv, publicOrigin, sendActivation } from './mail.mjs';
import {
  activate,
  checkin,
  createOrder,
  httpError,
  login,
  logout,
  payOrder,
  register,
  resendActivation,
  sessionUser,
  snapshot,
  unlock,
  verifyCode,
} from './store.mjs';

loadEnv();

const port = Number(process.env.LUCKYSTAR_API_PORT || 8787);

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 100_000) {
        reject(httpError(413, '请求过大'));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(httpError(400, '请求格式不对'));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, data, cookie) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (cookie) headers['Set-Cookie'] = cookie;
  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

function sessionCookie(token, maxAge) {
  return `ls_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

async function deliverActivation(result) {
  if (!result.token) {
    return { pending: true, email: result.email, mailed: true };
  }
  const link = `${publicOrigin()}/?activate=${result.token}`;
  let mailed = false;
  let mailError = '';
  try {
    mailed = await sendActivation({ to: result.email, username: result.username, link, code: result.code });
  } catch (error) {
    mailError = '验证码没有发出去，请稍后再发';
    console.error(error);
  }
  const payload = { pending: true, email: result.email, mailed };
  if (!mailed) {
    payload.activatePath = `/?activate=${result.token}`;
    payload.code = result.code;
  }
  if (mailError) payload.mailError = mailError;
  return payload;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  try {
    const token = readCookie(req, 'ls_session');
    const user = sessionUser(token);

    if (req.method === 'GET' && url.pathname === '/api/me') {
      send(res, 200, snapshot(user));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/register') {
      const body = await readBody(req);
      send(res, 200, await deliverActivation(await register(body)));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/resend') {
      const body = await readBody(req);
      send(res, 200, await deliverActivation(await resendActivation(body)));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/verify') {
      const body = await readBody(req);
      const result = await verifyCode(body);
      send(res, 200, result.snapshot, sessionCookie(result.token, 14 * 24 * 3600));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/activate') {
      const body = await readBody(req);
      const result = await activate(body.token);
      send(res, 200, result.snapshot, sessionCookie(result.token, 14 * 24 * 3600));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readBody(req);
      const result = await login(body);
      send(res, 200, result.snapshot, sessionCookie(result.token, 14 * 24 * 3600));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      await logout(token);
      send(res, 200, snapshot(null), sessionCookie('', 0));
      return;
    }

    const needsUser = req.method === 'POST' && ['/api/checkin', '/api/unlock', '/api/orders', '/api/orders/pay'].includes(url.pathname);
    if (!user && needsUser) {
      send(res, 401, { error: '请先登录' });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/checkin') {
      send(res, 200, await checkin(user));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/unlock') {
      const body = await readBody(req);
      send(res, 200, await unlock(user, String(body.feature || '')));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/orders') {
      const body = await readBody(req);
      send(res, 200, await createOrder(user, String(body.packageId || '')));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/orders/pay') {
      const body = await readBody(req);
      send(res, 200, await payOrder(user, String(body.orderId || '')));
      return;
    }

    send(res, 404, { error: '没有这个接口' });
  } catch (error) {
    const status = error.status || 500;
    send(res, status, { error: error.message || '服务暂时不可用' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`幸运星账户服务 http://127.0.0.1:${port}`);
});
