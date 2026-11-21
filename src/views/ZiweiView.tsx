import { useMemo, useState } from 'react';
import { buildZiwei, palaceReading, starLabel, yearStars } from '../lib/ziwei';
import type { Profile } from '../types';

const AREA: Record<string, string> = {
  巳: 'si',
  午: 'wu',
  未: 'wei',
  申: 'shen',
  辰: 'chen',
  酉: 'you',
  卯: 'mao',
  戌: 'xu',
  寅: 'yin',
  丑: 'chou',
  子: 'zi',
  亥: 'hai',
};

export function ZiweiView({ profile }: { profile: Profile }) {
  const chart = useMemo(() => buildZiwei(profile), [profile]);
  const [branch, setBranch] = useState(
    () => chart.palaces.find((palace) => palace.name === '命宫')?.earthlyBranch ?? '子',
  );
  const selected = chart.palaces.find((palace) => palace.earthlyBranch === branch) ?? chart.palaces[0];

  return (
    <section className="sheet">
      <div className="view-head">
        <div>
          <p className="eyebrow">十二宫 · 生年四化</p>
          <h1>{profile.name || '命主'}的紫微</h1>
        </div>
        <p className="aside">
          {chart.fiveElementsClass} · 命主{chart.soul} · 身主{chart.body}
          <br />
          {chart.chineseDate} · {chart.time} {chart.timeRange}
        </p>
      </div>
      <p className="personal">
        农历 {chart.lunarDate}，属{chart.zodiac}，星座{chart.sign}。今年是{chart.yearName}年，特别亮的四颗星是：{yearStars(chart.yearMutagen)}。
      </p>
      <div className="ziwei">
        {chart.palaces.map((palace) => (
          <button
            key={palace.earthlyBranch}
            type="button"
            style={{ gridArea: AREA[palace.earthlyBranch] }}
            className={palace.earthlyBranch === branch ? 'on' : ''}
            onClick={() => setBranch(palace.earthlyBranch)}
          >
            <header>
              <b>{palace.name}</b>
              <small>
                {palace.heavenlyStem}
                {palace.earthlyBranch}
                {palace.isBodyPalace ? ' · 身' : ''}
                {palace.earthlyBranch === chart.yearBranch ? ' · 流年' : ''}
              </small>
            </header>
            <p>
              {palace.majorStars.length
                ? palace.majorStars.map((star) => (
                    <em key={star.name} data-m={star.mutagen || ''}>
                      {starLabel(star)}
                    </em>
                  ))
                : <em className="empty">空宫</em>}
            </p>
            <small className="minor">
              {palace.minorStars.slice(0, 4).map((star) => star.name).join(' ')}
            </small>
            <small>限 {palace.decadal.range[0]}–{palace.decadal.range[1]}</small>
          </button>
        ))}
        <div className="ziwei-core">
          <strong>{profile.name || '命主'}</strong>
          <span>{profile.gender === 'male' ? '男' : '女'} · {chart.fiveElementsClass}</span>
          <span>命主 {chart.soul}</span>
          <span>身主 {chart.body}</span>
        </div>
      </div>
      <article className="prose">
        <h2>{selected.name} · {selected.heavenlyStem}{selected.earthlyBranch}</h2>
        <p>{palaceReading(selected, chart.palaces)}</p>
      </article>
      <p className="disclaimer">点开一宫，下面那段是在说这块生活怎么过。星名留在盘上方便对照，不是一句定论。</p>
    </section>
  );
}
