import { Solar } from 'lunar-javascript';
import { findCity } from '../data/cities';
import { MATTERS, type Matter } from '../data/matters';
import type { Profile, Verdict } from '../types';
import { buildBazi } from './bazi';
import {
  branchRelation,
  controls,
  elementColor,
  elementPlain,
  generates,
  relationPlain,
  stemElement,
  type Element,
} from './wuxing';

export type HourLuck = {
  ganZhi: string;
  range: string;
  good: boolean;
  bad: boolean;
};

export type MatterLuck = {
  matter: Matter;
  score: number;
  verdict: Verdict;
  reasons: string[];
  advice: string;
  color: string;
  hours: HourLuck[];
};

export type Almanac = {
  solarText: string;
  lunarText: string;
  yearGZ: string;
  monthGZ: string;
  dayGZ: string;
  zodiac: string;
  dayZodiac: string;
  yi: string[];
  ji: string[];
  chong: string;
  sha: string;
  pengzu: string;
  xi: string;
  fu: string;
  cai: string;
  jiShen: string;
  xiongSha: string;
  zhiXing: string;
  tianShen: string;
  xiu: string;
  jie: string;
  weekday: string;
};

export type DailyBoard = {
  almanac: Almanac;
  personal: string;
  overall: Verdict;
  overallScore: number;
  matters: MatterLuck[];
};

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

const DAY_KIND: Record<string, string> = {
  建: '适合起头、定规矩',
  除: '适合清理旧的、去掉不要的',
  满: '容易满，也容易过头，见好就收',
  平: '平平常常，按部就班就好',
  定: '适合把事情定下来',
  执: '适合按已经定好的计划做',
  破: '旧安排容易破，不宜硬开工',
  危: '要多留神，别赶',
  成: '事情比较容易做成',
  收: '适合收尾、收款、归档',
  开: '适合开工、开业、开口',
  闭: '适合收着，不宜大张旗鼓',
};

function verdictOf(score: number): Verdict {
  if (score >= 82) return '大吉';
  if (score >= 68) return '吉';
  if (score >= 52) return '平';
  if (score >= 40) return '小凶';
  return '凶';
}

function hit(list: string[], keys: string[]) {
  return list.filter((item) => keys.some((key) => item.includes(key) || key.includes(item)));
}

export function readAlmanac(date: Date): Almanac {
  const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const lunar = solar.getLunar();
  return {
    solarText: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
    lunarText: `农历${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    yearGZ: lunar.getYearInGanZhi(),
    monthGZ: lunar.getMonthInGanZhi(),
    dayGZ: lunar.getDayInGanZhi(),
    zodiac: lunar.getYearShengXiao(),
    dayZodiac: lunar.getDayShengXiao(),
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
    chong: lunar.getDayChongDesc(),
    sha: lunar.getDaySha(),
    pengzu: `${lunar.getPengZuGan()} ${lunar.getPengZuZhi()}`,
    xi: lunar.getDayPositionXiDesc(),
    fu: lunar.getDayPositionFuDesc(),
    cai: lunar.getDayPositionCaiDesc(),
    jiShen: String(lunar.getDayJiShen()),
    xiongSha: String(lunar.getDayXiongSha()),
    zhiXing: lunar.getZhiXing(),
    tianShen: lunar.getDayTianShen(),
    xiu: `${lunar.getXiu()}${lunar.getAnimal()}·${lunar.getXiuLuck()}`,
    jie: `${lunar.getPrevJieQi().getName()}后，${lunar.getNextJieQi().getName()}前`,
    weekday: `周${WEEK[date.getDay()]}`,
  };
}

export function buildDaily(date: Date, profile: Profile | null): DailyBoard {
  const almanac = readAlmanac(date);
  const solar = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0, 0);
  const times = solar.getLunar().getTimes();
  const dayBranch = almanac.dayGZ[1];

  const dayKind = DAY_KIND[almanac.zhiXing] ? `今天这一天，${DAY_KIND[almanac.zhiXing]}。` : '';
  let personal = `还没填生辰，下面只按黄历看，不对照你个人。${dayKind}`;
  let yearBranch = '';
  let dayMasterElement: Element | null = null;
  if (profile) {
    const chart = buildBazi(profile);
    yearBranch = chart.pillars[0].ganZhi[1];
    dayMasterElement = stemElement(chart.dayMaster);
    const relation = branchRelation(yearBranch, dayBranch);
    const city = findCity(profile.cityId);
    personal = `${profile.name || '你'}属${chart.zodiac}。你自己的五行是${dayMasterElement}，偏向${elementPlain(dayMasterElement)}。今天和你的生肖${relationPlain(relation)}。出生地按${city.name}算。${dayKind}`;
  }

  const matters = MATTERS.map((matter) =>
    scoreMatter(matter, almanac, times, dayBranch, yearBranch, dayMasterElement),
  );
  const overallScore = Math.round(matters.reduce((sum, item) => sum + item.score, 0) / matters.length);
  return { almanac, personal, overall: verdictOf(overallScore), overallScore, matters };
}

function scoreMatter(
  matter: Matter,
  almanac: Almanac,
  times: { getGanZhi(): string; getMinHm(): string; getMaxHm(): string; getYi(): string[]; getJi(): string[] }[],
  dayBranch: string,
  yearBranch: string,
  dayMaster: Element | null,
): MatterLuck {
  let score = 58;
  const reasons: string[] = [];
  const good = hit(almanac.yi, matter.keys);
  const bad = hit(almanac.ji, matter.keys);
  if (good.length) {
    score += 24;
    reasons.push(`黄历写了适合「${good.join('、')}」，和这件事对得上。`);
  }
  if (bad.length) {
    score -= 28;
    reasons.push(`黄历写了不适合「${bad.join('、')}」，这件事先缓一缓。`);
  }
  if (!good.length && !bad.length) {
    reasons.push('黄历没有直接写这件事。接着看哪个钟点更合适，以及跟你的生肖合不合。');
  }

  if (yearBranch) {
    const relation = branchRelation(yearBranch, dayBranch);
    if (relation === '六冲') {
      score -= 14;
      reasons.push('今天冲你的生肖，出门和签字都要再核对一遍。');
    } else if (relation === '六害') {
      score -= 8;
      reasons.push('今天和你的生肖容易生小别扭，琐事和口角会多一点。');
    } else if (relation === '六合' || relation === '三合') {
      score += 8;
      reasons.push('今天和你的生肖合得来，贵人和顺手的事更容易碰上。');
    }
  }

  if (dayMaster) {
    const matterElement = matter.element;
    if (matter.wealth) {
      if (controls(dayMaster) === matterElement) {
        score += 6;
        reasons.push('谈钱、做买卖这一路，你压得住，比较拿得住分寸。');
      } else if (controls(matterElement) === dayMaster) {
        score -= 6;
        reasons.push('钱的场面比你眼下的力气大，今天别借钱加码，也别一次押太多。');
      }
    } else if (generates(dayMaster) === matterElement || dayMaster === matterElement) {
      score += 5;
      reasons.push('这件事和你的五行是一路的，做起来比较不费劲。');
    } else if (controls(matterElement) === dayMaster) {
      score -= 5;
      reasons.push('这件事的气势压着你，做完容易累，量力就好。');
    }
  }

  if (almanac.zhiXing === '闭' || almanac.zhiXing === '破') score -= 4;
  if (almanac.zhiXing === '成' || almanac.zhiXing === '开') score += 4;
  score = Math.max(18, Math.min(96, score));

  const hours: HourLuck[] = times.map((time) => {
    const yi = time.getYi();
    const ji = time.getJi();
    return {
      ganZhi: time.getGanZhi(),
      range: `${time.getMinHm()}–${time.getMaxHm()}`,
      good: hit(yi, matter.keys).length > 0,
      bad: hit(ji, matter.keys).length > 0,
    };
  });
  const lucky = hours.filter((hour) => hour.good && !hour.bad).slice(0, 3);
  const colorElement = dayMaster && generates(dayMaster) === matter.element ? dayMaster : matter.element;
  const color = elementColor(colorElement);
  const advice = lucky.length
    ? `如果要办，优先这些钟点：${lucky.map((hour) => hour.range).join('、')}。可以往财神方位（${almanac.cai}）、喜神方位（${almanac.xi}）走走。衣服或小物用${color}。`
    : `今天没有特别合适的钟点。能改期就改；如果必须办，避开下面标红的时段。衣服或小物仍可用${color}。`;

  return {
    matter,
    score,
    verdict: verdictOf(score),
    reasons,
    advice,
    color,
    hours,
  };
}

export function askToday(question: string, board: DailyBoard): { item: MatterLuck | null; note: string } {
  const text = question.trim();
  let best: MatterLuck | null = null;
  let hits = 0;
  for (const item of board.matters) {
    const count = item.matter.words.filter((word) => text.includes(word)).length;
    if (count > hits) {
      hits = count;
      best = item;
    }
  }
  if (!best) {
    return {
      item: null,
      note: `这句话对不上下面的固定类别。先看今天的总评「${board.overall}」。想问得更准，点下面的一类，或改成签约、出行、面试这种说法。`,
    };
  }
  return { item: best, note: `按「${best.matter.name}」来看你今天这件事。` };
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
