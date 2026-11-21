import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
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
  const [history, setHistory] = useState<ViewId[]>(['home']);
  const view = history[history.length - 1] ?? 'home';
  const previous = history.length > 1 ? history[history.length - 2] : null;
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
        setHistory(['home', 'account']);
      })
      .catch((reason) => {
        setFlash(reason instanceof Error ? reason.message : '激活没有完成');
        setHistory(['home', 'auth']);
      });
  }, [ready, activate]);

  function save(next: Profile) {
    saveProfile(next);
    setProfile(next);
  }

  function open(next: ViewId) {
    setHistory((prev) => (prev[prev.length - 1] === next ? prev : [...prev, next]));
  }

  function back() {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : ['home']));
  }

  function show(next: ViewId) {
    setHistory(next === 'home' ? ['home'] : ['home', next]);
  }

  function openAuth() {
    open('auth');
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
        <button className="brand" onClick={() => show('home')}>
          <span className="seal">星</span>
          <span>
            <strong>幸运星</strong>
            <small>排盘 · 问事 · 当天吉凶</small>
          </span>
        </button>
        <nav>
          <button className={view === 'home' ? 'on' : ''} onClick={() => show('home')}>
            命主
          </button>
          {NAV.map((item) => (
            <button key={item.id} className={view === item.id ? 'on' : ''} onClick={() => show(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button
          className="account-chip"
          type="button"
          onClick={() => (session?.user ? open('account') : openAuth())}
        >
          {accountLabel}
        </button>
      </header>

      <main>
        {flash ? <p className="flash">{flash}</p> : null}
        {previous ? (
          <button className="back" type="button" onClick={back}>
            {previous === 'home' ? '返回命主' : '返回'}
          </button>
        ) : null}
        <ViewBoundary resetKey={view}>
        {view === 'home' ? <Home profile={profile} cityName={cityName} onSave={save} /> : null}
        {view === 'daily' ? (
          <DailyView
            profile={profile}
            onAsk={(text) => {
              setQuestion(text);
              open('yijing');
            }}
          />
        ) : null}
        {view === 'ziwei' ? (
          <ChartGate profile={profile} onSave={save}>
            <PayGate feature="ziwei" title="紫微斗数" onLogin={openAuth} onAccount={() => open('account')}>
              <ZiweiView profile={profile!} />
            </PayGate>
          </ChartGate>
        ) : null}
        {view === 'bazi' ? (
          <ChartGate profile={profile} onSave={save}>
            <PayGate feature="bazi" title="八字命盘" onLogin={openAuth} onAccount={() => open('account')}>
              <BaziView profile={profile!} />
            </PayGate>
          </ChartGate>
        ) : null}
        {view === 'west' ? (
          <ChartGate profile={profile} onSave={save}>
            <PayGate feature="west" title="西洋占星" onLogin={openAuth} onAccount={() => open('account')}>
              <WestView profile={profile!} />
            </PayGate>
          </ChartGate>
        ) : null}
        {view === 'match' ? (
          <PayGate feature="match" title="姻缘合盘" onLogin={openAuth} onAccount={() => open('account')}>
            <MatchView selfProfile={profile} onSaveSelf={save} />
          </PayGate>
        ) : null}
        {view === 'yijing' ? (
          <PayGate feature="yijing" title="易经问事" onLogin={openAuth} onAccount={() => open('account')}>
            <YijingView question={question} onQuestion={setQuestion} />
          </PayGate>
        ) : null}
        {view === 'tarot' ? (
          <PayGate feature="tarot" title="塔罗三牌" onLogin={openAuth} onAccount={() => open('account')}>
            <TarotView />
          </PayGate>
        ) : null}
        {view === 'auth' ? (
          <AuthView
            inviteCode={inviteCode}
            onInviteCode={rememberInvite}
            onDone={back}
          />
        ) : null}
        {view === 'account' ? <AccountView onLogin={openAuth} /> : null}
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
}: {
  profile: Profile | null;
  cityName: string;
  onSave: (profile: Profile) => void;
}) {
  return (
    <section className="sheet profile-sheet">
      <p className="eyebrow">命主</p>
      <h1>{profile ? '核对生辰' : '先登记生辰'}</h1>
      {profile ? (
        <p className="who">
          {profile.name || '未署名'} · {profile.gender === 'male' ? '男' : '女'} · {profile.year}-{pad(profile.month)}-{pad(profile.day)} {pad(profile.hour)}:{pad(profile.minute)} · {cityName}
        </p>
      ) : (
        <p className="lead">排盘按出生年月日时和出生地。当天吉凶、起卦和抽牌可以先不填，上面的标签都能直接打开。</p>
      )}
      <ProfileForm
        initial={profile}
        title={profile ? '修改生辰' : '填写生辰'}
        submitLabel={profile ? '更新命主' : '保存命主'}
        onSubmit={onSave}
      />
    </section>
  );
}
