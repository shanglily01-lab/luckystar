export const COSTS = {
  ziwei: 8,
  bazi: 8,
  west: 8,
  match: 10,
  yijing: 2,
  tarot: 2,
};

export const REWARDS = {
  register: 30,
  invitee: 20,
  inviter: 40,
  checkin: 8,
};

export const PACKAGES = [
  { id: 'p60', coins: 60, price: 6, label: '一小袋' },
  { id: 'p180', coins: 180, price: 16, label: '常用' },
  { id: 'p480', coins: 480, price: 36, label: '划算' },
  { id: 'p1200', coins: 1200, price: 78, label: '囤一囤' },
];

export const FEATURE_LABEL = {
  ziwei: '紫微斗数',
  bazi: '八字命盘',
  west: '西洋占星',
  match: '姻缘合盘',
  yijing: '易经问事',
  tarot: '塔罗三牌',
};

export function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
}
