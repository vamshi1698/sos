import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, MapPin, UserRound } from 'lucide-react';
import StageTrack from '@/components/dispatch/StageTrack';
import StatusBadge from '@/components/dispatch/StatusBadge';
import TripAuditLog from '@/components/dispatch/TripAuditLog';
import { DECLINE_REASONS } from '@/lib/dispatch';
import { rankCandidates } from '@/lib/matching';
import type { Ambulance, AmbulanceRequest, DispatchEvent } from '@/types';

interface AssignmentPanelProps {
  request: AmbulanceRequest | undefined;
  ambulances: Ambulance[];
  autoDispatch: boolean;
  onAssign: (requestId: string, ambulanceId: string) => void;
  onDecline: (requestId: string, reason: string) => void;
  events?: DispatchEvent[];
}

export default function AssignmentPanel({
  request,
  ambulances,
  autoDispatch,
  onAssign,
  onDecline,
  events,
}: AssignmentPanelProps) {
  if (!request) {
    return (
      <aside className="comic-panel-dark flex min-h-[320px] items-center justify-center p-6 text-center xl:sticky xl:top-20">
        <p className="font-display text-2xl tracking-wide text-comic-yellow">
          Select a request to see its trip progress.
        </p>
      </aside>
    );
  }

  return (
    <RequestDetail
      key={request.id}
      request={request}
      ambulances={ambulances}
      autoDispatch={autoDispatch}
      onAssign={onAssign}
      onDecline={onDecline}
      events={events}
    />
  );
}

function RequestDetail({
  request,
  ambulances,
  autoDispatch,
  onAssign,
  onDecline,
  events,
}: AssignmentPanelProps & { request: AmbulanceRequest }) {
  const [declineReason, setDeclineReason] = useState<string>(DECLINE_REASONS[0]);
  const assigned = ambulances.find((a) => a.id === request.ambulanceId);
  const candidates = rankCandidates(ambulances, request);

  const isUserSubmitted = request.channel === 'Mobile app' && !request.aiCaptured;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (request.status !== 'pending' || !isUserSubmitted) return 0;
    return Math.max(0, Math.ceil((60000 - (Date.now() - request.createdAt)) / 1000));
  });

  useEffect(() => {
    if (request.status !== 'pending' || !isUserSubmitted) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((60000 - (Date.now() - request.createdAt)) / 1000));
      setSecondsRemaining(left);
    }, 500);
    return () => clearInterval(interval);
  }, [request.id, request.status, request.createdAt, isUserSubmitted]);

  return (
    <aside className="comic-panel animate-pop-in space-y-5 p-5 sm:p-6 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain comic-scrollbar xl:sticky xl:top-20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-3xl text-ink">{request.id}</h2>
        <StatusBadge status={request.status} />
      </div>

      <StageTrack status={request.status} stageTimestamps={request.stageTimestamps} />

      <dl className="space-y-3 text-sm">
        <div className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <dt className="sr-only">Pickup</dt>
            <dd>
              <span className="font-bold">{request.pickupArea}</span> - {request.pickupNote}
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <UserRound className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <dt className="sr-only">Patient</dt>
            <dd>
              {request.patientName}
              {request.patientAge !== null ? `, ${request.patientAge} yrs` : ''} - {request.patientPhone}
            </dd>
          </div>
        </div>
        <div className="border-2 border-ink bg-white p-3">
          <div className="flex items-center justify-between">
            <dt className="font-display text-base tracking-wide text-ink/70">Reported situation</dt>
            {request.serviceType && (
              <span className="rounded bg-comic-yellow px-1.5 py-0.5 text-[10px] font-bold text-ink border border-ink">
                {request.serviceType}
              </span>
            )}
          </div>
          <dd className="mt-1 text-ink">{request.description}</dd>
        </div>
      </dl>

      <p className="text-xs text-ink/70">
        Needs {request.category} via {request.channel}.
        {request.aiCaptured ? ' Details were captured by AI. Confirm critical details with the caller.' : ''}
      </p>

      {request.alerts.length > 0 && (
        <div role="alert" className="space-y-2">
          {request.alerts
            .filter((alert) => {
              if (alert.startsWith('No suitable ambulance') && candidates.length > 0) return false;
              return true;
            })
            .map((alert, index) => (
              <p
                key={`${alert}-${index}`}
                className="flex items-start gap-2 border-4 border-ink bg-comic-red p-3 text-sm font-bold text-comic-cream"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {alert}
              </p>
            ))}
        </div>
      )}

      {request.status === 'pending' && isUserSubmitted && secondsRemaining > 0 && (
        <div className="rounded-lg border-2 border-amber-600 bg-amber-50 p-3 text-xs space-y-1.5 shadow-xs animate-pop-in">
          <div className="flex items-center justify-between font-bold text-amber-950">
            <span className="flex items-center gap-1.5 font-display text-sm tracking-wide">
              <Clock className="h-4 w-4 animate-spin text-amber-700" />
              Manual Exploration Window
            </span>
            <span className="rounded bg-amber-600 text-white px-2 py-0.5 font-mono text-xs font-bold animate-pulse">
              Auto-assigns in {secondsRemaining}s
            </span>
          </div>
          <p className="text-amber-900/80 leading-relaxed">
            Take 1 minute to explore candidate ambulances and assign manually, or let automated matching dispatch the optimal crew.
          </p>
        </div>
      )}

      {request.status === 'pending' && (
        <section className="space-y-3">
          <h3 className="font-display text-xl tracking-wider">
            {autoDispatch ? 'Override assignment' : 'Suitable ambulances'}
          </h3>
          {candidates.length === 0 ? (
            <p className="border-4 border-ink bg-comic-red p-3 text-sm font-bold text-comic-cream">
              No suitable ambulance is free right now. The system keeps checking and will match automatically.
            </p>
          ) : (
            <ul className="space-y-2">
              {candidates.map((ambulance, index) => (
                <li
                  key={ambulance.id}
                  className="flex items-center justify-between gap-3 border-4 border-ink bg-white p-3 shadow-panel-sm"
                >
                  <div className="min-w-0">
                    <p className="font-display text-lg tracking-wide">
                      {ambulance.registration}
                      {index === 0 && <span className="ml-2 comic-tag bg-comic-yellow">Best match</span>}
                    </p>
                    <p className="truncate text-xs text-ink/70">
                      {ambulance.category} - {ambulance.area}
                      {ambulance.area === request.pickupArea ? ' (same area)' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAssign(request.id, ambulance.id)}
                    className="comic-button-yellow px-4 py-2 text-lg"
                  >
                    Assign
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {request.status === 'assigned' && assigned && (
        <section className="space-y-3">
          <p className="text-sm">
            <span className="font-bold">{assigned.registration}</span> ({assigned.operator}) has been alerted and
            is expected to respond automatically.
          </p>
          <details className="border-4 border-ink bg-white p-3">
            <summary className="cursor-pointer font-display text-base tracking-wide">
              Testing: simulate operator decline
            </summary>
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                aria-label="Decline reason"
                className="comic-input min-w-0 flex-1 py-2 text-sm"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              >
                {DECLINE_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onDecline(request.id, declineReason)}
                className="comic-button-ghost px-4 py-2 text-base"
              >
                Decline
              </button>
            </div>
          </details>
        </section>
      )}

      {request.status === 'completed' && (
        <p className="border-4 border-ink bg-ink p-3 font-display text-lg tracking-wide text-comic-yellow">
          Trip completed. Ambulance is available again.
        </p>
      )}

      {/* Step-by-Step Audit Trail with Timestamps */}
      <TripAuditLog request={request} ambulance={assigned} events={events} />
    </aside>
  );
}
