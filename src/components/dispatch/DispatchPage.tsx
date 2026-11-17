import { useEffect, useState } from 'react';
import { Clock, ExternalLink, Sparkles, Zap } from 'lucide-react';
import ActivityLog from '@/components/dispatch/ActivityLog';
import AmbulanceFleet from '@/components/dispatch/AmbulanceFleet';
import AssignmentPanel from '@/components/dispatch/AssignmentPanel';
import AutomationControls from '@/components/dispatch/AutomationControls';
import KpiCards from '@/components/dispatch/KpiCards';
import RequestTable from '@/components/dispatch/RequestTable';
import SwimlaneWorkflowVisualizer from '@/components/simulation/SwimlaneWorkflowVisualizer';
import type { Ambulance, AmbulanceRequest, DispatchEvent, View } from '@/types';

interface DispatchPageProps {
  loaded: boolean;
  loadError: string | null;
  saveError: string | null;
  onRetry: () => void;
  requests: AmbulanceRequest[];
  ambulances: Ambulance[];
  events: DispatchEvent[];
  autoDispatch: boolean;
  onAutoDispatchChange: (enabled: boolean) => void;
  feedEnabled: boolean;
  feedFinished: boolean;
  onFeedEnabledChange: (enabled: boolean) => void;
  onAssign: (requestId: string, ambulanceId: string) => void;
  onDecline: (requestId: string, reason: string) => void;
  onNavigate?: (view: View) => void;
}

export default function DispatchPage({
  loaded,
  loadError,
  saveError,
  onRetry,
  requests,
  ambulances,
  events,
  autoDispatch,
  onAutoDispatchChange,
  feedEnabled,
  feedFinished,
  onFeedEnabledChange,
  onAssign,
  onDecline,
  onNavigate,
}: DispatchPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showWorkflowDrawer, setShowWorkflowDrawer] = useState<boolean>(false);

  // Automatically find any recent user-submitted pending or assigned request
  const userRequest = requests.find((r) => r.channel === 'Mobile app' && !r.aiCaptured);
  const pendingUserRequest = requests.find(
    (r) => r.channel === 'Mobile app' && !r.aiCaptured && r.status === 'pending'
  );

  const selected = (selectedId ? requests.find((r) => r.id === selectedId) : null) ?? pendingUserRequest ?? userRequest ?? requests[0];

  // Seconds remaining for pending user request
  const [userHoldSeconds, setUserHoldSeconds] = useState<number>(() => {
    if (!pendingUserRequest) return 0;
    return Math.max(0, Math.ceil((60000 - (Date.now() - pendingUserRequest.createdAt)) / 1000));
  });

  useEffect(() => {
    if (!pendingUserRequest) {
      setUserHoldSeconds(0);
      return;
    }
    const updateCountdown = () => {
      const left = Math.max(0, Math.ceil((60000 - (Date.now() - pendingUserRequest.createdAt)) / 1000));
      setUserHoldSeconds(left);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 500);
    return () => clearInterval(timer);
  }, [pendingUserRequest?.id, pendingUserRequest?.createdAt]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-lg tracking-wider text-comic-red">Dispatch console</p>
          <h1 className="mt-1 text-5xl text-ink sm:text-6xl">Coordination centre</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('simulation')}
              className="comic-button-primary px-4 py-2 text-sm flex items-center gap-2"
            >
              <Zap className="h-4 w-4" /> Open Full BPMN Simulation <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowWorkflowDrawer((prev) => !prev)}
            className="comic-button-yellow px-4 py-2 text-sm flex items-center gap-2"
          >
            {showWorkflowDrawer ? 'Hide Swimlane Diagram' : '⚡ Show Swimlane Diagram'}
          </button>
        </div>
      </header>

      {/* User-submitted request notification banner with 1-min exploration countdown */}
      {pendingUserRequest && userHoldSeconds > 0 && (
        <div className="rounded-xl border-4 border-ink bg-comic-yellow p-4 shadow-panel animate-pop-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-white shadow-xs">
                <Clock className="h-5 w-5 animate-spin text-ink" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl text-ink font-bold">
                    User Request Received: {pendingUserRequest.id}
                  </h3>
                  <span className="comic-tag bg-comic-red text-white text-xs">
                    Manual Exploration Window
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink/80">
                  Patient: <span className="font-bold">{pendingUserRequest.patientName}</span> ({pendingUserRequest.pickupArea}) • 
                  Automation paused for <span className="font-bold font-mono text-comic-red text-base">{userHoldSeconds}s</span> so you can explore candidates and test manual dispatch.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedId(pendingUserRequest.id)}
                className="comic-button-primary px-4 py-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-panel-sm"
              >
                <Sparkles className="h-4 w-4" /> Inspect & Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optional In-Page Swimlane Diagram */}
      {showWorkflowDrawer && (
        <div className="border-4 border-ink p-4 bg-comic-paper shadow-panel space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-ink">BPMN Coordination Swimlanes</h3>
            <span className="text-xs font-bold text-ink/70">Asynchronous 3-Lane Architecture</span>
          </div>
          <SwimlaneWorkflowVisualizer
            requests={requests}
            ambulances={ambulances}
            selectedRequest={selected}
            onSelectRequest={(r: AmbulanceRequest) => setSelectedId(r.id)}
            onAssign={onAssign}
            onOperatorDecline={onDecline}
          />
        </div>
      )}

      <AutomationControls
        autoDispatch={autoDispatch}
        onAutoDispatchChange={onAutoDispatchChange}
        feedEnabled={feedEnabled}
        feedFinished={feedFinished}
        onFeedEnabledChange={onFeedEnabledChange}
        loadError={loadError}
        saveError={saveError}
        onRetry={onRetry}
      />

      {!loaded && !loadError ? (
        <p className="comic-panel p-8 text-center font-display text-2xl tracking-wide">Loading dispatch data...</p>
      ) : (
        <>
          <KpiCards requests={requests} ambulances={ambulances} />

          <div className="grid gap-6 xl:grid-cols-[1fr_420px] items-start">
            <div className="space-y-3">
              <h2 className="text-3xl text-ink">Request queue</h2>
              <RequestTable
                requests={requests}
                ambulances={ambulances}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
              />
            </div>
            <AssignmentPanel
              request={selected}
              ambulances={ambulances}
              autoDispatch={autoDispatch}
              onAssign={onAssign}
              onDecline={onDecline}
              events={events}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_420px] items-start">
            <AmbulanceFleet ambulances={ambulances} />
            <ActivityLog events={events} />
          </div>
        </>
      )}
    </div>
  );
}
