import { Solar } from 'lunar-javascript';
import type { Profile } from '../types';
import { branchElement, controls, elementPlain, ELEMENTS, generates, stemElement, type Element } from './wuxing';
import { clockText, trueSolar, type Clock } from './time';

function asList(value: { toString(): string }): string[] {
  const text = String(value ?? '');
  return text ? text.split(',') : [];
}

const TEN_GOD: Record<string, string> = {
  比肩: '同辈、合伙人和竞争者都会出现。',
  劫财: '一起做事时，钱和功劳容易被分走。',
  食神: '适合慢慢做、慢慢享受，手艺和口福都在这里。',
  伤官: '想法多、话也冲，适合表达，不适合硬守旧规矩。',
  偏财: '钱来得活，意外的机会比固定工资更多。',
  正财: '收入靠经营，比较稳定，但要自己盯着。',
  七杀: '压力和突发的责任多，扛得住就有位置。',
  正官: '职位和规矩对你重要，按章办事比较顺。',
  偏印: '适合冷门技能和独自琢磨，想得会比较多。',
  正印: '容易得到长辈、证书和庇护。',
  日主: '这就是你自己。',
};

export type Pillar = {
  label: string;
  ganZhi: string;
  stemGod: string;
  hide: string[];
  hideGod: string[];
  naYin: string;
  diShi: string;
  wuXing: string;
};

export type LuckYear = { year: number; age: number; ganZhi: string };
export type LuckDecade = {
  index: number;
  ganZhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  years: LuckYear[];
};

export type BaziChart = {
  clock: Clock;
  clockLabel: string;
  lunarText: string;
  pillars: Pillar[];
  dayMaster: string;
  mingGong: string;
  shenGong: string;
  taiYuan: string;
  taiXi: string;
  scores: { element: Element; value: number }[];
  strong: boolean;
  useful: Element;
  usefulText: string;
  images: { title: string; text: string }[];
  startText: string;
  decades: LuckDecade[];
  zodiac: string;
};

export function buildBazi(profile: Profile): BaziChart {
  const clock = trueSolar(profile);
  const solar = Solar.fromYmdHms(clock.year, clock.month, clock.day, clock.hour, clock.minute, 0);
  const lunar = solar.getLunar();
  const eight = lunar.getEightChar();
  eight.setSect(1);

  const pillars: Pillar[] = [
    {
      label: '年柱',
      ganZhi: eight.getYear(),
      stemGod: eight.getYearShiShenGan(),
      hide: asList(eight.getYearHideGan()),
      hideGod: asList(eight.getYearShiShenZhi()),
      naYin: eight.getYearNaYin(),
      diShi: eight.getYearDiShi(),
      wuXing: eight.getYearWuXing(),
    },
    {
      label: '月柱',
      ganZhi: eight.getMonth(),
      stemGod: eight.getMonthShiShenGan(),
      hide: asList(eight.getMonthHideGan()),
      hideGod: asList(eight.getMonthShiShenZhi()),
      naYin: eight.getMonthNaYin(),
      diShi: eight.getMonthDiShi(),
      wuXing: eight.getMonthWuXing(),
    },
    {
      label: '日柱',
      ganZhi: eight.getDay(),
      stemGod: eight.getDayShiShenGan(),
      hide: asList(eight.getDayHideGan()),
      hideGod: asList(eight.getDayShiShenZhi()),
      naYin: eight.getDayNaYin(),
      diShi: eight.getDayDiShi(),
      wuXing: eight.getDayWuXing(),
    },
    {
      label: '时柱',
      ganZhi: eight.getTime(),
      stemGod: eight.getTimeShiShenGan(),
      hide: asList(eight.getTimeHideGan()),
      hideGod: asList(eight.getTimeShiShenZhi()),
      naYin: eight.getTimeNaYin(),
      diShi: eight.getTimeDiShi(),
      wuXing: eight.getTimeWuXing(),
    },
  ];

  const scores = scoreElements(pillars);
  const dayMaster = pillars[2].ganZhi[0];
  const dm = stemElement(dayMaster);
  const resource = ELEMENTS.find((element) => generates(element) === dm) ?? dm;
  const support = (scores[dm] ?? 0) + (scores[resource] ?? 0);
  const total = ELEMENTS.reduce((sum, element) => sum + (scores[element] ?? 0), 0);
  const strong = support >= total * 0.42;
  const officer = ELEMENTS.find((element) => controls(element) === dm) ?? dm;
  const output = generates(dm);
  const useful = strong
    ? (scores[officer] ?? 0) >= (scores[output] ?? 0)
      ? officer
      : output
    : (scores[resource] ?? 0) >= 0.8
      ? resource
      : dm;

  const gender = profile.gender === 'male' ? 1 : 0;
  const yun = eight.getYun(gender);
  const decades: LuckDecade[] = yun.getDaYun().map((item, index) => ({
    index,
    ganZhi: item.getGanZhi() || '运前',
    startAge: item.getStartAge(),
    endAge: item.getEndAge(),
    startYear: item.getStartYear(),
    endYear: item.getEndYear(),
    years: item.getLiuNian().map((year) => ({
      year: year.getYear(),
      age: year.getAge(),
      ganZhi: year.getGanZhi(),
    })),
  }));

  return {
    clock,
    clockLabel: clockText(clock),
    lunarText: lunar.toString(),
    pillars,
    dayMaster,
    mingGong: eight.getMingGong(),
    shenGong: eight.getShenGong(),
    taiYuan: eight.getTaiYuan(),
    taiXi: eight.getTaiXi(),
    scores: ELEMENTS.map((element) => ({ element, value: Math.round((scores[element] ?? 0) * 10) / 10 })),
    strong,
    useful,
    usefulText: strong
      ? `你这个人力气偏旺。五行是${dm}，偏向${elementPlain(dm)}。力气旺的时候，适合把劲用出去：做事、扛责任、去争取，比一味休养更顺。可以多碰「${useful}」这类事，也就是${elementPlain(useful)}。`
      : `你这个人力气偏弱。五行是${dm}，偏向${elementPlain(dm)}。先找人帮、先把身体和底气养够，再去硬扛，会比一个人冲更合适。可以多靠「${useful}」，也就是${elementPlain(useful)}。`,
    images: [
      { title: '早年与长辈', text: `这一柱是${pillars[0].ganZhi}。它看早年、家里和长辈给你的底子。这一面是：${TEN_GOD[pillars[0].stemGod] ?? '和你自己的脾气有关。'}` },
      { title: '事业与出门', text: `这一柱是${pillars[1].ganZhi}。它看你出门做事、工作里最常见的情况。这一面是：${TEN_GOD[pillars[1].stemGod] ?? '和你做事的方式有关。'}` },
      {
        title: '亲近的人',
        text: `和你朝夕相处的人，往往带着这些特点：${pillars[2].hideGod.map((god) => TEN_GOD[god] ?? god).join('') || '看不太出固定的一种。'}`,
      },
      { title: '往后与成果', text: `这一柱是${pillars[3].ganZhi}。它看晚些时候的出口、你做出来的东西，以及晚辈。这一面是：${TEN_GOD[pillars[3].stemGod] ?? '和你后来怎么收场有关。'}` },
    ],
    startText: `${yun.getStartYear()}年${yun.getStartMonth()}个月${yun.getStartDay()}天，约 ${yun.getStartSolar().toYmd()} 起运`,
    decades,
    zodiac: lunar.getYearShengXiao(),
  };
}

function scoreElements(pillars: Pillar[]) {
  const scores: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const weights = [1, 1.2, 1, 1];
  pillars.forEach((pillar, index) => {
    scores[stemElement(pillar.ganZhi[0])] += weights[index];
    pillar.hide.forEach((stem, hideIndex) => {
      scores[stemElement(stem)] += hideIndex === 0 ? 0.7 : 0.35;
    });
  });
  scores[branchElement(pillars[1].ganZhi[1])] += 1.6;
  return scores;
}
