import { Solar } from 'lunar-javascript';
import { LINE_ROLE, findHexagram, trigramByNumber, type Hexagram } from '../data/hexagrams';

export type CastLine = { value: number; yang: boolean; changing: boolean; coins: number[] };

export type CastResult = {
  question: string;
  method: string;
  original: Hexagram;
  changed: Hexagram | null;
  lines: CastLine[];
  changing: number[];
};

export function throwCoins(): CastLine {
  const coins = [0, 1, 2].map(() => (Math.random() < 0.5 ? 3 : 2));
  const value = coins.reduce((sum, coin) => sum + coin, 0);
  return { value, yang: value === 7 || value === 9, changing: value === 6 || value === 9, coins };
}

export function castFromLines(question: string, lines: CastLine[], method: string): CastResult {
  const originalLines = lines.map((line) => (line.yang ? 1 : 0));
  const changedLines = lines.map((line) => (line.changing ? (line.yang ? 0 : 1) : line.yang ? 1 : 0));
  const original = findHexagram(originalLines);
  const changing = lines.map((line, index) => (line.changing ? index : -1)).filter((index) => index >= 0);
  const changed = changing.length ? findHexagram(changedLines) : null;
  return { question, method, original, changed, lines, changing };
}

export function castMeihua(question: string, date = new Date()): CastResult {
  const lunar = Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    0,
  ).getLunar();
  const sum = lunar.getYearZhiIndex() + Math.abs(lunar.getMonth()) + lunar.getDay();
  const upper = trigramByNumber(sum);
  const lower = trigramByNumber(sum + lunar.getTimeZhiIndex());
  const moving = (sum + lunar.getTimeZhiIndex()) % 6;
  const index = moving === 0 ? 5 : moving - 1;
  const lines: CastLine[] = [...lower.lines, ...upper.lines].map((yang, lineIndex) => ({
    value: lineIndex === index ? (yang ? 9 : 6) : yang ? 7 : 8,
    yang: Boolean(yang),
    changing: lineIndex === index,
    coins: [],
  }));
  return castFromLines(question, lines, `梅花时间卦 · ${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeInGanZhi()}`);
}

export function lineNotes(result: CastResult) {
  if (!result.changing.length) return ['六层都没有变动。事情按眼前这卦的说法走，不必再加码。'];
  return result.changing.map((index) => {
    const line = result.lines[index];
    const quality = line.yang ? '劲头往外，适合行动' : '劲头往回收，适合整顿';
    return `从下往上数，第 ${index + 1} 层在变，${quality}。${LINE_ROLE[index]}`;
  });
}
