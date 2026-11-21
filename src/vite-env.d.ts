/// <reference types="vite/client" />

declare module 'lunar-javascript' {
  export const Solar: {
    fromYmd(y: number, m: number, d: number): LunarSolar;
    fromYmdHms(y: number, m: number, d: number, h: number, min: number, s: number): LunarSolar;
  };
}

interface LunarSolar {
  getLunar(): LunarDate;
  toYmdHms(): string;
}

interface LunarList {
  toString(): string;
  length?: number;
  [index: number]: string;
}

interface LunarDate {
  toString(): string;
  getYearInChinese(): string;
  getMonthInChinese(): string;
  getDayInChinese(): string;
  getYearInGanZhi(): string;
  getMonthInGanZhi(): string;
  getDayInGanZhi(): string;
  getTimeInGanZhi(): string;
  getYearShengXiao(): string;
  getDayShengXiao(): string;
  getEightChar(): EightChar;
  getDayYi(): string[];
  getDayJi(): string[];
  getDayChongDesc(): string;
  getDaySha(): string;
  getPengZuGan(): string;
  getPengZuZhi(): string;
  getDayPositionXiDesc(): string;
  getDayPositionFuDesc(): string;
  getDayPositionCaiDesc(): string;
  getDayJiShen(): LunarList;
  getDayXiongSha(): LunarList;
  getZhiXing(): string;
  getDayTianShen(): string;
  getXiu(): string;
  getXiuLuck(): string;
  getZheng(): string;
  getAnimal(): string;
  getPrevJieQi(): { getName(): string };
  getNextJieQi(): { getName(): string };
  getTimes(): LunarTime[];
  getYearZhiIndex(): number;
  getMonth(): number;
  getDay(): number;
  getTimeZhiIndex(): number;
  getSolar(): { getXingZuo(): string };
}

interface LunarTime {
  getGanZhi(): string;
  getMinHm(): string;
  getMaxHm(): string;
  getYi(): string[];
  getJi(): string[];
}

interface EightChar {
  setSect(sect: number): void;
  toString(): string;
  getYear(): string;
  getMonth(): string;
  getDay(): string;
  getTime(): string;
  getYearShiShenGan(): string;
  getMonthShiShenGan(): string;
  getDayShiShenGan(): string;
  getTimeShiShenGan(): string;
  getYearShiShenZhi(): LunarList;
  getMonthShiShenZhi(): LunarList;
  getDayShiShenZhi(): LunarList;
  getTimeShiShenZhi(): LunarList;
  getYearHideGan(): LunarList;
  getMonthHideGan(): LunarList;
  getDayHideGan(): LunarList;
  getTimeHideGan(): LunarList;
  getYearNaYin(): string;
  getMonthNaYin(): string;
  getDayNaYin(): string;
  getTimeNaYin(): string;
  getYearDiShi(): string;
  getMonthDiShi(): string;
  getDayDiShi(): string;
  getTimeDiShi(): string;
  getYearWuXing(): string;
  getMonthWuXing(): string;
  getDayWuXing(): string;
  getTimeWuXing(): string;
  getMingGong(): string;
  getShenGong(): string;
  getTaiYuan(): string;
  getTaiXi(): string;
  getYun(gender: number): Yun;
}

interface Yun {
  getStartYear(): number;
  getStartMonth(): number;
  getStartDay(): number;
  getStartSolar(): { toYmd(): string };
  getDaYun(): DaYun[];
}

interface DaYun {
  getGanZhi(): string;
  getStartAge(): number;
  getEndAge(): number;
  getStartYear(): number;
  getEndYear(): number;
  getLiuNian(): LiuNian[];
}

interface LiuNian {
  getYear(): number;
  getAge(): number;
  getGanZhi(): string;
}
