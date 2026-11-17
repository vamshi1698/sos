import type { DispatchAction, DispatchState } from '@/lib/dispatch';
import { rankCandidates } from '@/lib/matching';

const MATCH_DELAY_MS = 1500;
const USER_REQUEST_HOLD_MS = 60000; // 1 minute manual exploration window before automating user requests
const OPERATOR_RESPONSE_MS = 3000;
const STAGE_DURATION_MS: Partial<Record<string, number>> = {
  accepted: 4000,
  en_route: 6000,
  on_scene: 8000,
};

export function nextAutomatedAction(state: DispatchState, now: number): DispatchAction | null {
  if (!state.loaded) return null;

  if (state.autoDispatch) {
    const pending = state.requests
      .filter((r) => {
        if (r.status !== 'pending') return false;
        // User-submitted requests hold for 1 full minute (60s) so user can explore dispatch control
        const isUserRequest = r.channel === 'Mobile app' && !r.aiCaptured;
        const requiredDelay = isUserRequest ? USER_REQUEST_HOLD_MS : MATCH_DELAY_MS;
        return now - r.createdAt >= requiredDelay;
      })
      .sort((a, b) => a.createdAt - b.createdAt);
    for (const request of pending) {
      const [best] = rankCandidates(state.ambulances, request);
      if (best) {
        return { type: 'assign', at: now, requestId: request.id, ambulanceId: best.id, automated: true };
      }
      if (!request.alerts.some((alert) => alert.startsWith('No suitable ambulance'))) {
        return { type: 'escalate', at: now, requestId: request.id };
      }
    }
  }

  for (const request of state.requests) {
    const elapsed = now - request.stageAt;
    if (request.status === 'assigned' && elapsed >= OPERATOR_RESPONSE_MS) {
      return { type: 'operatorAccept', at: now, requestId: request.id };
    }
    const duration = STAGE_DURATION_MS[request.status];
    if (duration !== undefined && elapsed >= duration) {
      return { type: 'advance', at: now, requestId: request.id };
    }
  }

  return null;
}
