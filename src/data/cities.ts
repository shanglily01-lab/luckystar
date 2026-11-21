export type City = {
  id: string;
  name: string;
  region: '中国' | '海外';
  longitude: number;
  latitude: number;
  /** 标准时区，东正西负，相对 UTC 的小时数 */
  tz: number;
};

export const CITIES: City[] = [
  { id: 'beijing', name: '北京', region: '中国', longitude: 116.41, latitude: 39.9, tz: 8 },
  { id: 'tianjin', name: '天津', region: '中国', longitude: 117.2, latitude: 39.13, tz: 8 },
  { id: 'shanghai', name: '上海', region: '中国', longitude: 121.47, latitude: 31.23, tz: 8 },
  { id: 'chongqing', name: '重庆', region: '中国', longitude: 106.55, latitude: 29.56, tz: 8 },
  { id: 'guangzhou', name: '广州', region: '中国', longitude: 113.26, latitude: 23.13, tz: 8 },
  { id: 'shenzhen', name: '深圳', region: '中国', longitude: 114.06, latitude: 22.54, tz: 8 },
  { id: 'hangzhou', name: '杭州', region: '中国', longitude: 120.16, latitude: 30.25, tz: 8 },
  { id: 'nanjing', name: '南京', region: '中国', longitude: 118.8, latitude: 32.06, tz: 8 },
  { id: 'suzhou', name: '苏州', region: '中国', longitude: 120.59, latitude: 31.3, tz: 8 },
  { id: 'chengdu', name: '成都', region: '中国', longitude: 104.07, latitude: 30.57, tz: 8 },
  { id: 'wuhan', name: '武汉', region: '中国', longitude: 114.31, latitude: 30.59, tz: 8 },
  { id: 'xian', name: '西安', region: '中国', longitude: 108.94, latitude: 34.34, tz: 8 },
  { id: 'zhengzhou', name: '郑州', region: '中国', longitude: 113.63, latitude: 34.75, tz: 8 },
  { id: 'changsha', name: '长沙', region: '中国', longitude: 112.94, latitude: 28.23, tz: 8 },
  { id: 'jinan', name: '济南', region: '中国', longitude: 117.12, latitude: 36.65, tz: 8 },
  { id: 'qingdao', name: '青岛', region: '中国', longitude: 120.38, latitude: 36.07, tz: 8 },
  { id: 'shenyang', name: '沈阳', region: '中国', longitude: 123.43, latitude: 41.8, tz: 8 },
  { id: 'dalian', name: '大连', region: '中国', longitude: 121.62, latitude: 38.92, tz: 8 },
  { id: 'harbin', name: '哈尔滨', region: '中国', longitude: 126.53, latitude: 45.8, tz: 8 },
  { id: 'changchun', name: '长春', region: '中国', longitude: 125.32, latitude: 43.82, tz: 8 },
  { id: 'kunming', name: '昆明', region: '中国', longitude: 102.83, latitude: 24.88, tz: 8 },
  { id: 'guiyang', name: '贵阳', region: '中国', longitude: 106.63, latitude: 26.65, tz: 8 },
  { id: 'nanning', name: '南宁', region: '中国', longitude: 108.37, latitude: 22.82, tz: 8 },
  { id: 'fuzhou', name: '福州', region: '中国', longitude: 119.3, latitude: 26.08, tz: 8 },
  { id: 'xiamen', name: '厦门', region: '中国', longitude: 118.09, latitude: 24.48, tz: 8 },
  { id: 'hefei', name: '合肥', region: '中国', longitude: 117.23, latitude: 31.82, tz: 8 },
  { id: 'nanchang', name: '南昌', region: '中国', longitude: 115.86, latitude: 28.68, tz: 8 },
  { id: 'taiyuan', name: '太原', region: '中国', longitude: 112.55, latitude: 37.87, tz: 8 },
  { id: 'shijiazhuang', name: '石家庄', region: '中国', longitude: 114.51, latitude: 38.04, tz: 8 },
  { id: 'hohhot', name: '呼和浩特', region: '中国', longitude: 111.75, latitude: 40.84, tz: 8 },
  { id: 'lanzhou', name: '兰州', region: '中国', longitude: 103.83, latitude: 36.06, tz: 8 },
  { id: 'yinchuan', name: '银川', region: '中国', longitude: 106.23, latitude: 38.49, tz: 8 },
  { id: 'xining', name: '西宁', region: '中国', longitude: 101.78, latitude: 36.62, tz: 8 },
  { id: 'urumqi', name: '乌鲁木齐', region: '中国', longitude: 87.62, latitude: 43.83, tz: 8 },
  { id: 'lhasa', name: '拉萨', region: '中国', longitude: 91.11, latitude: 29.65, tz: 8 },
  { id: 'haikou', name: '海口', region: '中国', longitude: 110.32, latitude: 20.04, tz: 8 },
  { id: 'sanya', name: '三亚', region: '中国', longitude: 109.51, latitude: 18.25, tz: 8 },
  { id: 'hongkong', name: '香港', region: '中国', longitude: 114.17, latitude: 22.32, tz: 8 },
  { id: 'macau', name: '澳门', region: '中国', longitude: 113.54, latitude: 22.19, tz: 8 },
  { id: 'taipei', name: '台北', region: '中国', longitude: 121.57, latitude: 25.04, tz: 8 },
  { id: 'tokyo', name: '东京', region: '海外', longitude: 139.69, latitude: 35.69, tz: 9 },
  { id: 'seoul', name: '首尔', region: '海外', longitude: 126.98, latitude: 37.57, tz: 9 },
  { id: 'singapore', name: '新加坡', region: '海外', longitude: 103.82, latitude: 1.35, tz: 8 },
  { id: 'kualalumpur', name: '吉隆坡', region: '海外', longitude: 101.69, latitude: 3.14, tz: 8 },
  { id: 'sydney', name: '悉尼', region: '海外', longitude: 151.21, latitude: -33.87, tz: 10 },
  { id: 'auckland', name: '奥克兰', region: '海外', longitude: 174.76, latitude: -36.85, tz: 12 },
  { id: 'london', name: '伦敦', region: '海外', longitude: -0.13, latitude: 51.51, tz: 0 },
  { id: 'paris', name: '巴黎', region: '海外', longitude: 2.35, latitude: 48.86, tz: 1 },
  { id: 'berlin', name: '柏林', region: '海外', longitude: 13.4, latitude: 52.52, tz: 1 },
  { id: 'newyork', name: '纽约', region: '海外', longitude: -74.01, latitude: 40.71, tz: -5 },
  { id: 'vancouver', name: '温哥华', region: '海外', longitude: -123.12, latitude: 49.28, tz: -8 },
];

export function findCity(id: string): City {
  return CITIES.find((city) => city.id === id) ?? CITIES[0];
}
