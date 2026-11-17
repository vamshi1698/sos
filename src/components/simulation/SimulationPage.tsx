import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react';
import SwimlaneWorkflowVisualizer from '@/components/simulation/SwimlaneWorkflowVisualizer';
import DispatchFleetRow from '@/components/simulation/DispatchFleetRow';
import DualPovScreens from '@/components/simulation/DualPovScreens';
import { MOST_USED_SERVICES } from '@/data/services';
import type { Ambulance as AmbulanceType, AmbulanceRequest, View } from '@/types';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface SimulationPageProps {
  requests: AmbulanceRequest[];
  ambulances: AmbulanceType[];
  autoDispatch: boolean;
  onAutoDispatchChange: (enabled: boolean) => void;
  onAssign: (requestId: string, ambulanceId: string) => void;
  onDecline: (requestId: string, reason: string) => void;
  onOperatorAccept?: (requestId: string) => void;
  onAdvanceStage?: (requestId: string) => void;
  onSubmitFeedback?: (requestId: string, rating: number, feedback: string) => void;
  onSpawnPresetDemo?: (presetIndex: number) => string;
  onSpawnServiceDemo?: (serviceId: string) => string;
  onNavigate?: (view: View) => void;
}

// 11 human-friendly, plain-English steps matching the full process flow
const SIM_STEPS = [
  {
    step: 1,
    title: 'Emergency Happens & Patient Opens App',
    description: 'A medical crisis happens. Family or bystander opens the Pranrath app on their phone.',
    actor: 'Patient / Family',
    badge: 'Patient App',
  },
  {
    step: 2,
    title: 'Phone Auto-Detects Live GPS Location',
    description: 'App locks live satellite GPS coordinates automatically, so nobody has to type or explain addresses.',
    actor: 'Patient / Family',
    badge: 'Satellite GPS',
  },
  {
    step: 3,
    title: 'Selects Emergency Type & Sends Instant SOS',
    description: 'User taps the emergency type (e.g. Accident, Heart, Child) and hits Send SOS to the control center.',
    actor: 'Patient / Family',
    badge: 'SOS Signal',
  },
  {
    step: 4,
    title: 'Central Control Room Receives the SOS Call',
    description: 'Central Dispatch screen rings with the caller location, emergency type, and nearest landmark.',
    actor: 'Central Dispatch',
    badge: 'Control Room',
  },
  {
    step: 5,
    title: 'System Scans All Nearby Ambulances for Fastest Match',
    description: 'Dispatch evaluates all fleet ambulances in real-time by distance, traffic, and life-support equipment.',
    actor: 'Central Dispatch',
    badge: 'Fleet Scan',
  },
  {
    step: 6,
    title: 'Dispatcher Confirms & Alerts the Ambulance Crew',
    description: 'Dispatcher selects Unit #2 (KA-03-DEMO-202) and transmits an emergency alarm directly to the vehicle.',
    actor: 'Central Dispatch',
    badge: 'Unit Matched',
  },
  {
    step: 7,
    title: 'In-Cab Siren Chimes & Driver Accepts Call',
    description: 'A loud alert chime sounds inside the ambulance cab. The driver reviews the trip and taps ACCEPT.',
    actor: 'Ambulance Operator',
    badge: 'In-Cab MDT',
  },
  {
    step: 8,
    title: 'Ambulance Drives to Patient with Live GPS Tracking',
    description: 'Ambulance rushes with sirens on at 48 km/h. Patient watches the vehicle moving live on their phone map.',
    actor: 'Ambulance Operator & Patient',
    badge: 'Live En Route',
  },
  {
    step: 9,
    title: 'Ambulance Arrives & Paramedics Safely Board Patient',
    description: 'Paramedics reach the scene, provide first-aid triage, and safely load the patient onto the stretcher.',
    actor: 'Ambulance Operator & Patient',
    badge: 'On Scene',
  },
  {
    step: 10,
    title: 'Ambulance Rushes to Nearest Trauma Hospital',
    description: 'Vehicle navigates with sirens to the Emergency Trauma Hospital. Emergency Room doctors are pre-alerted.',
    actor: 'Ambulance Operator',
    badge: 'Hospital Rush',
  },
  {
    step: 11,
    title: 'Safe Hospital Handover & Family Leaves 5★ Rating',
    description: 'Emergency doctors receive the patient. Trip completes and family submits a 5-star experience rating.',
    actor: 'End-to-End Complete',
    badge: 'Mission Done',
  },
];

const TOUR_STORAGE_KEY = 'pranrath_sim_tour_completed';

function hasCompletedTourOnce(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function markTourCompletedOnce(): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export default function SimulationPage({
  requests,
  ambulances,
  onAssign,
  onDecline,
  onOperatorAccept,
  onAdvanceStage,
  onSpawnServiceDemo,
}: SimulationPageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState('accident');
  const [isDeclineSimulated, setIsDeclineSimulated] = useState(false);
  const timerRef = useRef<number | null>(null);
  const hasAutoStartedRef = useRef(false);

  // Active request
  const activeRequest = requests[0];
  const assignedAmb = ambulances.find((a) => a.id === activeRequest?.ambulanceId) || ambulances[1];

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 11) {
            setIsPlaying(false);
            return 11;
          }
          const next = prev + 1;
          // Trigger backend state advances to match visual step
          if (next === 6 && activeRequest && ambulances.length > 1) {
            onAssign(activeRequest.id, ambulances[1].id);
          } else if (next === 7 && activeRequest && onOperatorAccept) {
            onOperatorAccept(activeRequest.id);
          } else if ((next === 9 || next === 10 || next === 11) && activeRequest && onAdvanceStage) {
            onAdvanceStage(activeRequest.id);
          }
          return next;
        });
      }, 3200);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeRequest, ambulances, onAssign, onOperatorAccept, onAdvanceStage]);

  const handleResetSimulation = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(1);
    setIsDeclineSimulated(false);
    if (onSpawnServiceDemo) {
      onSpawnServiceDemo(selectedServiceId);
    }
  }, [onSpawnServiceDemo, selectedServiceId]);

  const handleStartSimulation = useCallback(() => {
    if (currentStep >= 11) {
      handleResetSimulation();
    }
    setIsPlaying(true);
  }, [currentStep, handleResetSimulation]);

  const handlePauseSimulation = () => {
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => {
      const next = Math.min(11, prev + 1);
      if (next === 6 && activeRequest && ambulances.length > 1) {
        onAssign(activeRequest.id, ambulances[1].id);
      } else if (next === 7 && activeRequest && onOperatorAccept) {
        onOperatorAccept(activeRequest.id);
      } else if ((next === 9 || next === 10 || next === 11) && activeRequest && onAdvanceStage) {
        onAdvanceStage(activeRequest.id);
      }
      return next;
    });
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSimulateDecline = () => {
    setIsDeclineSimulated(true);
    setIsPlaying(false);
    if (activeRequest) {
      onDecline(activeRequest.id, 'Traffic congestion on 80ft Road');
    }
    setTimeout(() => {
      setIsDeclineSimulated(false);
      // Auto re-assign to next unit
      if (activeRequest && ambulances.length > 2) {
        onAssign(activeRequest.id, ambulances[2].id);
      }
    }, 3000);
  };

  const currentStepInfo = SIM_STEPS[currentStep - 1] || SIM_STEPS[0];

  const handleStartSimulationRef = useRef(handleStartSimulation);
  useEffect(() => {
    handleStartSimulationRef.current = handleStartSimulation;
  }, [handleStartSimulation]);

  const startSimulationTour = useCallback(() => {
    const driverObj = driver({
      popoverClass: 'driverjs-theme',
      showProgress: true,
      animate: true,
      allowClose: true,
      stagePadding: 8,
      stageRadius: 12,
      nextBtnText: 'Next Step →',
      prevBtnText: '← Back',
      doneBtnText: 'Start Simulation 🚀',
      onDestroyStarted: () => {
        // If driver completed all steps and user clicks done, start the simulation automatically
        if (!driverObj.hasNextStep()) {
          handleStartSimulationRef.current();
        }
        driverObj.destroy();
      },
      steps: [
        {
          element: '#start-simulation-btn',
          popover: {
            title: 'Before we start',
            description:
              'Welcome to Pranrath! Take this quick walkthrough to explore the 11-step emergency dispatch lifecycle before starting the live simulation.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#emergency-scenario-selector',
          popover: {
            title: 'Emergency Scenarios',
            description:
              'Choose an emergency category (Accident, Cardiac, Child, Maternity, or Stroke) to simulate specialized triage and dispatch protocols.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#simulation-progress-bar',
          popover: {
            title: '11-Stage Workflow Tracker',
            description:
              'Follow the live crisis progress meter from the initial SOS tap to satellite GPS locking, driver rush, and trauma hospital handover.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#simulation-step-controls',
          popover: {
            title: 'Step Controls & Decline Loop',
            description:
              'Use Next and Back to navigate milestones manually, pause anytime, or test driver decline to see automated re-assignment.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '#bpmn-process-flow',
          popover: {
            title: 'BPMN Live Process Flow',
            description:
              'Watch active process nodes illuminate across Patient App, Central Dispatch, and Ambulance Operator swimlanes as each step completes.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#dispatch-fleet-row',
          popover: {
            title: 'Bangalore Fleet Status',
            description:
              'Central Dispatch monitors fleet ambulances across the city, scoring proximity, traffic, and onboard life-support equipment to assign the best unit.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#dual-pov-screens',
          popover: {
            title: 'Dual POV Live Screens',
            description:
              'View the Patient’s mobile tracking map side-by-side with the Paramedic’s In-Cab MDT terminal as they coordinate the rescue mission.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#start-simulation-btn',
          popover: {
            title: 'Ready to drive!',
            description:
              'Click "Start Simulation 🚀" below to launch the automated emergency workflow and watch all 11 life-saving steps run in real time.',
            side: 'bottom',
            align: 'start',
          },
        },
      ],
    });

    driverObj.drive();
  }, []);

  useEffect(() => {
    // Only show once automatically
    if (hasAutoStartedRef.current || hasCompletedTourOnce()) {
      return;
    }
    hasAutoStartedRef.current = true;
    markTourCompletedOnce();

    const timer = setTimeout(() => {
      startSimulationTour();
    }, 700);

    return () => clearTimeout(timer);
  }, [startSimulationTour]);

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:px-6">
      {/* =================================================================== */}
      {/* 1. MASTER SIMULATION CONTROLLER (SIMULATION START HEADER) */}
      {/* =================================================================== */}
      <div className="rounded-2xl border-4 border-ink bg-white p-3.5 shadow-panel space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-comic-red text-white shadow-panel-sm">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-ink leading-tight">
                Ambulance Coordination Platform
              </h1>
              <p className="text-[11px] sm:text-xs text-ink/70">
                Live interactive walkthrough in simple, easy-to-understand steps.
              </p>
            </div>
          </div>

          {/* Master Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="start-tour-btn"
              type="button"
              onClick={startSimulationTour}
              className="comic-button-yellow px-3 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-panel-sm"
              title="Take interactive tour to drive the simulation"
            >
              <Sparkles className="h-4 w-4 text-comic-red" />
              <span>Take Tour</span>
            </button>

            {!isPlaying ? (
              <button
                id="start-simulation-btn"
                type="button"
                onClick={handleStartSimulation}
                className="comic-button-primary px-4 py-1.5 text-sm sm:text-base flex items-center gap-2 shadow-panel-sm"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{currentStep >= 11 ? 'REPLAY SIMULATION' : 'START SIMULATION'}</span>
              </button>
            ) : (
              <button
                id="start-simulation-btn"
                type="button"
                onClick={handlePauseSimulation}
                className="comic-button-yellow px-4 py-1.5 text-sm sm:text-base flex items-center gap-2 shadow-panel-sm"
              >
                <Pause className="h-4 w-4 fill-current" />
                <span>PAUSE</span>
              </button>
            )}

            <div id="simulation-step-controls" className="flex flex-wrap items-center gap-1.5">
              <button
                id="prev-step-btn"
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep <= 1}
                className="comic-button-ghost px-2.5 py-1.5 text-xs sm:text-sm flex items-center gap-1 disabled:opacity-40"
                title="Previous Step"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <button
                id="next-step-btn"
                type="button"
                onClick={handleNextStep}
                disabled={currentStep >= 11}
                className="comic-button-ghost px-3 py-1.5 text-xs sm:text-sm flex items-center gap-1 disabled:opacity-40"
              >
                <span>Next Step</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                id="reset-simulation-btn"
                type="button"
                onClick={handleResetSimulation}
                className="comic-button-ghost px-2.5 py-1.5 text-xs"
                title="Reset simulation to beginning"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                id="test-decline-btn"
                type="button"
                onClick={handleSimulateDecline}
                className="rounded-lg border-2 border-comic-red px-2.5 py-1 text-xs font-bold text-comic-red hover:bg-red-50 transition-colors flex items-center gap-1"
                title="Test driver decline and re-match loop"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Test Decline Loop</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Step Progress Bar & Active Phase Banner */}
        <div id="simulation-progress-bar" className="rounded-xl border-2 border-ink bg-comic-paper px-3 py-2 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-display text-xs sm:text-sm tracking-wide text-comic-red flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-comic-red text-white text-[10px] font-bold">
                {currentStep}
              </span>
              <span>Step {currentStep} of 11: {currentStepInfo.title}</span>
            </span>
            <span className="font-mono text-[11px] font-bold text-ink/70">
              {Math.round((currentStep / 11) * 100)}% Complete
            </span>
          </div>

          {/* Progress bar track */}
          <div className="h-2 w-full rounded-full border border-ink bg-white overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-comic-red transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 11) * 100}%` }}
            />
          </div>

          <p className="text-[11px] sm:text-xs text-ink/80 leading-snug font-medium">
            {currentStepInfo.description}
          </p>
        </div>

        {/* Emergency Scenario Selector */}
        <div id="emergency-scenario-selector" className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-1 text-xs">
          <span className="font-display text-[11px] tracking-wider text-ink/70">
            Emergency Scenario:
          </span>
          <div className="flex flex-wrap gap-1">
            {MOST_USED_SERVICES.slice(0, 5).map((service) => {
              const Icon = service.icon;
              const isSelected = selectedServiceId === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    if (onSpawnServiceDemo) onSpawnServiceDemo(service.id);
                    setCurrentStep(1);
                    setIsPlaying(false);
                  }}
                  className={`flex items-center gap-1 rounded border-2 px-2 py-0.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-ink bg-comic-yellow text-ink shadow-xs -translate-y-0.5'
                      : 'border-ink/30 bg-white text-ink/75 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-3 w-3 text-comic-red" />
                  <span>{service.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. LIVE POV SCREENS (PATIENT APP, DRIVER IN-CAB & HOSPITAL ER RECEIVING) */}
      {/* =================================================================== */}
      <div id="dual-pov-screens">
        <DualPovScreens
          request={activeRequest}
          assignedAmbulance={assignedAmb}
          currentSimStep={currentStep}
          selectedServiceId={selectedServiceId}
          onSelectServiceId={(serviceId: string) => {
            setSelectedServiceId(serviceId);
            if (onSpawnServiceDemo) onSpawnServiceDemo(serviceId);
            setCurrentStep(1);
            setIsPlaying(false);
          }}
          onAdvanceStage={handleNextStep}
          onOperatorDecline={handleSimulateDecline}
          onOperatorAccept={() => {
            if (activeRequest && onOperatorAccept) onOperatorAccept(activeRequest.id);
            handleNextStep();
          }}
          onResetSimulation={handleResetSimulation}
        />
      </div>

      {/* =================================================================== */}
      {/* 3. DISPATCHING PART: CENTRAL FLEET POV */}
      {/* =================================================================== */}
      <div id="dispatch-fleet-row" className="rounded-2xl border-4 border-ink bg-white p-3.5 shadow-panel">
        <DispatchFleetRow
          ambulances={ambulances}
          activeRequest={activeRequest}
          onAssignAmbulance={(id) => activeRequest && onAssign(activeRequest.id, id)}
        />
      </div>

      {/* =================================================================== */}
      {/* 4. BPMN SWIMLANE DIAGRAM: LIVE PROCESS FLOW */}
      {/* =================================================================== */}
      <div id="bpmn-process-flow">
        <SwimlaneWorkflowVisualizer
          requests={requests}
          ambulances={ambulances}
          selectedRequest={activeRequest}
          currentSimStep={currentStep}
          isDeclineSimulated={isDeclineSimulated}
        />
      </div>
    </div>
  );
}
