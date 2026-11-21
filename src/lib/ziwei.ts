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

export function palaceReading(palace: PalaceLike, all: PalaceLike[]) {
  const theme = PALACE_THEME[palace.name] ?? '这一宫所管的生活切片';
  const majors = palace.majorStars;
  let starText = '';
  if (majors.length === 0) {
    const opposite = all.find((item) => item.earthlyBranch === OPPOSITE[palace.earthlyBranch]);
    const borrowed = opposite?.majorStars.map((star) => star.name).join('、') || '无主星';
    starText = `本宫无主星，借对宫${opposite?.earthlyBranch ?? ''}的${borrowed}来看。空宫的事，往往要借别人的场子或另一处的资源。`;
  } else {
    starText = majors
      .map((star) => {
        const base = MAJOR_STAR[star.name] ?? `${star.name}落在这里，会把这件事的气质带偏到它自己的路子上。`;
        const bright = star.brightness ? `亮度${star.brightness}。` : '';
        const mutagen = star.mutagen ? `生年四化带${star.mutagen}，这颗星的课题会被放大。` : '';
        return `${star.name}：${base}${bright}${mutagen}`;
      })
      .join('');
  }
  const minors = [...palace.minorStars, ...palace.adjectiveStars]
    .filter((star) => MINOR_STAR[star.name])
    .slice(0, 4)
    .map((star) => `${star.name}，${MINOR_STAR[star.name]}`)
    .join('');
  return `${palace.name}看${theme}。宫干${palace.heavenlyStem}${palace.earthlyBranch}，十二长生落在${palace.changsheng12}，大限${palace.decadal.range[0]}至${palace.decadal.range[1]}岁。${starText}${minors ? `辅星里：${minors}` : ''}`;
}
