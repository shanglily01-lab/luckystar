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

const zoneFormatters = new Map<string, Intl.DateTimeFormat>();

function zoneFormatter(timeZone: string) {
  let formatter = zoneFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    zoneFormatters.set(timeZone, formatter);
  }
  return formatter;
}

function offsetMinutes(timeZone: string, utcMs: number) {
  const bag: Record<string, string> = {};
  for (const part of zoneFormatter(timeZone).formatToParts(new Date(utcMs))) bag[part.type] = part.value;
  const hour = Number(bag.hour) % 24;
  const asUTC = Date.UTC(Number(bag.year), Number(bag.month) - 1, Number(bag.day), hour, Number(bag.minute), Number(bag.second));
  return Math.round((asUTC - utcMs) / 60000);
}

/** 出生地钟面时间对应的 UTC 毫秒。国内按北京时间，国外按当地标准时或夏令时。 */
export function localToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string) {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let utc = wall;
  for (let pass = 0; pass < 3; pass += 1) utc = wall - offsetMinutes(timeZone, utc) * 60000;
  return utc;
}

/** 把出生地的钟面时间，校正成地方平太阳时。 */
export function trueSolar(profile: Profile): Clock {
  const city = findCity(profile.cityId);
  const instant = localToUtc(profile.year, profile.month, profile.day, profile.hour, profile.minute, city.zone);
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
  return new Date(localToUtc(profile.year, profile.month, profile.day, profile.hour, profile.minute, city.zone));
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
