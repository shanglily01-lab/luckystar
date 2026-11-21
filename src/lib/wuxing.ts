export const ELEMENTS = ['木', '火', '土', '金', '水'] as const;
export type Element = (typeof ELEMENTS)[number];

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

const STEM_ELEMENT: Record<string, Element> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

const BRANCH_ELEMENT: Record<string, Element> = {
  寅: '木',
  卯: '木',
  巳: '火',
  午: '火',
  辰: '土',
  丑: '土',
  未: '土',
  戌: '土',
  申: '金',
  酉: '金',
  亥: '水',
  子: '水',
};

export function stemElement(stem: string): Element {
  return STEM_ELEMENT[stem] ?? '土';
}

export function branchElement(branch: string): Element {
  return BRANCH_ELEMENT[branch] ?? '土';
}

const GENERATES: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const CONTROLS: Record<Element, Element> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

export function generates(from: Element): Element {
  return GENERATES[from];
}

export function controls(from: Element): Element {
  return CONTROLS[from];
}

export function elementColor(element: Element): string {
  return { 木: '绿色', 火: '红色', 土: '黄色', 金: '白色', 水: '蓝色或黑色' }[element];
}

export function elementPlain(element: Element): string {
  return {
    木: '生长、学习和开头',
    火: '表达、露面和热情',
    土: '稳定、落实和收尾',
    金: '决断、规矩和钱财',
    水: '思考、变通和流动',
  }[element];
}

export function relationPlain(relation: BranchRelation): string {
  return {
    六合: '很合拍，在一起比较省力',
    三合: '能凑到一起，互相补得上',
    比和: '节奏差不多',
    平常: '没有明显的合，也没有明显的冲',
    六害: '容易有小别扭和口角',
    六冲: '容易对着来，要多核对一遍',
  }[relation];
}

const PAIRS: [string, string][] = [
  ['子', '丑'],
  ['寅', '亥'],
  ['卯', '戌'],
  ['辰', '酉'],
  ['巳', '申'],
  ['午', '未'],
];

const CLASH: [string, string][] = [
  ['子', '午'],
  ['丑', '未'],
  ['寅', '申'],
  ['卯', '酉'],
  ['辰', '戌'],
  ['巳', '亥'],
];

const HARM: [string, string][] = [
  ['子', '未'],
  ['丑', '午'],
  ['寅', '巳'],
  ['卯', '辰'],
  ['申', '亥'],
  ['酉', '戌'],
];

const TRINES = [
  ['申', '子', '辰'],
  ['寅', '午', '戌'],
  ['亥', '卯', '未'],
  ['巳', '酉', '丑'],
];

const STEM_HE: [string, string][] = [
  ['甲', '己'],
  ['乙', '庚'],
  ['丙', '辛'],
  ['丁', '壬'],
  ['戊', '癸'],
];

function paired(table: [string, string][], a: string, b: string) {
  return table.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export type BranchRelation = '六合' | '三合' | '六冲' | '六害' | '比和' | '平常';

export function branchRelation(a: string, b: string): BranchRelation {
  if (!a || !b) return '平常';
  if (a === b) return '比和';
  if (paired(PAIRS, a, b)) return '六合';
  if (TRINES.some((group) => group.includes(a) && group.includes(b))) return '三合';
  if (paired(CLASH, a, b)) return '六冲';
  if (paired(HARM, a, b)) return '六害';
  return '平常';
}

export function stemRelation(a: string, b: string): string {
  if (a === b) return '比和';
  if (paired(STEM_HE, a, b)) return '天干相合';
  const ea = stemElement(a);
  const eb = stemElement(b);
  if (ea === eb) return '同类';
  if (generates(ea) === eb) return `${a}生${b}`;
  if (generates(eb) === ea) return `${b}生${a}`;
  if (controls(ea) === eb) return `${a}克${b}`;
  if (controls(eb) === ea) return `${b}克${a}`;
  return '平常';
}

export const ZODIAC: Record<string, string> = {
  子: '鼠',
  丑: '牛',
  寅: '虎',
  卯: '兔',
  辰: '龙',
  巳: '蛇',
  午: '马',
  未: '羊',
  申: '猴',
  酉: '鸡',
  戌: '狗',
  亥: '猪',
};
