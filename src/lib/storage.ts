import type { Profile } from '../types';

const KEY = 'luckystar.profile.v1';
const PARTNER = 'luckystar.partner.v1';

export function loadProfile(key = KEY): Profile | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as Profile;
    if (!data || typeof data.year !== 'number' || !data.cityId) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile, key = KEY) {
  localStorage.setItem(key, JSON.stringify(profile));
}

export function loadPartner() {
  return loadProfile(PARTNER);
}

export function savePartner(profile: Profile) {
  saveProfile(profile, PARTNER);
}
