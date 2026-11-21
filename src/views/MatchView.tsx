import { useState } from 'react';
import { ProfileForm } from '../components/ProfileForm';
import { buildMatch } from '../lib/match';
import { loadPartner, savePartner } from '../lib/storage';
import type { Profile } from '../types';

export function MatchView({
  selfProfile,
  onSaveSelf,
}: {
  selfProfile: Profile | null;
  onSaveSelf: (profile: Profile) => void;
}) {
  const [self, setSelf] = useState<Profile | null>(selfProfile);
  const [partner, setPartner] = useState<Profile | null>(() => loadPartner());
  const [editing, setEditing] = useState<'self' | 'partner' | null>(self ? (partner ? null : 'partner') : 'self');

  function saveSelf(profile: Profile) {
    setSelf(profile);
    onSaveSelf(profile);
    setEditing(partner ? null : 'partner');
  }

  function saveOther(profile: Profile) {
    savePartner(profile);
    setPartner(profile);
    setEditing(null);
  }

  const report = self && partner ? buildMatch(self, partner) : null;

  return (
    <section className="sheet">
      <div className="view-head">
        <div>
          <p className="eyebrow">双人合盘</p>
          <h1>姻缘与合作</h1>
        </div>
      </div>
      <p className="lead">年支看外人眼中的节奏，日支看住在一起的日常，日主看谁在生谁，太阳星座只占表达方式。</p>
      <div className="pair">
        <PersonCard title="甲方" profile={self} onEdit={() => setEditing('self')} />
        <PersonCard title="乙方" profile={partner} onEdit={() => setEditing('partner')} />
      </div>
      {editing === 'self' ? <ProfileForm initial={self} title="甲方生辰" submitLabel="保存甲方" onSubmit={saveSelf} /> : null}
      {editing === 'partner' ? <ProfileForm initial={partner} title="乙方生辰" submitLabel="保存乙方" onSubmit={saveOther} /> : null}
      {report ? (
        <article className="prose">
          <div className="score-line">
            <b>{report.score}</b>
            <span>{report.label}</span>
          </div>
          {report.lines.map((line) => (
            <p key={line.title}>
              <strong>{line.title} · {line.score}</strong>
              {line.text}
            </p>
          ))}
          <p>{report.summary}</p>
        </article>
      ) : null}
      <p className="disclaimer">合盘描述相处的着力点，不判断谁该在一起。</p>
    </section>
  );
}

function PersonCard({ title, profile, onEdit }: { title: string; profile: Profile | null; onEdit: () => void }) {
  return (
    <button className="person" type="button" onClick={onEdit}>
      <span>{title}</span>
      <strong>{profile ? profile.name || '未署名' : '尚未填写'}</strong>
      <small>
        {profile
          ? `${profile.year}-${profile.month}-${profile.day} ${profile.hour}:${String(profile.minute).padStart(2, '0')}`
          : '点此填写生辰'}
      </small>
    </button>
  );
}
