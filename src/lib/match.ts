import type { Profile } from '../types';
import { buildBazi } from './bazi';
import { buildWest } from './west';
import { branchRelation, elementPlain, relationPlain, stemElement, stemRelation, type Element } from './wuxing';

export type MatchSide = {
  name: string;
  zodiac: string;
  day: string;
  year: string;
  sun: string;
  element: Element;
};

export type MatchReport = {
  score: number;
  label: string;
  a: MatchSide;
  b: MatchSide;
  lines: { title: string; text: string; score: number }[];
  summary: string;
};

function side(profile: Profile): MatchSide {
  const bazi = buildBazi(profile);
  const west = buildWest(profile);
  return {
    name: profile.name || '未名',
    zodiac: bazi.zodiac,
    day: bazi.pillars[2].ganZhi,
    year: bazi.pillars[0].ganZhi,
    sun: west.sun,
    element: stemElement(bazi.dayMaster),
  };
}

function stemFeel(relation: string) {
  if (relation === '比和' || relation === '同类') return '两个人脾气相近，也容易较劲。';
  if (relation === '天干相合') return '容易互相吸引，也好商量。';
  if (relation.includes('生')) return '一个会自然帮着另一个，被帮的那个更省力。';
  if (relation.includes('克')) return '两个人会互相卡，一个容易觉得另一个管得太紧。';
  return '没有明显的谁帮谁、谁压谁。';
}

function relationScore(relation: string) {
  if (relation === '六合') return 92;
  if (relation === '三合') return 84;
  if (relation === '比和') return 74;
  if (relation === '平常') return 64;
  if (relation === '六害') return 46;
  if (relation === '六冲') return 36;
  return 60;
}

export function buildMatch(aProfile: Profile, bProfile: Profile): MatchReport {
  const a = side(aProfile);
  const b = side(bProfile);
  const yearRel = branchRelation(a.year[1], b.year[1]);
  const dayRel = branchRelation(a.day[1], b.day[1]);
  const stemRel = stemRelation(a.day[0], b.day[0]);
  const yearScore = relationScore(yearRel);
  const dayScore = relationScore(dayRel);
  let stemScore = 68;
  if (stemRel === '天干相合') stemScore = 90;
  else if (stemRel.includes('克')) stemScore = 48;
  else if (stemRel.includes('生') || stemRel === '同类' || stemRel === '比和') stemScore = 80;

  const elementHarmony =
    a.element === b.element ? 76 : a.sun === b.sun ? 70 : 64;
  const sunScore = a.sun === b.sun ? 78 : elementHarmony;

  const score = Math.round(yearScore * 0.22 + dayScore * 0.4 + stemScore * 0.24 + sunScore * 0.14);
  const label = score >= 82 ? '很相合' : score >= 70 ? '可相处' : score >= 58 ? '需磨合' : '宜慢一点';

  const lines = [
    {
      title: '表面相处',
      score: yearScore,
      text: `${a.name}属${a.zodiac}，${b.name}属${b.zodiac}。外人看起来，你们${relationPlain(yearRel)}。`,
    },
    {
      title: '日常相处',
      score: dayScore,
      text: `真的天天在一起时，你们${relationPlain(dayRel)}。这一层比生肖更要紧。`,
    },
    {
      title: '谁顺着谁',
      score: stemScore,
      text: `${a.name}是${a.element}（${elementPlain(a.element)}），${b.name}是${b.element}（${elementPlain(b.element)}）。${stemFeel(stemRel)}谁让着谁，最好先说好。`,
    },
    {
      title: '说话方式',
      score: sunScore,
      text: `${a.name}给人的感觉偏${a.sun}，${b.name}偏${b.sun}。这只说明表达方式，不是两个人合不合适的全部。`,
    },
  ];

  const summary =
    score >= 70
      ? '两个人有地方能接上。把钱、时间和家务说具体，比追究谁更配更有用。'
      : score >= 58
        ? '没有明显的合，也没有明显的冲。把日常怎么分工说清楚，比追究谁更配更有用。'
        : '盘上有顶着的地方。不是不能相处，是要把容易冲突的那一项写成约定。';

  return { score, label, a, b, lines, summary };
}
