import InitialsAvatar from './InitialsAvatar';
import Badge from './Badge';

export default function VolunteerCard({ volunteer }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-b-0">
      <InitialsAvatar name={volunteer.nama} size={36} bgClass={volunteer.avatarBg} />

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-900 truncate">{volunteer.nama}</p>
        <p className="text-[12px] text-slate-400 truncate">{volunteer.jarak} · {volunteer.eta}</p>
      </div>

      <Badge variant={volunteer.status} className="text-[11px] shrink-0" />
    </div>
  );
}
