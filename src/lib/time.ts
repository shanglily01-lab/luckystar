import { findCity } from '../data/cities';
import type { Profile } from '../types';

export type Clock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function clockText(clock: Clock) {
  return `${clock.year}-${pad(clock.month)}-${pad(clock.day)} ${pad(clock.hour)}:${pad(clock.minute)}`;
}

/** 把出生地的钟面时间，校正成地方平太阳时。 */
export function trueSolar(profile: Profile): Clock {
  const city = findCity(profile.cityId);
  const instant =
    Date.UTC(profile.year, profile.month - 1, profile.day, profile.hour, profile.minute) -
    city.tz * 3600000;
  const solar = instant + (city.longitude / 15) * 3600000;
  const date = new Date(solar);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}

/** 出生瞬间，用于行星位置。 */
export function birthInstant(profile: Profile): Date {
  const city = findCity(profile.cityId);
  return new Date(
    Date.UTC(profile.year, profile.month - 1, profile.day, profile.hour, profile.minute) -
      city.tz * 3600000,
  );
}

/** iztro 时辰序号：0 早子 … 11 亥，12 晚子。 */
export function timeIndex(hour: number, minute: number) {
  const decimal = hour + minute / 60;
  if (decimal >= 23) return 12;
  if (decimal < 1) return 0;
  return Math.floor((hour + 1) / 2);
}

export function isValidDate(year: number, month: number, day: number) {
  if (year < 1920 || year > 2050 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
