import { useState, type FormEvent } from 'react';
import { useAuth, type PendingMail } from '../auth';

export function AuthView({
  inviteCode,
  onInviteCode,
  onDone,
}: {
  inviteCode: string;
  onInviteCode: (value: string) => void;
  onDone: () => void;
}) {
  const { session, register, login, resend, verify } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(inviteCode ? 'register' : 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingMail | null>(null);
  const [showResend, setShowResend] = useState(false);
  const rewards = session?.rewards;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'register') {
        setPending(await register({ username, password, email, inviteCode }));
      } else {
        await login({ username, password });
        onDone();
      }
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '没有完成';
      setError(message);
      if (message.includes('还没激活')) setShowResend(true);
    } finally {
      setBusy(false);
    }
  }

  async function sendAgain(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      setPending(await resend(email));
      setMode('register');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '没有发出去');
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(event: FormEvent) {
    event.preventDefault();
    if (!pending) return;
    setBusy(true);
    setError('');
    try {
      await verify({ email: pending.email, code });
      onDone();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '验证没有完成');
    } finally {
      setBusy(false);
    }
  }

  if (pending) {
    return (
      <section className="sheet narrow">
        <p className="eyebrow">账户</p>
        <h1>输入验证码</h1>
        {pending.mailed ? (
          <p className="lead">
            验证码已发到 {pending.email}。请到邮箱查看 6 位数字，24 小时内有效。激活后注册金币才会到账。
          </p>
        ) : (
          <p className="lead">
            验证码还没能发到 {pending.email}。{pending.mailError || '本机还没配置发信邮箱，所以信箱里不会有这封信。'}
            {pending.code ? ` 这次的验证码是 ${pending.code}。` : ''}
          </p>
        )}
        <form className="form" onSubmit={confirmCode}>
          <label>
            验证码
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              placeholder="6 位数字"
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="primary" type="submit" disabled={busy}>
            {busy ? '提交中…' : '确认激活'}
          </button>
        </form>
        <div className="actions">
          <button
            className="ghost"
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError('');
              resend(pending.email)
                .then((next) => {
                  setPending(next);
                  setCode('');
                })
                .catch((reason) => setError(reason instanceof Error ? reason.message : '没有发出去'))
                .finally(() => setBusy(false));
            }}
          >
            再发一次
          </button>
          <button
            className="ghost"
            type="button"
            disabled={busy}
            onClick={() => {
              setPending(null);
              setMode('login');
            }}
          >
            去登录
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="sheet narrow">
      <p className="eyebrow">账户</p>
      <h1>{mode === 'register' ? '注册幸运星' : '登录'}</h1>
      <div className="tabs">
        <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>
          登录
        </button>
        <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>
          注册
        </button>
      </div>
      <form className="form" onSubmit={submit}>
        <label>
          用户名
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        {mode === 'register' ? (
          <label>
            邮箱
            <input
              type="email"
              value={email}
              placeholder="用来接收验证码"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
        ) : null}
        <label>
          密码
          <input
            type="password"
            value={password}
            autoComplete="off"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {mode === 'register' ? (
          <label>
            邀请码
            <input
              value={inviteCode}
              placeholder="可不填"
              onChange={(event) => onInviteCode(event.target.value.toUpperCase())}
            />
          </label>
        ) : null}
        {mode === 'register' && rewards ? (
          <p className="hint">
            提交后要到邮箱收取验证码。激活成功送 {rewards.register} 金币。填写有效邀请码再加 {rewards.invitee}，邀请人得 {rewards.inviter}。
          </p>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        <button className="primary" type="submit" disabled={busy}>
          {busy ? '提交中…' : mode === 'register' ? '注册并发送验证码' : '登录'}
        </button>
      </form>
      {mode === 'login' ? (
        showResend ? (
          <form className="form" onSubmit={sendAgain}>
            <label>
              重发验证码
              <input
                type="email"
                value={email}
                placeholder="注册时填写的邮箱"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button className="ghost" type="submit" disabled={busy}>
              再发一封
            </button>
          </form>
        ) : (
          <button className="textish" type="button" onClick={() => setShowResend(true)}>
            没收到验证码
          </button>
        )
      ) : null}
    </section>
  );
}
