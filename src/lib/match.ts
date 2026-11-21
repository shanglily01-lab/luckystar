import type { Profile } from '../types';
import { buildBazi } from './bazi';
import { buildWest } from './west';
import { branchRelation, stemElement, stemRelation, type Element } from './wuxing';

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
      title: '生肖年支',
      score: yearScore,
      text: `${a.name}属${a.zodiac}（${a.year}），${b.name}属${b.zodiac}（${b.year}），年支${yearRel}。这是外人眼中的相处节奏。`,
    },
    {
      title: '日支配偶宫',
      score: dayScore,
      text: `${a.name}日支${a.day[1]}，${b.name}日支${b.day[1]}，${dayRel}。日支看住在一起之后的日常，比年支更贴身。`,
    },
    {
      title: '日主天干',
      score: stemScore,
      text: `${a.day[0]}与${b.day[0]}为${stemRel}。${a.element}与${b.element}的生克，决定谁更容易迁就谁。`,
    },
    {
      title: '太阳星座',
      score: sunScore,
      text: `${a.name}太阳${a.sun}，${b.name}太阳${b.sun}。星座看表达方式，合盘里它只占一成多，不当成全部。`,
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
