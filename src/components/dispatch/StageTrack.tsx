import { Check } from 'lucide-react';
import type { RequestStatus } from '@/types';

const STAGES: { status: RequestStatus; label: string }[] = [
  { status: 'pending', label: 'Received' },
  { status: 'assigned', label: 'Matched' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'en_route', label: 'En route' },
  { status: 'on_scene', label: 'On scene' },
  { status: 'completed', label: 'Completed' },
];

const TIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

export default function StageTrack({
  status,
  stageTimestamps,
}: {
  status: RequestStatus;
  stageTimestamps?: Partial<Record<RequestStatus, number>>;
}) {
  const current = STAGES.findIndex((s) => s.status === status);
  return (
    <ol className="grid grid-cols-6 gap-1" aria-label="Trip progress">
      {STAGES.map((stage, index) => {
        const done = index < current || status === 'completed';
        const active = index === current && status !== 'completed';
        const timestamp = stageTimestamps?.[stage.status];
        return (
          <li key={stage.status} className="min-w-0 text-center">
            <span
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink font-display text-sm transition-transform ${
                done
                  ? 'bg-ink text-comic-yellow'
                  : active
                    ? 'animate-pulse bg-comic-yellow-deep text-ink ring-2 ring-comic-red'
                    : 'bg-comic-cream text-ink/50'
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
            </span>
            <span className={`mt-1 block truncate text-[11px] font-bold ${active ? 'text-ink' : 'text-ink/60'}`}>
              {stage.label}
            </span>
            {timestamp && (
              <span className="block truncate font-mono text-[9px] text-ink/75 font-semibold">
                {TIME_FORMAT.format(new Date(timestamp))}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
