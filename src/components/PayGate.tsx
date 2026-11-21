import { useState, type ReactNode } from 'react';
import { useAuth } from '../auth';

export function PayGate({
  feature,
  title,
  onLogin,
  onAccount,
  children,
}: {
  feature: string;
  title: string;
  onLogin: () => void;
  onAccount: () => void;
  children: ReactNode;
}) {
  const { session, ready, offline, unlock } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!ready) {
    return (
      <section className="sheet narrow">
        <p className="lead">正在核对账户…</p>
      </section>
    );
  }
  if (offline || !session) {
    return (
      <section className="sheet narrow">
        <h1>账户服务没连上</h1>
        <p className="lead">排盘页面还在，金币和邀请要等账户服务恢复。</p>
      </section>
    );
  }
  if (!session.user) {
    return (
      <section className="sheet narrow">
        <h1>登录后才能排这一项</h1>
        <p className="lead">
          {title}今日解锁 {session.costs[feature] ?? 0} 金币。注册送 {session.rewards.register} 金币。
        </p>
        <button className="primary" type="button" onClick={onLogin}>
          去登录或注册
        </button>
      </section>
    );
  }
  if (session.unlocks.includes(feature)) return children;

  const cost = session.costs[feature] ?? 0;
  const short = session.balance < cost;

  async function pay() {
    setBusy(true);
    setError('');
    try {
      await unlock(feature);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '解锁失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sheet narrow">
      <p className="eyebrow">金币</p>
      <h1>{title}</h1>
      <p className="lead">
        今天解锁需要 {cost} 金币，解锁后当天可以反复看。你现在有 {session.balance} 金币。
      </p>
      {error ? <p className="error">{error}</p> : null}
      <div className="actions">
        <button className="primary" type="button" disabled={busy || short} onClick={pay}>
          {short ? '金币不足' : busy ? '正在扣金币…' : `花费 ${cost} 金币解锁`}
        </button>
        <button className="ghost" type="button" onClick={onAccount}>
          {short ? '购买金币' : '签到或邀请'}
        </button>
      </div>
    </section>
  );
}
