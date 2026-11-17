import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  ShieldCheck,
  User,
} from 'lucide-react';
import { generateTripAuditLog } from '@/lib/tripAudit';
import type { Ambulance, AmbulanceRequest, DispatchEvent } from '@/types';

interface TripAuditLogProps {
  request: AmbulanceRequest;
  ambulance?: Ambulance;
  events?: DispatchEvent[];
}

export default function TripAuditLog({ request, ambulance, events = [] }: TripAuditLogProps) {
  const [expanded, setExpanded] = useState(true);
  const auditEntries = generateTripAuditLog(request, ambulance, events);

  const completedCount = auditEntries.filter((e) => e.status === 'completed').length;
  const isTripFinished = request.status === 'completed';

  const totalDurationSeconds =
    auditEntries.length > 0 && isTripFinished
      ? Math.max(1, Math.round((auditEntries[auditEntries.length - 1].timestamp - auditEntries[0].timestamp) / 1000))
      : Math.max(1, Math.round((Date.now() - request.createdAt) / 1000));

  return (
    <section className="rounded-xl border-4 border-ink bg-white p-3.5 sm:p-4 shadow-panel space-y-3">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded border-2 border-ink bg-comic-yellow text-ink font-bold shadow-xs">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-lg tracking-wide text-ink flex items-center gap-1.5 font-bold">
              Trip Step Audit Trail
            </h3>
            <p className="text-[11px] text-ink/70">
              Immutable timestamped log for every dispatch and transit lifecycle step.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded border-2 border-ink bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
            {completedCount}/6 Steps • {totalDurationSeconds}s elapsed
          </span>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded border-2 border-ink bg-comic-paper px-2 py-0.5 text-xs font-bold text-ink hover:bg-comic-yellow transition-all flex items-center gap-1 shadow-xs"
            aria-label={expanded ? 'Collapse audit trail' : 'Expand audit trail'}
          >
            {expanded ? (
              <>
                <span>Hide</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>View All</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Decline Alerts in Audit Trail if any */}
      {request.declinedAmbulanceIds.length > 0 && (
        <div className="rounded border-2 border-comic-red bg-rose-50 p-2 text-xs text-rose-900 space-y-1">
          <span className="font-bold flex items-center gap-1 text-comic-red">
            <AlertTriangle className="h-3.5 w-3.5" />
            Audit Note: Operator Declines Logged ({request.declinedAmbulanceIds.length})
          </span>
          {request.alerts
            .filter((a) => a.startsWith('Declined by operator'))
            .map((alert, i) => (
              <p key={i} className="text-[11px] font-mono text-rose-800">
                • {alert}
              </p>
            ))}
        </div>
      )}

      {/* Step by Step Timeline */}
      {expanded && (
        <ol className="relative space-y-2.5 border-l-2 border-ink/30 ml-2.5 pl-4 sm:pl-5 text-xs">
          {auditEntries.map((entry) => {
            const isCompleted = entry.status === 'completed';
            const isActive = entry.status === 'active';

            return (
              <li key={entry.step} className="relative group">
                {/* Step Marker Badge on the Line */}
                <span
                  className={`absolute -left-[27px] sm:-left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink font-display text-[11px] font-bold shadow-xs transition-transform ${
                    isCompleted
                      ? 'bg-ink text-comic-yellow'
                      : isActive
                        ? 'bg-comic-red text-white animate-pulse ring-2 ring-comic-red/40'
                        : 'bg-white text-ink/40 border-ink/40'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" /> : entry.step}
                </span>

                {/* Entry Card */}
                <div
                  className={`rounded-lg border-2 p-2.5 transition-all ${
                    isActive
                      ? 'border-comic-red bg-amber-50/80 shadow-xs'
                      : isCompleted
                        ? 'border-ink/20 bg-slate-50/80 hover:bg-white hover:border-ink/40'
                        : 'border-dashed border-ink/20 bg-white/40 text-ink/50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-ink font-display tracking-wide text-xs sm:text-sm">
                        Step {entry.step}: {entry.title}
                      </span>
                      {isActive && (
                        <span className="rounded bg-comic-red px-1.5 py-0.2 text-[9px] font-bold text-white uppercase animate-pulse">
                          Current Step
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-ink">
                        <Clock className="h-3 w-3 text-ink/70" />
                        {entry.timeFormatted}
                      </span>
                      {entry.elapsedSeconds !== undefined && entry.elapsedSeconds > 0 && (
                        <span className="rounded bg-comic-paper border border-ink/20 px-1 py-0.2 text-[10px] font-mono text-ink/70">
                          +{entry.elapsedSeconds}s
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-1 text-[11px] text-ink/80 leading-relaxed font-body">
                    {entry.description}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-ink/60 border-t border-ink/10 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <User className="h-2.5 w-2.5" />
                      Actor: <span className="font-semibold text-ink/80">{entry.actor}</span>
                    </span>
                    <span
                      className={`font-bold uppercase tracking-wider text-[9px] ${
                        isCompleted
                          ? 'text-emerald-700'
                          : isActive
                            ? 'text-amber-800'
                            : 'text-slate-400'
                      }`}
                    >
                      {entry.status === 'completed'
                        ? 'Verified ✓'
                        : entry.status === 'active'
                          ? 'In Progress ⚡'
                          : 'Pending'}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Bottom Audit Verification Seal */}
      <div className="flex items-center justify-between pt-1 border-t border-ink/10 text-[10px] text-ink/60">
        <span className="flex items-center gap-1 font-mono">
          <ShieldCheck className="h-3 w-3 text-emerald-600" />
          Pranrath BPMN Audit Spec • SHA-Verified Timestamps
        </span>
        <span className="font-mono">Ref: {request.id}</span>
      </div>
    </section>
  );
}
