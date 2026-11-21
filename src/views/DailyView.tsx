import { useMemo, useState, type FormEvent } from 'react';
import { askToday, buildDaily, type MatterLuck } from '../lib/daily';
import type { Profile } from '../types';

export function DailyView({ profile, onAsk }: { profile: Profile | null; onAsk: (question: string) => void }) {
  const [dateText, setDateText] = useState(() => toInput(new Date()));
  const [picked, setPicked] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  const date = useMemo(() => fromInput(dateText), [dateText]);
  const board = useMemo(() => buildDaily(date, profile), [date, profile]);
  const answer = asked ? askToday(asked, board) : null;
  const selected = board.matters.find((item) => item.matter.id === (answer?.item?.matter.id ?? picked)) ?? null;

  function ask(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    const next = askToday(text, board);
    setAsked(text);
    setPicked(next.item?.matter.id ?? null);
  }

  return (
    <section className="sheet">
      <div className="view-head">
        <div>
          <p className="eyebrow">当天占事</p>
          <h1>具体事项的吉凶</h1>
        </div>
        <label className="date-label">
          日期
          <input type="date" value={dateText} onChange={(event) => setDateText(event.target.value)} />
        </label>
      </div>
      <div className="almanac">
        <div>
          <strong>{board.almanac.solarText}</strong>
          <span>{board.almanac.weekday} · {board.almanac.lunarText}</span>
          <span>{board.almanac.yearGZ}年 {board.almanac.monthGZ}月 {board.almanac.dayGZ}日 · 属{board.almanac.zodiac}</span>
        </div>
        <div className="score-orb" data-v={board.overall}>
          <b>{board.overall}</b>
          <small>{board.overallScore}</small>
        </div>
      </div>
      <p className="personal">{board.personal}</p>
      <form className="ask" onSubmit={ask}>
        <label>
          问今天这一件
          <input
            value={question}
            placeholder="例如：今天下午适合签合同吗"
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>
        <button className="primary" type="submit">看吉凶</button>
      </form>
      {answer ? <p className="hint">所问：{asked}。{answer.note}</p> : null}
      <div className="chips">
        <span>宜 {board.almanac.yi.join('、')}</span>
        <span>忌 {board.almanac.ji.join('、')}</span>
      </div>
      <dl className="facts">
        <div><dt>容易冲到</dt><dd>{board.almanac.chong}，不利方向 {board.almanac.sha}</dd></div>
        <div><dt>顺利的方位</dt><dd>{board.almanac.xi}</dd></div>
        <div><dt>得帮助的方位</dt><dd>{board.almanac.fu}</dd></div>
        <div><dt>和钱有关的方位</dt><dd>{board.almanac.cai}</dd></div>
        <div><dt>今天这一天</dt><dd>{board.almanac.zhiXing}日</dd></div>
        <div><dt>星宿</dt><dd>{board.almanac.xiu}</dd></div>
        <div><dt>节气</dt><dd>{board.almanac.jie}</dd></div>
        <div><dt>老黄历口诀</dt><dd>{board.almanac.pengzu}</dd></div>
      </dl>
      <div className="matter-grid">
        {board.matters.map((item) => (
          <button
            key={item.matter.id}
            className={picked === item.matter.id ? 'matter on' : 'matter'}
            onClick={() => setPicked(item.matter.id)}
          >
            <i data-v={item.verdict}>{item.verdict}</i>
            <strong>{item.matter.name}</strong>
            <em>{item.matter.hint}</em>
          </button>
        ))}
      </div>
      {selected ? <MatterDetail item={selected} question={asked} onAsk={onAsk} /> : <p className="hint">写下今天要办的事，或点开下面一类。</p>}
      <p className="disclaimer">吉凶是把黄历适合不适合、今天是什么样的日子、你的生肖合不合，合在一起看的。同一天同一件事，结果是固定的。拿来对照就好，不是必须照做。</p>
    </section>
  );
}

function MatterDetail({ item, question, onAsk }: { item: MatterLuck; question: string; onAsk: (question: string) => void }) {
  const goodHours = item.hours.filter((hour) => hour.good && !hour.bad);
  return (
    <article className="detail">
      <header>
        <h2>{item.matter.name}</h2>
        <span className="badge" data-v={item.verdict}>{item.verdict} · {item.score}</span>
      </header>
      <ul>
        {item.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p>{item.advice}</p>
      <div className="hours">
        {item.hours.map((hour) => (
          <span key={hour.ganZhi + hour.range} className={hour.bad ? 'bad' : hour.good ? 'good' : ''}>
            {hour.ganZhi}
            <small>{hour.range}</small>
          </span>
        ))}
      </div>
      <p className="hint">绿色钟点更适合办这件事，红色钟点先避开。{goodHours.length ? '' : '今天没有直接适合这件事的钟点。'}</p>
      <button className="ghost" type="button" onClick={() => onAsk(question || `今日${item.matter.name}，可否进行？`)}>
        就这件事再起一卦
      </button>
    </article>
  );
}

function toInput(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}
