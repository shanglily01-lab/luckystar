import { Solar } from 'lunar-javascript';
import { findCity } from '../data/cities';
import { MATTERS, type Matter } from '../data/matters';
import type { Profile, Verdict } from '../types';
import { buildBazi } from './bazi';
import {
  branchRelation,
  controls,
  elementColor,
  generates,
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

  let personal = '未填写生辰，下面按黄历本身看，不掺个人冲合。';
  let yearBranch = '';
  let dayMasterElement: Element | null = null;
  if (profile) {
    const chart = buildBazi(profile);
    yearBranch = chart.pillars[0].ganZhi[1];
    dayMasterElement = stemElement(chart.dayMaster);
    const relation = branchRelation(yearBranch, dayBranch);
    const city = findCity(profile.cityId);
    personal = `${profile.name || '命主'}生肖${chart.zodiac}，日主${chart.dayMaster}${dayMasterElement}。今日地支${dayBranch}与年支${relation}。参照出生地${city.name}，真太阳时 ${chart.clockLabel}。`;
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
    reasons.push(`黄历宜「${good.join('、')}」，和这件事对得上。`);
  }
  if (bad.length) {
    score -= 28;
    reasons.push(`黄历忌「${bad.join('、')}」，这件事今天宜缓。`);
  }
  if (!good.length && !bad.length) {
    reasons.push('黄历没有直接点名这件事，要看时辰和你自己的冲合。');
  }

  if (yearBranch) {
    const relation = branchRelation(yearBranch, dayBranch);
    if (relation === '六冲') {
      score -= 14;
      reasons.push(`今日冲你的生肖（${relation}），外出和签字都要多核对一遍。`);
    } else if (relation === '六害') {
      score -= 8;
      reasons.push('今日与生肖六害，琐事和口舌容易缠一点。');
    } else if (relation === '六合' || relation === '三合') {
      score += 8;
      reasons.push(`今日与生肖${relation}，贵人和顺手的事更容易碰上。`);
    }
  }

  if (dayMaster) {
    const matterElement = matter.element;
    if (matter.wealth) {
      if (controls(dayMaster) === matterElement) {
        score += 6;
        reasons.push(`日主${dayMaster}克${matterElement}，求财这一路上你拿得住。`);
      } else if (controls(matterElement) === dayMaster) {
        score -= 6;
        reasons.push('财的气势压过日主，今天不宜加杠杆。');
      }
    } else if (generates(dayMaster) === matterElement || dayMaster === matterElement) {
      score += 5;
      reasons.push(`日主${dayMaster}生助这件事所需的${matterElement}，做起来不费劲。`);
    } else if (controls(matterElement) === dayMaster) {
      score -= 5;
      reasons.push(`这件事的${matterElement}气克日主，做完容易累，量力即可。`);
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
  const advice = lucky.length
    ? `若要办，优先 ${lucky.map((hour) => `${hour.ganZhi}（${hour.range}）`).join('、')}。方位可参考财神${almanac.cai}、喜神${almanac.xi}。颜色用${elementColor(colorElement)}。`
    : `今天没有特别贴合的吉时，能改期就改；若必须办，避开时辰忌里带同类字的那段，颜色仍可用${elementColor(colorElement)}。`;

  return {
    matter,
    score,
    verdict: verdictOf(score),
    reasons,
    advice,
    color: elementColor(colorElement),
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
      note: `这句话对不上固定事项，先看今日总运「${board.overall}」。想问得更准，可以点下面的一类，或改写成签约、出行、面试这类词。`,
    };
  }
  return { item: best, note: `按「${best.matter.name}」来看今天这件事。` };
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
