import { useMemo } from 'react';
import { SIGN_GLYPH, buildWest, type WestChart } from '../lib/west';
import type { Profile } from '../types';

export function WestView({ profile }: { profile: Profile }) {
  const chart = useMemo(() => buildWest(profile), [profile]);
  return (
    <section className="sheet">
      <div className="view-head">
        <div>
          <p className="eyebrow">本命盘 · 等宫制</p>
          <h1>{profile.name || '命主'}的星盘</h1>
        </div>
        <p className="aside">
          太阳 {chart.sun} · 月亮 {chart.moon}
          <br />
          上升 {chart.rising} · 中天 {chart.mcSign}
        </p>
      </div>
      <div className="west-layout">
        <Wheel chart={chart} />
        <div>
          <table className="planet-table">
            <thead>
              <tr><th>星</th><th>星座</th><th>度数</th><th>宫</th></tr>
            </thead>
            <tbody>
              {chart.planets.map((planet) => (
                <tr key={planet.name}>
                  <td>{planet.glyph} {planet.name}</td>
                  <td>{planet.sign}</td>
                  <td>{planet.degree.toFixed(1)}°</td>
                  <td>{planet.house}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2>相位</h2>
          <ul className="aspects">
            {chart.aspects.map((aspect) => (
              <li key={aspect.a + aspect.b + aspect.name}>
                {aspect.a}{aspect.name}{aspect.b}
                <small>容许 {aspect.orb}°</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <article className="prose">
        <h2>日、月与上升</h2>
        <p>{chart.reading}</p>
      </article>
      <p className="disclaimer">行星黄经用天文历算，宫位用上升点起的等宫制，不是整宫或普拉西德。上升受出生时刻影响很大。</p>
    </section>
  );
}

function Wheel({ chart }: { chart: WestChart }) {
  const cx = 210;
  const cy = 210;
  function point(longitude: number, radius: number) {
    const angle = ((180 + (longitude - chart.ascendant)) * Math.PI) / 180;
    return [cx + radius * Math.cos(angle), cy - radius * Math.sin(angle)];
  }
  const signs = Array.from({ length: 12 }, (_, index) => index * 30);
  const houses = Array.from({ length: 12 }, (_, index) => chart.ascendant + index * 30);
  return (
    <svg className="wheel" viewBox="0 0 420 420" role="img" aria-label="本命盘，上升在左侧">
      <circle cx={cx} cy={cy} r={188} />
      <circle cx={cx} cy={cy} r={150} />
      <circle cx={cx} cy={cy} r={108} />
      {signs.map((degree, index) => {
        const [x1, y1] = point(degree, 150);
        const [x2, y2] = point(degree, 188);
        const [lx, ly] = point(degree + 15, 169);
        return (
          <g key={`sign-${degree}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <text x={lx} y={ly}>{SIGN_GLYPH[index]}</text>
          </g>
        );
      })}
      {houses.map((degree, index) => {
        const [x1, y1] = point(degree, 108);
        const [x2, y2] = point(degree, 150);
        const [lx, ly] = point(degree + 15, 78);
        return (
          <g key={`house-${index}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <text className="house-no" x={lx} y={ly}>{index + 1}</text>
          </g>
        );
      })}
      {chart.planets.map((planet) => {
        const [x, y] = point(planet.longitude, 128);
        return (
          <text key={planet.name} className="planet-glyph" x={x} y={y}>{planet.glyph}</text>
        );
      })}
    </svg>
  );
}
