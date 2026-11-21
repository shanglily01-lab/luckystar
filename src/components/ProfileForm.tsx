import { useState, type FormEvent } from 'react';
import { CITIES } from '../data/cities';
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
      <label>
        出生地
        <select value={draft.cityId} onChange={(event) => set('cityId', event.target.value)}>
          <optgroup label="中国">
            {CITIES.filter((city) => city.region === '中国').map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="海外">
            {CITIES.filter((city) => city.region === '海外').map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <p className="hint">公历、北京时间钟面即可。排盘会按出生地经度校正地方平太阳时，子时换日按子平。</p>
      {error ? <p className="error">{error}</p> : null}
      <button className="primary" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
