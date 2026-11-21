import { useMemo, useState, type FormEvent } from 'react';
import { COUNTRIES, PROVINCES, locate } from '../data/cities';
import { isValidDate } from '../lib/time';
import type { Gender, Profile } from '../types';

export type Draft = {
  name: string;
  gender: Gender;
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  cityId: string;
};

export function draftFrom(profile: Profile | null): Draft {
  if (!profile) {
    return { name: '', gender: 'male', year: '', month: '', day: '', hour: '', minute: '0', cityId: 'beijing' };
  }
  return {
    name: profile.name,
    gender: profile.gender,
    year: String(profile.year),
    month: String(profile.month),
    day: String(profile.day),
    hour: String(profile.hour),
    minute: String(profile.minute),
    cityId: profile.cityId,
  };
}

export function ProfileForm({
  initial,
  title,
  submitLabel,
  onSubmit,
}: {
  initial: Profile | null;
  title: string;
  submitLabel: string;
  onSubmit: (profile: Profile) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(initial));
  const [error, setError] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const place = locate(draft.cityId);
  const province = PROVINCES.find((item) => item.id === place.provinceId) ?? PROVINCES[0];
  const city = province.cities.find((item) => item.id === place.cityId) ?? province.cities[0];
  const country = COUNTRIES.find((item) => item.id === place.provinceId) ?? COUNTRIES[0];
  const worldCities = useMemo(() => {
    const text = cityQuery.trim();
    const matched = text ? country.cities.filter((item) => item.name.includes(text)) : country.cities;
    if (matched.some((item) => item.id === place.cityId) || place.scope !== 'world') return matched;
    const selected = country.cities.find((item) => item.id === place.cityId);
    return selected ? [selected, ...matched] : matched;
  }, [cityQuery, country, place.cityId, place.scope]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const year = Number(draft.year);
    const month = Number(draft.month);
    const day = Number(draft.day);
    const hour = Number(draft.hour);
    const minute = Number(draft.minute);
    if (!isValidDate(year, month, day)) {
      setError('出生日期没有这一天，请核对公历。');
      return;
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
      setError('时间请填 0–23 时、0–59 分。');
      return;
    }
    setError('');
    onSubmit({
      name: draft.name.trim(),
      gender: draft.gender,
      year,
      month,
      day,
      hour,
      minute,
      cityId: draft.cityId,
    });
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-title">{title}</div>
      <label>
        姓名
        <input value={draft.name} placeholder="可留空" onChange={(event) => set('name', event.target.value)} />
      </label>
      <div className="form-row">
        <label>
          年
          <input inputMode="numeric" value={draft.year} placeholder="1995" onChange={(event) => set('year', event.target.value)} />
        </label>
        <label>
          月
          <input inputMode="numeric" value={draft.month} placeholder="8" onChange={(event) => set('month', event.target.value)} />
        </label>
        <label>
          日
          <input inputMode="numeric" value={draft.day} placeholder="16" onChange={(event) => set('day', event.target.value)} />
        </label>
      </div>
      <div className="form-row">
        <label>
          时
          <input inputMode="numeric" value={draft.hour} placeholder="14" onChange={(event) => set('hour', event.target.value)} />
        </label>
        <label>
          分
          <input inputMode="numeric" value={draft.minute} placeholder="0" onChange={(event) => set('minute', event.target.value)} />
        </label>
        <label>
          性别
          <select value={draft.gender} onChange={(event) => set('gender', event.target.value as Gender)}>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </label>
      </div>
      <div className="form-title">出生地</div>
      <div className={place.scope === 'cn' && province.cities.length > 1 ? 'place-grid' : 'place-grid two'}>
        <label>
          范围
          <select
            value={place.scope}
            onChange={(event) => {
              setCityQuery('');
              const next = event.target.value === 'world' ? COUNTRIES[0].cities[0].id : PROVINCES[0].cities[0].id;
              set('cityId', next);
            }}
          >
            <option value="cn">中国</option>
            <option value="world">国外</option>
          </select>
        </label>
        {place.scope === 'cn' ? (
          <label>
            省
            <select
              value={province.id}
              onChange={(event) => {
                const next = PROVINCES.find((item) => item.id === event.target.value) ?? PROVINCES[0];
                set('cityId', next.cities[0].id);
              }}
            >
              {PROVINCES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            国家
            <select
              value={country.id}
              onChange={(event) => {
                setCityQuery('');
                const next = COUNTRIES.find((item) => item.id === event.target.value) ?? COUNTRIES[0];
                set('cityId', next.cities[0].id);
              }}
            >
              {COUNTRIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {place.scope === 'cn' && province.cities.length > 1 ? (
          <label>
            市
            <select value={city.id} onChange={(event) => set('cityId', event.target.value)}>
              {province.cities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      {place.scope === 'cn' && city.counties.length > 0 ? (
        <label>
          区县
          <select
            value={place.countyId}
            onChange={(event) => set('cityId', event.target.value || city.id)}
          >
            <option value="">全市</option>
            {city.counties.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {place.scope === 'world' ? (
        <label>
          城市
          <input value={cityQuery} placeholder="输入城市名筛选" onChange={(event) => setCityQuery(event.target.value)} />
          <select value={place.cityId} onChange={(event) => set('cityId', event.target.value)}>
            {worldCities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p className="hint">国内填北京时间，选到区县更准确。国外填当地时间，选国家和城市。排盘按出生地经度校正地方平太阳时，子时换日按子平。</p>
      {error ? <p className="error">{error}</p> : null}
      <button className="primary" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
