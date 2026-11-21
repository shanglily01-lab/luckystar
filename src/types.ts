export type Gender = 'male' | 'female';

export type Profile = {
  name: string;
  gender: Gender;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  cityId: string;
};

export type ViewId =
  | 'home'
  | 'daily'
  | 'ziwei'
  | 'bazi'
  | 'west'
  | 'match'
  | 'yijing'
  | 'tarot'
  | 'auth'
  | 'account';

export type Verdict = '大吉' | '吉' | '平' | '小凶' | '凶';
