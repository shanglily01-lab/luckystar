import { useState } from 'react';
import { hexSymbol } from '../data/hexagrams';
import { castFromLines, castMeihua, lineNotes, throwCoins, type CastLine, type CastResult } from '../lib/yijing';

export function YijingView({ question, onQuestion }: { question: string; onQuestion: (value: string) => void }) {
  const [lines, setLines] = useState<CastLine[]>([]);
  const [result, setResult] = useState<CastResult | null>(null);

  function shake() {
    const next = [...lines, throwCoins()];
    setLines(next);
    if (next.length === 6) setResult(castFromLines(question.trim() || '未写所问', next, '铜钱六爻'));
  }

  function reset() {
    setLines([]);
    setResult(null);
  }

  function meihua() {
    const cast = castMeihua(question.trim() || '未写所问');
    setLines(cast.lines);
    setResult(cast);
  }

  return (
    <section className="sheet">
      <div className="view-head">
        <div>
          <p className="eyebrow">起卦 · 本卦与变爻</p>
          <h1>易经问事</h1>
        </div>
      </div>
      <label className="block-label">
        所问之事
        <textarea
          value={question}
          placeholder="一件具体的事，例如：这个月要不要换工作"
          onChange={(event) => onQuestion(event.target.value)}
        />
      </label>
      <div className="coin-row">
        {Array.from({ length: 6 }, (_, index) => {
          const line = lines[index];
          return (
            <div key={index} className={line ? 'yao on' : 'yao'}>
              <b>{line ? (line.yang ? '—' : '- -') : index + 1}</b>
              <small>{line ? (line.changing ? '变' : '静') : '未摇'}</small>
            </div>
          );
        })}
      </div>
      <div className="actions">
        <button className="primary" type="button" onClick={shake} disabled={lines.length >= 6}>
          {lines.length >= 6 ? '六爻已齐' : `摇第 ${lines.length + 1} 爻`}
        </button>
        <button className="ghost" type="button" onClick={meihua}>按此刻起梅花卦</button>
        <button className="ghost" type="button" onClick={reset}>重来</button>
      </div>
      {lines.length > 0 && lines[lines.length - 1].coins.length > 0 ? (
        <p className="hint">
          最近一掷：{lines[lines.length - 1].coins.map((coin) => (coin === 3 ? '字' : '背')).join(' ')}，
          合计 {lines[lines.length - 1].value}。
          6 和 9 表示这一层会变，7 和 8 表示这一层保持原样。
        </p>
      ) : null}
      {result ? <Reading result={result} /> : null}
      <p className="disclaimer">卦是把问题摊开的一种说法。变爻指出要动的那一层，不代替你做决定。</p>
    </section>
  );
}

function Reading({ result }: { result: CastResult }) {
  const notes = lineNotes(result);
  return (
    <article className="prose">
      <p className="hint">{result.method} · {result.question}</p>
      <div className="gua-pair">
        <Gua title="眼前" gua={result.original} lines={result.lines.map((line) => line.yang)} changing={result.changing} />
        {result.changed ? (
          <Gua
            title="变动后"
            gua={result.changed}
            lines={result.lines.map((line) => (line.changing ? !line.yang : line.yang))}
            changing={[]}
          />
        ) : (
          <p>没有变动的一层，看眼前这卦就够了。</p>
        )}
      </div>
      <h2>{hexSymbol(result.original.no)} {result.original.name}</h2>
      <p>{result.original.summary}</p>
      <p>{result.original.advice}</p>
      {result.changed ? (
        <>
          <h2>变动之后是 {hexSymbol(result.changed.no)} {result.changed.name}</h2>
          <p>{result.changed.summary}{result.changed.advice}</p>
        </>
      ) : null}
      <ul>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </article>
  );
}

function Gua({
  title,
  gua,
  lines,
  changing,
}: {
  title: string;
  gua: { no: number; name: string };
  lines: boolean[];
  changing: number[];
}) {
  return (
    <div className="gua">
      <span>{title}</span>
      <div>
        {[...lines].reverse().map((yang, index) => {
          const real = 5 - index;
          return <i key={real} className={yang ? (changing.includes(real) ? 'yang change' : 'yang') : changing.includes(real) ? 'yin change' : 'yin'} />;
        })}
      </div>
      <strong>{hexSymbol(gua.no)} {gua.name}</strong>
    </div>
  );
}
