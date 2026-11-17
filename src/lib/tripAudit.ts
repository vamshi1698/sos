import type { Ambulance, AmbulanceRequest, DispatchEvent, RequestStatus, TripAuditEntry } from '@/types';

const TIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

export const STAGE_CONFIG: Record<
  RequestStatus,
  { step: number; title: string; defaultDurationMs: number }
> = {
  pending: { step: 1, title: 'Request Intake Received', defaultDurationMs: 0 },
  assigned: { step: 2, title: 'Ambulance Unit Matched', defaultDurationMs: 2500 },
  accepted: { step: 3, title: 'Crew Acknowledged & Accepted', defaultDurationMs: 3000 },
  en_route: { step: 4, title: 'En Route to Incident Scene', defaultDurationMs: 5000 },
  on_scene: { step: 5, title: 'Arrived on Scene & Stabilizing', defaultDurationMs: 6500 },
  completed: { step: 6, title: 'Hospital ER Handover Completed', defaultDurationMs: 7000 },
};

const STAGE_ORDER: RequestStatus[] = ['pending', 'assigned', 'accepted', 'en_route', 'on_scene', 'completed'];

export function generateTripAuditLog(
  request: AmbulanceRequest,
  ambulance?: Ambulance,
  events: DispatchEvent[] = []
): TripAuditEntry[] {
  // If request already has populated auditLog, return it
  if (request.auditLog && request.auditLog.length > 0) {
    return request.auditLog;
  }

  const entries: TripAuditEntry[] = [];
  const currentIndex = STAGE_ORDER.indexOf(request.status);

  // Find related events
  const relatedEvents = events
    .filter((e) => e.requestId === request.id)
    .sort((a, b) => a.createdAt - b.createdAt);

  const timestamps: Partial<Record<RequestStatus, number>> = {
    ...request.stageTimestamps,
    pending: request.createdAt,
  };

  let runningTime = request.createdAt;

  STAGE_ORDER.forEach((stage, idx) => {
    const config = STAGE_CONFIG[stage];
    const isPast = idx < currentIndex || request.status === 'completed';
    const isActive = idx === currentIndex && request.status !== 'completed';

    if (timestamps[stage]) {
      runningTime = timestamps[stage]!;
    } else if (isPast) {
      runningTime += config.defaultDurationMs;
      timestamps[stage] = runningTime;
    } else if (isActive) {
      runningTime = request.stageAt || runningTime + config.defaultDurationMs;
      timestamps[stage] = runningTime;
    }

    const ts = timestamps[stage] || (isActive ? request.stageAt : runningTime + config.defaultDurationMs);
    const timeFormatted = TIME_FORMATTER.format(new Date(ts));
    const elapsedSeconds = idx === 0 ? 0 : Math.max(1, Math.round((ts - request.createdAt) / 1000));

    let description = '';
    let actor = 'Central Dispatch System';

    if (stage === 'pending') {
      description = `Emergency call/intake captured via ${request.channel}. Location: ${request.pickupArea} (${request.pickupNote || 'General area'}). Care category: ${request.category}.`;
      actor = `${request.channel} Channel Gateway`;
    } else if (stage === 'assigned') {
      const ambName = ambulance ? `${ambulance.registration} (${ambulance.operator})` : 'Emergency Unit';
      description = `Optimal vehicle dispatched: ${ambName}. Proximity score calculated; estimated distance: ${request.distanceKm ?? 2.4} km.`;
      actor = 'AI & Dispatch Coordinator';
    } else if (stage === 'accepted') {
      const ambName = ambulance?.registration ?? 'Assigned Crew';
      description = `${ambName} accepted mission. Paramedics confirmed vehicle telemetry readiness.`;
      actor = ambulance?.operator ?? 'Paramedic Unit';
    } else if (stage === 'en_route') {
      const ambName = ambulance?.registration ?? 'Ambulance';
      description = `${ambName} in active transit to patient with emergency strobes active (ETA: ${request.etaMinutes ?? 4} min). Corridor preemption engaged.`;
      actor = ambulance?.registration ?? 'Driver Navigation';
    } else if (stage === 'on_scene') {
      description = `Ambulance arrived at ${request.pickupArea}. Patient (${request.patientName}) secured, vital baseline monitored, moving to ${request.hospital?.name ?? 'trauma center'}.`;
      actor = 'On-Scene Paramedics';
    } else if (stage === 'completed') {
      description = `Safe handoff completed at ${request.hospital?.name ?? 'receiving trauma hospital'}. Emergency trip closed. Vehicle returned to active standby pool.`;
      actor = 'Hospital ER Triage Staff';
    }

    // Match exact event message if available
    const matchedEvent = relatedEvents.find((e) => {
      if (stage === 'assigned' && (e.message.includes('dispatched') || e.message.includes('assigned'))) return true;
      if (stage === 'accepted' && e.message.includes('accepted')) return true;
      if (stage === 'en_route' && e.message.includes('en route')) return true;
      if (stage === 'on_scene' && e.message.includes('on scene')) return true;
      if (stage === 'completed' && e.message.includes('completed')) return true;
      return false;
    });

    if (matchedEvent) {
      description = matchedEvent.message;
    }

    entries.push({
      step: config.step,
      stage,
      title: config.title,
      timestamp: ts,
      timeFormatted,
      elapsedSeconds,
      description,
      actor,
      status: isPast ? 'completed' : isActive ? 'active' : 'pending',
    });
  });

  return entries;
}
