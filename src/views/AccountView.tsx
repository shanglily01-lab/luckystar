import { useState } from 'react';
import { useAuth, type CoinOrder } from '../auth';

export function AccountView({ onLogin }: { onLogin: () => void }) {
  const { session, ready, offline, checkin, logout, createOrder, payOrder } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<CoinOrder | null>(null);

  if (!ready) {
    return (
      <section className="sheet narrow">
        <p className="lead">正在读取账户…</p>
      </section>
    );
  }
  if (offline || !session) {
    return (
      <section className="sheet narrow">
        <h1>账户服务没连上</h1>
      </section>
    );
  }
  if (!session.user) {
    return (
      <section className="sheet narrow">
        <h1>还没有登录</h1>
        <button className="primary" type="button" onClick={onLogin}>
          去登录或注册
        </button>
      </section>
    );
  }

  const link = `${window.location.origin}${window.location.pathname}?invite=${session.user.inviteCode}`;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('已复制');
    } catch {
      setMessage(text);
    }
  }

  async function sign() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await checkin();
      setMessage(`签到成功，+${session?.rewards.checkin ?? 8} 金币`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '签到失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sheet">
      <div className="view-head">
        <div>
          <p className="eyebrow">我的账户</p>
          <h1>{session.user.username}</h1>
          {session.user.email ? <p className="hint">{session.user.email}</p> : null}
        </div>
        <div className="score-orb">
          <b>{session.balance}</b>
          <small>金币</small>
        </div>
      </div>
      <div className="actions">
        <button className="primary" type="button" disabled={busy || session.checkedInToday} onClick={sign}>
          {session.checkedInToday ? '今日已签到' : `签到 +${session.rewards.checkin}`}
        </button>
        <button
          className="ghost"
          type="button"
          onClick={async () => {
            await logout();
            setMessage('已退出');
          }}
        >
          退出登录
        </button>
      </div>
      {message ? <p className="hint">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <h2>购买金币</h2>
      <p className="lead">先选一档生成订单，再确认支付。支付完成后金币马上到账。</p>
      <div className="shop">
        {(session.packages ?? []).map((pack) => (
          <button
            key={pack.id}
            type="button"
            className={order?.label === pack.label && order.coins === pack.coins ? 'on' : ''}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              setMessage('');
              try {
                setOrder(await createOrder(pack.id));
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : '订单没有生成');
              } finally {
                setBusy(false);
              }
            }}
          >
            <strong>{pack.coins} 金币</strong>
            <b>¥{pack.price}</b>
            <small>{pack.label}</small>
          </button>
        ))}
      </div>
      {order && order.status !== 'paid' ? (
        <div className="invite-box">
          <span>
            {order.label} · {order.coins} 金币
          </span>
          <b>应付 ¥{order.price}</b>
          <button
            className="primary"
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              setMessage('');
              try {
                await payOrder(order.id);
                setMessage(`已支付 ¥${order.price}，+${order.coins} 金币`);
                setOrder(null);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : '支付没有完成');
              } finally {
                setBusy(false);
              }
            }}
          >
            确认支付
          </button>
        </div>
      ) : null}

      <h2>邀请</h2>
      <p className="lead">
        朋友用你的邀请码注册并激活后，你得 {session.rewards.inviter} 金币，对方额外得 {session.rewards.invitee} 金币。
      </p>
      <div className="invite-box">
        <strong>{session.user.inviteCode}</strong>
        <button className="ghost" type="button" onClick={() => copy(session.user!.inviteCode)}>
          复制邀请码
        </button>
        <button className="ghost" type="button" onClick={() => copy(link)}>
          复制邀请链接
        </button>
      </div>
      {session.invited.length ? (
        <ul className="ledger">
          {session.invited.map((person) => (
            <li key={person.username + person.at}>
              <span>{person.username}</span>
              <small>{person.at.slice(0, 10)} 注册</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">还没有人使用你的邀请码。</p>
      )}

      <h2>金币记录</h2>
      <ul className="ledger">
        {session.ledger.map((entry) => (
          <li key={entry.at + entry.reason}>
            <span>{entry.reason}</span>
            <b className={entry.delta > 0 ? 'plus' : 'minus'}>
              {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
            </b>
          </li>
        ))}
      </ul>
    </section>
  );
}
