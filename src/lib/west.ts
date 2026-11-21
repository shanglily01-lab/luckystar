import { Body, Ecliptic, GeoVector, MakeTime, SiderealTime, e_tilt } from 'astronomy-engine';
import { findCity } from '../data/cities';
import type { Profile } from '../types';
import { birthInstant } from './time';

export const SIGNS = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
export const SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

const SIGN_NOTE: Record<string, string> = {
  白羊: '起手快，喜欢开门见山。记得把后半段也安排上。',
  金牛: '在意稳定和体感，慢一点但咬得住。',
  双子: '信息灵，适合联络和表达，忌同时开太多头。',
  巨蟹: '护自己的人，情绪是导航，也要有上岸的地方。',
  狮子: '需要被看见，也担得起场面。光给别人留一束。',
  处女: '细节可靠，适合打磨。别让挑剔盖过已经做好的部分。',
  天秤: '会权衡，适合合作与审美。选边的时候给自己一个时限。',
  天蝎: '看得到表层下面的东西。信任要慢慢给，秘密要有出口。',
  射手: '往远处看，适合学习和上路。承诺之前先看日历。',
  摩羯: '按台阶走，责任心是长板。忙的时候也给身体留账。',
  水瓶: '思路独立，适合改方法。跟亲近的人同步一下近况。',
  双鱼: '感受力强，适合创作和体谅。边界写清楚，梦才落地。',
};

const BODIES: { name: string; glyph: string; body: Body }[] = [
  { name: '太阳', glyph: '☉', body: Body.Sun },
  { name: '月亮', glyph: '☽', body: Body.Moon },
  { name: '水星', glyph: '☿', body: Body.Mercury },
  { name: '金星', glyph: '♀', body: Body.Venus },
  { name: '火星', glyph: '♂', body: Body.Mars },
  { name: '木星', glyph: '♃', body: Body.Jupiter },
  { name: '土星', glyph: '♄', body: Body.Saturn },
  { name: '天王星', glyph: '♅', body: Body.Uranus },
  { name: '海王星', glyph: '♆', body: Body.Neptune },
  { name: '冥王星', glyph: '♇', body: Body.Pluto },
];

export type Placement = {
  name: string;
  glyph: string;
  longitude: number;
  sign: string;
  signIndex: number;
  degree: number;
  house: number;
};

export type Aspect = { a: string; b: string; name: string; orb: number };

export type WestChart = {
  latitude: number;
  longitude: number;
  ascendant: number;
  midheaven: number;
  ascSign: string;
  mcSign: string;
  sun: string;
  moon: string;
  rising: string;
  planets: Placement[];
  aspects: Aspect[];
  reading: string;
};

function norm(degree: number) {
  return ((degree % 360) + 360) % 360;
}

function signIndex(longitude: number) {
  return Math.floor(norm(longitude) / 30) % 12;
}

function placeOf(longitude: number) {
  const index = signIndex(longitude);
  return { sign: SIGNS[index], signIndex: index, degree: norm(longitude) % 30 };
}

export function buildWest(profile: Profile): WestChart {
  const city = findCity(profile.cityId);
  const instant = birthInstant(profile);
  const time = MakeTime(instant);
  const lst = norm((SiderealTime(instant) + city.longitude / 15) * 15);
  const eps = e_tilt(time).tobl * (Math.PI / 180);
  const ramc = lst * (Math.PI / 180);
  const lat = Math.max(-66, Math.min(66, city.latitude)) * (Math.PI / 180);
  const asc = norm(
    Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps))) *
      (180 / Math.PI),
  );
  let mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * (180 / Math.PI);
  mc = norm(mc);

  const planets: Placement[] = BODIES.map((item) => {
    const longitude = norm(Ecliptic(GeoVector(item.body, instant, true)).elon);
    const placed = placeOf(longitude);
    const house = Math.floor(norm(longitude - asc) / 30) + 1;
    return { name: item.name, glyph: item.glyph, longitude, house, ...placed };
  });

  const aspects = findAspects(planets);
  const sun = planets[0].sign;
  const moon = planets[1].sign;
  const rising = placeOf(asc).sign;
  return {
    latitude: city.latitude,
    longitude: city.longitude,
    ascendant: asc,
    midheaven: mc,
    ascSign: rising,
    mcSign: placeOf(mc).sign,
    sun,
    moon,
    rising,
    planets,
    aspects,
    reading: `太阳${sun}，是你习惯拿出来见人的方式。${SIGN_NOTE[sun]}月亮${moon}，是需要被安顿的部分。${SIGN_NOTE[moon]}上升${rising}，是别人进门时先碰到的气场。${SIGN_NOTE[rising]}中天落在${placeOf(mc).sign}，事业上更愿意被看成这一路的人。`,
  };
}

const ASPECTS = [
  { name: '合相', angle: 0, orb: 8 },
  { name: '六分', angle: 60, orb: 4 },
  { name: '刑相', angle: 90, orb: 6 },
  { name: '三分', angle: 120, orb: 6 },
  { name: '冲相', angle: 180, orb: 8 },
];

function findAspects(planets: Placement[]): Aspect[] {
  const list: Aspect[] = [];
  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      let gap = Math.abs(planets[i].longitude - planets[j].longitude);
      if (gap > 180) gap = 360 - gap;
      for (const aspect of ASPECTS) {
        const orb = Math.abs(gap - aspect.angle);
        const limit = aspect.orb + (i < 2 || j < 2 ? 1.5 : 0);
        if (orb <= limit) {
          list.push({
            a: planets[i].name,
            b: planets[j].name,
            name: aspect.name,
            orb: Math.round(orb * 10) / 10,
          });
          break;
        }
      }
    }
  }
  return list.sort((a, b) => a.orb - b.orb).slice(0, 14);
}
