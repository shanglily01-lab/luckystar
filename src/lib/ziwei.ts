import { astro } from 'iztro';
import { MAJOR_STAR, MINOR_STAR, OPPOSITE, PALACE_THEME } from '../data/stars';
import type { Profile } from '../types';
import { timeIndex, trueSolar, clockText, type Clock } from './time';

type StarLike = { name: string; brightness?: string; mutagen?: string; type?: string };
type PalaceLike = {
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  majorStars: StarLike[];
  minorStars: StarLike[];
  adjectiveStars: StarLike[];
  changsheng12: string;
  decadal: { range: [number, number] };
};

export type ZiweiReading = {
  clock: Clock;
  clockLabel: string;
  lunarDate: string;
  chineseDate: string;
  zodiac: string;
  sign: string;
  fiveElementsClass: string;
  soul: string;
  body: string;
  time: string;
  timeRange: string;
  palaces: PalaceLike[];
  yearMutagen: string[];
  yearBranch: string;
  yearName: string;
};

export function buildZiwei(profile: Profile): ZiweiReading {
  const clock = trueSolar(profile);
  const date = `${clock.year}-${clock.month}-${clock.day}`;
  const gender = profile.gender === 'male' ? '男' : '女';
  const chart = astro.bySolar(date, timeIndex(clock.hour, clock.minute), gender, true, 'zh-CN');
  const now = new Date();
  const horoscope = chart.horoscope(
    `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
  );
  return {
    clock,
    clockLabel: clockText(clock),
    lunarDate: chart.lunarDate,
    chineseDate: chart.chineseDate,
    zodiac: chart.zodiac,
    sign: chart.sign,
    fiveElementsClass: chart.fiveElementsClass,
    soul: chart.soul,
    body: chart.body,
    time: chart.time,
    timeRange: chart.timeRange,
    palaces: chart.palaces as PalaceLike[],
    yearMutagen: [...horoscope.yearly.mutagen],
    yearBranch: horoscope.yearly.earthlyBranch,
    yearName: `${horoscope.yearly.heavenlyStem}${horoscope.yearly.earthlyBranch}`,
  };
}

export function starLabel(star: StarLike) {
  return `${star.name}${star.brightness ? `·${star.brightness}` : ''}${star.mutagen ? star.mutagen : ''}`;
}

const BRIGHT: Record<string, string> = {
  庙: '在这里很得力',
  旺: '在这里发挥得好',
  得: '能用，但不算最亮',
  利: '有利，出力正常',
  平: '不好不坏',
  不: '有点使不上劲',
  陷: '在这里使不上劲，相关的事要多留神',
};

const HUA: Record<string, string> = {
  禄: '会多带来资源和顺遂',
  权: '会多带来担当和做主的机会',
  科: '会多带来名声、考试和文书',
  忌: '波折会被放大，相关的事要慢一点',
};

const STAGE: Record<string, string> = {
  长生: '刚起步，有生长的劲',
  沐浴: '还不稳定，容易受外界影响',
  冠带: '开始像样，可以见人',
  临官: '能当差，也能扛事',
  帝旺: '最旺的一段，也容易过满',
  衰: '力气往回收',
  病: '需要休整',
  死: '旧的一段在结束',
  墓: '适合收纳和沉淀',
  绝: '旧路走不通，要换方法',
  胎: '新的想法还在酝酿',
  养: '慢慢养，不宜催',
};

function huaPlain(value: string) {
  const key = value.replace(/^化/, '');
  return HUA[key] ? `这颗星${HUA[key]}。` : '';
}

export function yearStars(names: string[]) {
  const tags = ['多资源', '多担当', '多名声', '多波折'];
  return names.map((name, index) => (tags[index] ? `${name}（${tags[index]}）` : name)).join('，');
}

export function palaceReading(palace: PalaceLike, all: PalaceLike[]) {
  const theme = PALACE_THEME[palace.name] ?? '这一块生活';
  const majors = palace.majorStars;
  let starText = '';
  if (majors.length === 0) {
    const opposite = all.find((item) => item.earthlyBranch === OPPOSITE[palace.earthlyBranch]);
    const borrowed = opposite?.majorStars.map((star) => star.name).join('、') || '对面也没有主星';
    starText = `这一宫没有主星，要借对面的「${borrowed}」来看。意思是：这件事往往要借别人的场合，或另一处的资源，才能做成。`;
  } else {
    starText = majors
      .map((star) => {
        const base = MAJOR_STAR[star.name] ?? `${star.name}在这里，会把这件事带向它自己的路子。`;
        const bright = star.brightness ? `它${BRIGHT[star.brightness] ?? `的状态是${star.brightness}`}。` : '';
        const mutagen = star.mutagen ? huaPlain(star.mutagen) : '';
        return `${star.name}：${base}${bright}${mutagen}`;
      })
      .join('');
  }
  const minors = [...palace.minorStars, ...palace.adjectiveStars]
    .filter((star) => MINOR_STAR[star.name])
    .slice(0, 4)
    .map((star) => MINOR_STAR[star.name])
    .join('');
  const stage = STAGE[palace.changsheng12] ?? palace.changsheng12;
  const extra = minors ? `旁边还会添一层：${minors}` : '';
  return `${palace.name}管的是：${theme}。${palace.decadal.range[0]}岁到${palace.decadal.range[1]}岁，会重点碰到这里的事，这一段${stage}。${starText}${extra}`;
}
