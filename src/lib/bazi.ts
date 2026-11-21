import { Solar } from 'lunar-javascript';
import type { Profile } from '../types';
import { branchElement, controls, ELEMENTS, generates, stemElement, type Element } from './wuxing';
import { clockText, trueSolar, type Clock } from './time';

function asList(value: { toString(): string }): string[] {
  const text = String(value ?? '');
  return text ? text.split(',') : [];
}

const TEN_GOD: Record<string, string> = {
  比肩: '同辈与自己人，也是竞争。',
  劫财: '合伙里容易分走的那一份。',
  食神: '慢慢做出来的才，口福和产出。',
  伤官: '表达、破格、才气外露。',
  偏财: '流动的资源和意外之财。',
  正财: '分内、稳定、要经营的收入。',
  七杀: '压力、权威和突发的责任。',
  正官: '职位、规则和正当的约束。',
  偏印: '冷门技能和想得很多的脑子。',
  正印: '庇护、证书和长辈的托。',
  日主: '自己。',
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
  const wealth = controls(dm);
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
      ? `日主${dayMaster}${dm}偏旺，简论宜泄宜克。食伤为${output}，官杀为${officer}，财为${wealth}。此处取${useful}作参照，用来看哪一类事更能把力气用出去。`
      : `日主${dayMaster}${dm}偏弱，简论宜生宜扶。印为${resource}，比劫为${dm}。此处取${useful}作参照，适合把根基和帮手放在这类五行上。`,
    images: [
      { title: '年柱 · 根源', text: `${pillars[0].ganZhi}，天干${pillars[0].stemGod}。${TEN_GOD[pillars[0].stemGod] ?? ''}看早年场面、长辈和出身的气候。` },
      { title: '月柱 · 大纲', text: `${pillars[1].ganZhi}，月令是事业和出门见到的天气。天干${pillars[1].stemGod}，${TEN_GOD[pillars[1].stemGod] ?? ''}` },
      { title: '日支 · 配偶宫', text: `日支${pillars[2].ganZhi[1]}藏${pillars[2].hide.join('、') || '—'}，十神${pillars[2].hideGod.join('、') || '—'}。亲近的人，往往带着这股气。` },
      { title: '时柱 · 归宿', text: `${pillars[3].ganZhi}，天干${pillars[3].stemGod}。${TEN_GOD[pillars[3].stemGod] ?? ''}看晚一点的出口、作品和晚辈。` },
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
