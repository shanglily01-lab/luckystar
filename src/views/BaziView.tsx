import { useMemo, useState } from 'react';
import { buildBazi } from '../lib/bazi';
import type { Profile } from '../types';

export function BaziView({ profile }: { profile: Profile }) {
  const chart = useMemo(() => buildBazi(profile), [profile]);
  const currentYear = new Date().getFullYear();
  const initial = chart.decades.findIndex(
    (item) => item.ganZhi !== '运前' && currentYear >= item.startYear && currentYear <= item.endYear,
  );
  const [index, setIndex] = useState(initial > 0 ? initial : 1);
  const decade = chart.decades[index] ?? chart.decades[1];
  const max = Math.max(...chart.scores.map((item) => item.value), 1);

  return (
    <section className="sheet">
      <div className="view-head">
        <div>
          <p className="eyebrow">四柱 · 子平换日</p>
          <h1>{profile.name || '命主'}的八字</h1>
        </div>
        <p className="aside">真太阳时 {chart.clockLabel}<br />农历{chart.lunarText} · 属{chart.zodiac}</p>
      </div>
      <div className="pillars">
        {chart.pillars.map((pillar) => (
          <article key={pillar.label}>
            <span>{pillar.label}</span>
            <small>{pillar.stemGod}</small>
            <strong>{pillar.ganZhi[0]}</strong>
            <strong>{pillar.ganZhi[1]}</strong>
            <em>{pillar.hide.map((stem, i) => `${stem}${pillar.hideGod[i] ?? ''}`).join(' ')}</em>
            <small>{pillar.naYin}</small>
            <small>{pillar.diShi} · {pillar.wuXing}</small>
          </article>
        ))}
      </div>
      <div className="bars">
        {chart.scores.map((item) => (
          <div key={item.element}>
            <span>{item.element}</span>
            <i><b style={{ width: `${(item.value / max) * 100}%` }} /></i>
            <small>{item.value}</small>
          </div>
        ))}
      </div>
      <article className="prose">
        <h2>{chart.strong ? '身偏旺' : '身偏弱'} · 参照用神 {chart.useful}</h2>
        <p>{chart.usefulText}</p>
        <p>命宫 {chart.mingGong}，身宫 {chart.shenGong}，胎元 {chart.taiYuan}，胎息 {chart.taiXi}。{chart.startText}。</p>
      </article>
      <h2>大运</h2>
      <div className="decades">
        {chart.decades.map((item) => (
          <button key={item.index} className={item.index === decade?.index ? 'on' : ''} onClick={() => setIndex(item.index)} type="button">
            <strong>{item.ganZhi}</strong>
            <small>{item.startYear}–{item.endYear}</small>
            <small>{item.startAge}–{item.endAge}岁</small>
          </button>
        ))}
      </div>
      {decade ? (
        <div className="years">
          {decade.years.map((year) => (
            <span key={year.year} className={year.year === currentYear ? 'now' : ''}>
              {year.year}
              <small>{year.ganZhi}</small>
            </span>
          ))}
        </div>
      ) : null}
      <h2>取象</h2>
      <div className="image-grid">
        {chart.images.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <p className="disclaimer">旺衰用神是按月令、天干和藏干加权的简论，方便对照，不是盲派全盘，也不能单独决定一件事。</p>
    </section>
  );
}
