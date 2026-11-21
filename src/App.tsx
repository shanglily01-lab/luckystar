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
import { readAlmanac } from './lib/daily';
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
            首页
          </button>
          <button
            className={view === 'catalog' || NAV.some((item) => item.id === view) ? 'on' : ''}
            onClick={() => show('catalog')}
          >
            占卜
          </button>
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
            {previous === 'home' ? '返回首页' : previous === 'catalog' ? '返回占卜' : '返回'}
          </button>
        ) : null}
        <ViewBoundary resetKey={view}>
        {view === 'home' ? (
          <Home
            profile={profile}
            cityName={cityName}
            onSave={save}
            onOpen={open}
          />
        ) : null}
        {view === 'catalog' ? <Catalog onOpen={open} /> : null}
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
  onOpen,
}: {
  profile: Profile | null;
  cityName: string;
  onSave: (profile: Profile) => void;
  onOpen: (view: ViewId) => void;
}) {
  const saved = useMemo(() => profile, [profile]);
  const today = useMemo(() => readAlmanac(new Date()), []);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">第一页 · 幸运星</p>
        <h1>先看今天，再决定要不要问。</h1>
        <p>这一页是入口。当天吉凶免费看。紫微、八字、西洋占星、合婚、易经、塔罗都在下一页「占卜」里，按次用金币。</p>
        <div className="hero-actions">
          <button className="primary" type="button" onClick={() => onOpen('daily')}>
            看当天吉凶
          </button>
          <button className="ghost light" type="button" onClick={() => onOpen('catalog')}>
            进入占卜
          </button>
        </div>
      </section>
      <div className="home-grid">
        <section className="sheet today-card">
          <p className="eyebrow">{today.weekday}</p>
          <h2>{today.solarText}</h2>
          <p className="who">
            {today.lunarText} · {today.yearGZ}年 · {today.dayGZ}日
          </p>
          <p>宜 {today.yi.slice(0, 4).join('、') || '今日没有特别宜做的事'}</p>
          <p>忌 {today.ji.slice(0, 4).join('、') || '今日没有特别忌做的事'}</p>
          <button className="ghost" type="button" onClick={() => onOpen('daily')}>
            按事项看今天
          </button>
        </section>
        <section className="sheet">
          <h2>命主</h2>
          {saved ? (
            <p className="who">
              {saved.name || '未署名'} · {saved.gender === 'male' ? '男' : '女'} · {saved.year}-{pad(saved.month)}-{pad(saved.day)} {pad(saved.hour)}:{pad(saved.minute)} · {cityName}
            </p>
          ) : (
            <p className="lead">排盘需要生辰。只看今天、起卦或抽牌，可以先不填。</p>
          )}
          <ProfileForm initial={saved} title={saved ? '修改生辰' : '填写生辰'} submitLabel={saved ? '更新命主' : '保存命主'} onSubmit={onSave} />
        </section>
      </div>
      <p className="disclaimer">结果供文化娱乐和自我整理，不构成医疗、法律、投资或人生决策建议。</p>
    </>
  );
}

function Catalog({ onOpen }: { onOpen: (view: ViewId) => void }) {
  const { session } = useAuth();
  return (
    <>
      <section className="hero">
        <p className="eyebrow">占卜</p>
        <h1>选一种看法。</h1>
        <p>当天吉凶免费。其余排盘、合婚、问卦和抽牌，登录后按次扣金币。</p>
      </section>
      <section className="modules">
        {NAV.map((item) => (
          <button key={item.id} className={item.id === 'daily' ? 'module feature' : 'module'} type="button" onClick={() => onOpen(item.id)}>
            <span>{item.kicker}</span>
            <strong>{item.label}</strong>
            <em>
              {item.text}
              {session?.costs[item.id] ? ` · 今日 ${session.costs[item.id]} 金币` : ' · 免费'}
            </em>
          </button>
        ))}
      </section>
    </>
  );
}
