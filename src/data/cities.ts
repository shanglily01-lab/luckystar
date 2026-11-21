import data from './places.json';

const CHINA_ZONE = 'Asia/Shanghai';

export type City = {
  id: string;
  name: string;
  region: '中国' | '海外';
  longitude: number;
  latitude: number;
  zone: string;
};

type County = { id: string; name: string; lng: number; lat: number };
export type CityNode = { id: string; name: string; lng: number; lat: number; counties: County[] };
export type Province = { id: string; name: string; lng: number; lat: number; cities: CityNode[] };
export type WorldCity = { id: string; name: string; lng: number; lat: number; zone: string };
export type Country = { id: string; name: string; cities: WorldCity[] };

export const PROVINCES = data.cn as Province[];
export const COUNTRIES = data.world as Country[];
const LEGACY = data.legacy as Record<string, string>;

const INDEX = new Map<string, City>();

function add(city: City) {
  INDEX.set(city.id, city);
}

for (const province of PROVINCES) {
  add({
    id: province.id,
    name: province.name,
    region: '中国',
    longitude: province.lng,
    latitude: province.lat,
    zone: CHINA_ZONE,
  });
  for (const city of province.cities) {
    const cityName = city.name === province.name ? province.name : `${province.name} · ${city.name}`;
    add({
      id: city.id,
      name: cityName,
      region: '中国',
      longitude: city.lng,
      latitude: city.lat,
      zone: CHINA_ZONE,
    });
    for (const county of city.counties) {
      const middle = city.name === province.name ? '' : `${city.name} · `;
      add({
        id: county.id,
        name: `${province.name} · ${middle}${county.name}`,
        region: '中国',
        longitude: county.lng,
        latitude: county.lat,
        zone: CHINA_ZONE,
      });
    }
  }
}

for (const country of COUNTRIES) {
  for (const city of country.cities) {
    add({
      id: city.id,
      name: `${country.name} · ${city.name}`,
      region: '海外',
      longitude: city.lng,
      latitude: city.lat,
      zone: city.zone,
    });
  }
}

export function resolveId(id: string) {
  return LEGACY[id] || id;
}

export function findCity(id: string): City {
  return INDEX.get(resolveId(id)) ?? INDEX.get('110000')!;
}

export type PlaceSelection = {
  scope: 'cn' | 'world';
  provinceId: string;
  cityId: string;
  countyId: string;
};

export function locate(id: string): PlaceSelection {
  const resolved = resolveId(id);
  for (const province of PROVINCES) {
    for (const city of province.cities) {
      if (city.counties.some((county) => county.id === resolved)) {
        return { scope: 'cn', provinceId: province.id, cityId: city.id, countyId: resolved };
      }
      if (city.id === resolved) return { scope: 'cn', provinceId: province.id, cityId: city.id, countyId: '' };
    }
    if (province.id === resolved && province.cities[0]) {
      return { scope: 'cn', provinceId: province.id, cityId: province.cities[0].id, countyId: '' };
    }
  }
  for (const country of COUNTRIES) {
    if (country.cities.some((city) => city.id === resolved)) {
      return { scope: 'world', provinceId: country.id, cityId: resolved, countyId: '' };
    }
  }
  return { scope: 'cn', provinceId: '110000', cityId: '110000', countyId: '' };
}
