import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { findCity } from './data/cities';
import { DailyView } from './views/DailyView';
import { BaziView } from './views/BaziView';
import { ZiweiView } from './views/ZiweiView';
import { WestView } from './views/WestView';
import { MatchView } from './views/MatchView';
import { YijingView } from './views/YijingView';
import { TarotView } from './views/TarotView';
import { AuthView } from './views/AuthView';
import { AccountView } from './views/AccountView';
import { ProfileForm } from './components/ProfileForm';
import { PayGate } from './components/PayGate';
import { loadProfile, saveProfile } from './lib/storage';
import { pad } from './lib/time';
import type { Profile, ViewId } from './types';

const NAV: { id: ViewId; label: string; kicker: string; text: string }[] = [
  { id: 'daily', label: '当天吉凶', kicker: '事项', text: '出行、求财、签约、面试、婚恋等，看今天宜不宜' },
  { id: 'ziwei', label: '紫微斗数', kicker: '命盘', text: '十二宫、主星亮度、生年四化与流年' },
  { id: 'bazi', label: '八字命盘', kicker: '命盘', text: '四柱十神、旺衰用神、大运流年与取象' },
  { id: 'west', label: '西洋占星', kicker: '命盘', text: '本命行星、上升中天、宫位与相位' },
  { id: 'match', label: '姻缘合盘', kicker: '双人', text: '生肖、日支、日主与太阳星座合看' },
  { id: 'yijing', label: '易经问事', kicker: '问事', text: '铜钱六爻，或按此刻起梅花卦' },
  { id: 'tarot', label: '塔罗三牌', kicker: '问事', text: '过去、现在、未来' },
];

export function App() {
  const { session, ready, activate } = useAuth();
  const [view, setView] = useState<ViewId>('home');
  const [returnView, setReturnView] = useState<ViewId>('home');
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [question, setQuestion] = useState('');
  const [flash, setFlash] = useState('');
  const activating = useRef(false);
  const [inviteCode, setInviteCode] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('invite')?.trim().toUpperCase() || '';
    if (fromUrl) sessionStorage.setItem('luckystar.invite', fromUrl);
    return fromUrl || sessionStorage.getItem('luckystar.invite') || '';
  });

  useEffect(() => {
    if (!ready || activating.current) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('activate');
    if (!token) return;
    activating.current = true;
    activate(token)
      .then(() => {
        params.delete('activate');
        const query = params.toString();
        window.history.replaceState({}, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);
        setFlash('邮箱已激活，注册金币已到账。');
        setView('account');
      })
      .catch((reason) => {
        setFlash(reason instanceof Error ? reason.message : '激活没有完成');
        setView('auth');
      });
  }, [ready, activate]);

  function save(next: Profile) {
    saveProfile(next);
    setProfile(next);
  }

  function openAuth(back: ViewId = view) {
    setReturnView(back === 'auth' ? 'home' : back);
    setView('auth');
  }

  function rememberInvite(code: string) {
    const next = code.trim().toUpperCase();
    setInviteCode(next);
    if (next) sessionStorage.setItem('luckystar.invite', next);
  }

  const cityName = profile ? findCity(profile.cityId).name : '';
  const accountLabel = !ready ? '…' : session?.user ? `${session.user.username} · ${session.balance} 金币` : '登录';

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setView('home')}>
          <span className="seal">星</span>
          <span>
            <strong>幸运星</strong>
            <small>排盘 · 问事 · 当天吉凶</small>
          </span>
        </button>
        <nav>
          {NAV.map((item) => (
            <button key={item.id} className={view === item.id ? 'on' : ''} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button
          className="account-chip"
          type="button"
          onClick={() => (session?.user ? setView('account') : openAuth('home'))}
        >
          {accountLabel}
        </button>
      </header>

      <main>
        {flash ? <p className="flash">{flash}</p> : null}
        <ViewBoundary resetKey={view}>
        {view === 'home' ? (
          <Home
            profile={profile}
            cityName={cityName}
            onSave={save}
            onOpen={setView}
          />
        ) : null}
        {view === 'daily' ? (
          <DailyView
            profile={profile}
            onAsk={(text) => {
              setQuestion(text);
              setView('yijing');
            }}
          />
        ) : null}
        {view === 'ziwei' ? (
          <ChartGate profile={profile} onSave={save}>
            <PayGate feature="ziwei" title="紫微斗数" onLogin={() => openAuth('ziwei')} onAccount={() => setView('account')}>
              <ZiweiView profile={profile!} />
            </PayGate>
          </ChartGate>
        ) : null}
        {view === 'bazi' ? (
          <ChartGate profile={profile} onSave={save}>
            <PayGate feature="bazi" title="八字命盘" onLogin={() => openAuth('bazi')} onAccount={() => setView('account')}>
              <BaziView profile={profile!} />
            </PayGate>
          </ChartGate>
        ) : null}
        {view === 'west' ? (
          <ChartGate profile={profile} onSave={save}>
            <PayGate feature="west" title="西洋占星" onLogin={() => openAuth('west')} onAccount={() => setView('account')}>
              <WestView profile={profile!} />
            </PayGate>
          </ChartGate>
        ) : null}
        {view === 'match' ? (
          <PayGate feature="match" title="姻缘合盘" onLogin={() => openAuth('match')} onAccount={() => setView('account')}>
            <MatchView selfProfile={profile} onSaveSelf={save} />
          </PayGate>
        ) : null}
        {view === 'yijing' ? (
          <PayGate feature="yijing" title="易经问事" onLogin={() => openAuth('yijing')} onAccount={() => setView('account')}>
            <YijingView question={question} onQuestion={setQuestion} />
          </PayGate>
        ) : null}
        {view === 'tarot' ? (
          <PayGate feature="tarot" title="塔罗三牌" onLogin={() => openAuth('tarot')} onAccount={() => setView('account')}>
            <TarotView />
          </PayGate>
        ) : null}
        {view === 'auth' ? (
          <AuthView
            inviteCode={inviteCode}
            onInviteCode={rememberInvite}
            onDone={() => setView(returnView)}
          />
        ) : null}
        {view === 'account' ? <AccountView onLogin={() => openAuth('account')} /> : null}
        </ViewBoundary>
      </main>
    </div>
  );
}

class ViewBoundary extends Component<{ resetKey: ViewId; children: ReactNode }, { error: string }> {
  state = { error: '' };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : '这一页没有排出来' };
  }

  componentDidUpdate(prev: { resetKey: ViewId }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: '' });
  }

  render() {
    if (this.state.error) {
      return (
        <section className="sheet">
          <h1>这一页没有排出来</h1>
          <p>{this.state.error}</p>
        </section>
      );
    }
    return this.props.children;
  }
}

function ChartGate({
  profile,
  onSave,
  children,
}: {
  profile: Profile | null;
  onSave: (profile: Profile) => void;
  children: ReactNode;
}) {
  if (!profile) {
    return (
      <section className="sheet narrow">
        <h1>先留下生辰</h1>
        <p className="lead">命盘按出生年月日时和出生地排。问事和当天吉凶可以不填。</p>
        <ProfileForm initial={null} title="命主" submitLabel="保存并排盘" onSubmit={onSave} />
      </section>
    );
  }
  return children;
}

function Home({
  profile,
  cityName,
  onSave,
  onOpen,
}: {
  profile: Profile | null;
  cityName: string;
  onSave: (profile: Profile) => void;
  onOpen: (view: ViewId) => void;
}) {
  const { session } = useAuth();
  const saved = useMemo(() => profile, [profile]);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">文化娱乐 · 自我对照</p>
        <h1>今天这件事，宜不宜。</h1>
        <p>
          紫微、八字、西洋占星、合婚、易经、塔罗都在。当天吉凶免费看。其余排盘用金币解锁。注册要邮箱验证码，也可以邀请朋友或购买金币。
        </p>
      </section>
      <div className="home-grid">
        <section className="sheet">
          <h2>命主</h2>
          {saved ? (
            <p className="who">
              {saved.name || '未署名'} · {saved.gender === 'male' ? '男' : '女'} · {saved.year}-{pad(saved.month)}-{pad(saved.day)} {pad(saved.hour)}:{pad(saved.minute)} · {cityName}
            </p>
          ) : (
            <p className="lead">命盘需要生辰。只看当天黄历、起卦或抽牌，可以先不填。</p>
          )}
          <ProfileForm initial={saved} title={saved ? '修改生辰' : '填写生辰'} submitLabel={saved ? '更新命主' : '保存命主'} onSubmit={onSave} />
        </section>
        <section className="modules">
          {NAV.map((item) => (
            <button key={item.id} className={item.id === 'daily' ? 'module feature' : 'module'} onClick={() => onOpen(item.id)}>
              <span>{item.kicker}</span>
              <strong>{item.label}</strong>
              <em>
                {item.text}
                {session?.costs[item.id] ? ` · 今日 ${session.costs[item.id]} 金币` : ' · 免费'}
              </em>
            </button>
          ))}
        </section>
      </div>
      <p className="disclaimer">结果供文化娱乐和自我整理，不构成医疗、法律、投资或人生决策建议。</p>
    </>
  );
}
