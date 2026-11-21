import { useState } from 'react';
import { SPREAD, TAROT_DECK, type TarotCard } from '../data/tarot';

type Draw = { card: TarotCard; reversed: boolean };

export function TarotView() {
  const [question, setQuestion] = useState('');
  const [draws, setDraws] = useState<Draw[] | null>(null);

  function draw() {
    const pool = [...TAROT_DECK];
    const picked: Draw[] = [];
    for (let index = 0; index < 3; index += 1) {
      const at = Math.floor(Math.random() * pool.length);
      const [card] = pool.splice(at, 1);
      picked.push({ card, reversed: Math.random() < 0.35 });
    }
    setDraws(picked);
  }

  return (
    <section className="sheet">
      <div className="view-head">
        <div>
          <p className="eyebrow">三牌阵</p>
          <h1>塔罗</h1>
        </div>
      </div>
      <label className="block-label">
        所问之事
        <textarea value={question} placeholder="可以不写。写了，就只问这一件。" onChange={(event) => setQuestion(event.target.value)} />
      </label>
      <div className="actions">
        <button className="primary" type="button" onClick={draw}>{draws ? '重新抽三张' : '抽三张牌'}</button>
      </div>
      {question.trim() ? <p className="personal">所问：{question.trim()}</p> : null}
      <div className="spread">
        {SPREAD.map((slot, index) => {
          const draw = draws?.[index];
          return (
            <article key={slot.key} className={draw?.reversed ? 'card reversed' : 'card'}>
              <span>{slot.title}</span>
              {draw ? (
                <>
                  <strong>{draw.card.name}</strong>
                  <small>{draw.card.arcana}{draw.reversed ? ' · 逆位' : ' · 正位'}</small>
                  <p>{draw.reversed ? draw.card.reversed : draw.card.upright}</p>
                  <em>{slot.lead}</em>
                </>
              ) : (
                <p className="back">幸运星</p>
              )}
            </article>
          );
        })}
      </div>
      {draws ? (
        <article className="prose">
          <h2>怎么连起来看</h2>
          <p>
            过去那张「{draws[0].card.name}」还留在这件事里。现在你站在「{draws[1].card.name}」。
            如果照现在的做法走，比较会走向「{draws[2].card.name}」。牌倒过来不是凶，只是这张牌的意思用偏了、用过了，或者还没准备好。
          </p>
        </article>
      ) : null}
      <p className="disclaimer">牌面是整理问题的镜子。同一件事可以换个问法再抽，不必追着同一张牌要保证。</p>
    </section>
  );
}
