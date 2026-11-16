import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  Ambulance,
  ArrowLeft,
  ArrowRight,
  Compass,
  Globe,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Phone,
  RotateCcw,
  Shield,
  Smartphone,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import ThreeAmbulanceScene from '@/components/home/ThreeAmbulanceScene';
import type { View } from '@/types';

interface Home3DHeroProps {
  onNavigate: (view: View) => void;
}

const STATS = [
  { value: '7', label: 'Sample ambulances', note: 'Fictional fleet data' },
  { value: '4', label: 'Request channels', note: 'Phone, WhatsApp, app, API' },
  { value: '6', label: 'Languages planned', note: 'Kannada to Malayalam' },
  { value: '< 45s', label: 'Avg Dispatch Time', note: 'Instant triage & routing' },
];

const CHANNELS = [
  {
    num: 1,
    icon: Phone,
    title: 'Phone Call',
    tagline: 'Speak once. The request fills itself in.',
    bullets: [
      'Caller speech translated (simulated)',
      'Pickup and contact details filled in automatically',
      'Flagged for dispatcher to confirm with caller',
    ],
  },
  {
    num: 2,
    icon: MessageCircle,
    title: 'WhatsApp',
    tagline: 'A guided chat that gathers everything.',
    bullets: [
      'Language and location collected in a guided chat',
      'Voice notes transcribed and translated (simulated)',
      'Flagged for dispatcher to confirm',
    ],
  },
  {
    num: 3,
    icon: Smartphone,
    title: 'Mobile App',
    tagline: 'Three taps from pickup to dispatch.',
    bullets: [
      'Pickup and patient details submitted in one form',
      'Ambulance matched without manual lookup',
      'Trip status updates as the crew progresses',
    ],
  },
  {
    num: 4,
    icon: Globe,
    title: 'External API',
    tagline: 'Hospitals and fleets connect directly.',
    bullets: [
      'Idempotency key blocks duplicate submissions',
      'Every request tagged with its source channel',
      'Trip progress tracked without manual updates',
    ],
  },
];

const WORKFLOW_STEPS = [
  {
    num: 1,
    title: 'Request comes in',
    body: 'A patient or caller submits a request from any channel. Details are captured once and stored against a request ID.',
  },
  {
    num: 2,
    title: 'Dispatcher reviews',
    body: 'The dispatcher checks the pickup, confirms critical details with caller, and reviews suitable vehicles.',
  },
  {
    num: 3,
    title: 'Operator responds',
    body: 'The assigned crew accepts or declines with a reason. A decline alerts the dispatcher straight away.',
  },
  {
    num: 4,
    title: 'Trip is tracked',
    body: 'Status moves through pickup, hospital and handover. Nothing stays unassigned without an alert.',
  },
];

const SECTIONS_METADATA = [
  {
    id: 1,
    tag: '01 / 05 • DISPATCH INTAKE • MIDNIGHT',
    speech: 'HELP IS COMING!',
    locationBadge: '00:05 • HOSPITAL BASE',
    navLabel: '01 Standby',
  },
  {
    id: 2,
    tag: '02 / 05 • CALL RECEIVED • ACCELERATING',
    speech: 'DISPATCHED!',
    locationBadge: '00:45 • CENTRAL DISPATCH',
    navLabel: '02 Dispatch',
  },
  {
    id: 3,
    tag: '03 / 05 • HIGH-SPEED TRANSIT • EN ROUTE',
    speech: 'ON THE WAY!',
    locationBadge: '03:12 • KORAMANGALA 80FT RD',
    navLabel: '03 Transit',
  },
  {
    id: 4,
    tag: '04 / 05 • EN-ROUTE PROTOCOLS • TELEMETRY',
    speech: 'PATIENT STABILIZED!',
    locationBadge: '05:40 • TRAUMA FAST-TRACK',
    navLabel: '04 Protocol',
  },
  {
    id: 5,
    tag: '05 / 05 • HOSPITAL ARRIVAL • ARRIVED',
    speech: 'HANDOFF COMPLETE!',
    locationBadge: '08:20 • MANIPAL EMERGENCY ER',
    navLabel: '05 Arrival',
  },
];

export default function Home3DHero({ onNavigate }: Home3DHeroProps) {
  const [currentSection, setCurrentSection] = useState(1);
  const [strobesEnabled, setStrobesEnabled] = useState(true);
  const [beamEnabled, setBeamEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [speechPos, setSpeechPos] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenNodesRef = useRef<{
    oscMain: OscillatorNode;
    oscSub: OscillatorNode;
    lfo: OscillatorNode;
    masterGain: GainNode;
  } | null>(null);

  // Realistic Emergency Ambulance Wail Siren Synthesizer
  useEffect(() => {
    if (soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;

        // 1. Primary Siren Horn Oscillator (resonant saw-tri hybrid)
        const oscMain = ctx.createOscillator();
        oscMain.type = 'sawtooth';
        oscMain.frequency.setValueAtTime(740, now);

        // 2. Secondary Sub-tone for body depth
        const oscSub = ctx.createOscillator();
        oscSub.type = 'sine';
        oscSub.frequency.setValueAtTime(370, now);

        // 3. Acoustic Horn Resonator Filter (simulates the 100W PA horn flare)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(3.2, now);

        // 4. LFO (Low-Frequency Oscillator) for the authentic smooth Wail pitch sweep
        const lfo = ctx.createOscillator();
        lfo.type = 'triangle';
        lfo.frequency.setValueAtTime(0.52, now); // ~1.9s smooth rise-and-fall cycle

        const lfoGainMain = ctx.createGain();
        lfoGainMain.gain.setValueAtTime(260, now); // Sweeps 480 Hz <-> 1000 Hz

        const lfoGainSub = ctx.createGain();
        lfoGainSub.gain.setValueAtTime(130, now);

        lfo.connect(lfoGainMain);
        lfoGainMain.connect(oscMain.frequency);

        lfo.connect(lfoGainSub);
        lfoGainSub.connect(oscSub.frequency);

        // 5. Balance Gains
        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime(0.7, now);
        oscMain.connect(mainGain);
        mainGain.connect(filter);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.3, now);
        oscSub.connect(subGain);
        subGain.connect(filter);

        // 6. Master Volume with Smooth Fade-in
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.0001, now);
        masterGain.gain.exponentialRampToValueAtTime(0.055, now + 0.35);

        filter.connect(masterGain);
        masterGain.connect(ctx.destination);

        oscMain.start(now);
        oscSub.start(now);
        lfo.start(now);

        sirenNodesRef.current = { oscMain, oscSub, lfo, masterGain };
      } catch {
        // Web Audio not supported
      }
    } else {
      if (sirenNodesRef.current && audioCtxRef.current) {
        try {
          const ctx = audioCtxRef.current;
          const now = ctx.currentTime;
          sirenNodesRef.current.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
          setTimeout(() => {
            try {
              sirenNodesRef.current?.oscMain.stop();
              sirenNodesRef.current?.oscSub.stop();
              sirenNodesRef.current?.lfo.stop();
              ctx.close();
            } catch {}
            sirenNodesRef.current = null;
            audioCtxRef.current = null;
          }, 250);
        } catch {
          sirenNodesRef.current = null;
          audioCtxRef.current = null;
        }
      }
    }

    return () => {
      if (sirenNodesRef.current && audioCtxRef.current) {
        try {
          sirenNodesRef.current.oscMain.stop();
          sirenNodesRef.current.oscSub.stop();
          sirenNodesRef.current.lfo.stop();
          audioCtxRef.current.close();
        } catch {}
        sirenNodesRef.current = null;
        audioCtxRef.current = null;
      }
    };
  }, [soundEnabled]);

  // Navigate next / previous section
  const handlePrev = useCallback(() => {
    setCurrentSection((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentSection((prev) => Math.min(5, prev + 1));
  }, []);

  // Touch Swipe for mobile devices
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current ? touchStartY.current - e.changedTouches[0].clientY : 0;
    touchStartX.current = null;
    touchStartY.current = null;

    const maxDiff = Math.abs(diffX) > Math.abs(diffY) ? diffX : diffY;
    if (Math.abs(maxDiff) > 35) {
      if (maxDiff > 0) {
        setCurrentSection((prev) => Math.min(5, prev + 1));
      } else {
        setCurrentSection((prev) => Math.max(1, prev - 1));
      }
    }
  };

  // Keyboard navigation (Left / Right / Up / Down)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev]);

  // Window-level wheel event listener to scroll horizontally across all 5 sections
  useEffect(() => {
    let isScrolling = false;
    let scrollTimeout: number;

    const onWindowWheel = (e: WheelEvent) => {
      // Prevent native browser vertical scrolling so page remains locked & smooth
      e.preventDefault();

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 8) return;

      if (isScrolling) return;
      isScrolling = true;

      if (delta > 0) {
        setCurrentSection((prev) => Math.min(5, prev + 1));
      } else {
        setCurrentSection((prev) => Math.max(1, prev - 1));
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        isScrolling = false;
      }, 500);
    };

    window.addEventListener('wheel', onWindowWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWindowWheel);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const activeMeta = SECTIONS_METADATA[currentSection - 1] || SECTIONS_METADATA[0];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full bg-[#090d16] text-white overflow-hidden select-none"
    >
      {/* ===================================================================== */}
      {/* 1. FIXED FULLSCREEN 3D THREE.JS CANVAS BACKGROUND */}
      {/* ===================================================================== */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden pointer-events-none">
        <ThreeAmbulanceScene
          currentSection={currentSection}
          strobesEnabled={strobesEnabled}
          beamEnabled={beamEnabled}
          onAmbulanceScreenPos={(x, y, visible) => {
            setSpeechPos({ x, y, visible });
          }}
        />
        {/* Subtle Atmospheric Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* ===================================================================== */}
      {/* 3. PERSISTENT RIGHT NAVIGATION ARROWS */}
      {/* ===================================================================== */}
      <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
        <button
          onClick={handlePrev}
          disabled={currentSection <= 1}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0c1322]/80 text-white backdrop-blur-xl shadow-xl hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Previous Section"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentSection >= 5}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0c1322]/80 text-white backdrop-blur-xl shadow-xl hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Next Section"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 4. FLOATING 3D SPEECH BUBBLE OVER THE 3D AMBULANCE */}
      {/* ===================================================================== */}
      {speechPos.visible && (
        <div
          className="absolute z-30 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            left: `${speechPos.x}px`,
            top: `${speechPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="relative rounded-2xl border-3 border-ink bg-white px-3.5 py-1.5 shadow-panel-sm animate-pop-in">
            <span className="font-display text-xs sm:text-sm tracking-wider text-ink font-bold whitespace-nowrap">
              {activeMeta.speech}
            </span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-ink" />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. HORIZONTAL SLIDING CONTENT TRACK (5 SECTIONS) */}
      {/* ===================================================================== */}
      <div
        className="relative z-10 flex h-full w-[500%] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: `translateX(-${(currentSection - 1) * 20}%)`,
        }}
      >
        {/* ----------------------------------------------------------------- */}
        {/* SLIDE 1: READY TO RESPOND & 4 STATS (01 / 05) */}
        {/* ----------------------------------------------------------------- */}
        <div className="w-[20%] h-full shrink-0 flex flex-col justify-center pl-16 sm:pl-20 lg:pl-24 pr-4 pb-16 pt-16 sm:pt-20 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-[460px] lg:max-w-[480px] space-y-3 my-auto">
            {/* Hero Card */}
            <div className="rounded-3xl border-2 border-white/15 bg-[#0a0f1d]/85 p-5 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-comic-yellow animate-ping" />
                <span className="font-mono text-[10px] sm:text-xs tracking-wider text-slate-300 font-semibold uppercase">
                  {SECTIONS_METADATA[0].tag}
                </span>
              </div>

              <div className="space-y-1">
                <p className="inline-block -rotate-2 border-2 border-ink bg-comic-yellow px-2 py-0.5 font-display text-[10px] sm:text-xs tracking-wider text-ink shadow-panel-sm mb-0.5">
                  Bengaluru Live Demo • Simulated Fleet Telemetry
                </p>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-wide text-white leading-tight">
                  READY TO{' '}
                  <span className="text-comic-yellow italic [text-shadow:0_0_24px_rgba(255,217,61,0.5)]">
                    RESPOND
                  </span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-normal">
                  One call. Every channel. A fast ambulance. Pranrath routes phone, WhatsApp, app, and API requests into one unified dispatch queue so human coordinators keep every trip visible.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  onClick={() => onNavigate('request')}
                  className="rounded-xl border-2 border-ink bg-comic-yellow px-3.5 py-1.5 text-xs font-bold text-ink shadow-panel-sm hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                >
                  <Ambulance className="h-3.5 w-3.5" />
                  <span>DISPATCH NOW</span>
                </button>

                <button
                  onClick={() => onNavigate('simulation')}
                  className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-all flex items-center gap-1.5 backdrop-blur-md"
                >
                  <span>BPMN Demo</span>
                  <ArrowRight className="h-3 w-3" />
                </button>

                <button
                  onClick={() => onNavigate('dispatch')}
                  className="rounded-xl border border-white/15 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-white/40 transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard className="h-3 w-3" />
                  <span>Console</span>
                </button>
              </div>
            </div>

            {/* 4 Stats Cards in Compact 2x2 Grid inside the left column */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs sm:text-sm tracking-wider text-comic-yellow">
                  LET <span className="text-comic-red">NUMBERS</span> SPEAK!
                </span>
                <span className="text-[10px] text-slate-400 font-mono">LIVE FLEET STATS</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border-2 border-white/15 bg-[#0a0f1d]/85 p-2.5 text-center backdrop-blur-xl shadow-xl hover:border-comic-yellow/50 transition-colors"
                  >
                    <dt className="font-body text-[10px] font-bold uppercase tracking-wide text-slate-400 leading-tight">
                      {stat.label}
                    </dt>
                    <dd className="mt-0.5 font-display text-2xl sm:text-3xl text-comic-red leading-none">
                      {stat.value}
                    </dd>
                    <p className="mt-0.5 text-[9px] text-slate-400 font-medium truncate">{stat.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SLIDE 2: FOUR CHANNELS. ONE DISPATCH QUEUE. (02 / 05) */}
        {/* ----------------------------------------------------------------- */}
        <div className="w-[20%] h-full shrink-0 flex flex-col justify-center pl-16 sm:pl-20 lg:pl-24 pr-4 pb-16 pt-16 sm:pt-20 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-[480px] lg:max-w-[500px] space-y-2.5 my-auto">
            {/* Header Card */}
            <div className="rounded-3xl border-2 border-white/15 bg-[#0a0f1d]/85 p-4 sm:p-5 backdrop-blur-2xl shadow-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-comic-red/20 border border-comic-red/40 px-2 py-0.5 text-[9px] font-bold text-comic-red uppercase">
                  CALL RECEIVED • ACCELERATING
                </span>
                <span className="font-mono text-[10px] sm:text-xs tracking-wider text-slate-400 font-semibold uppercase">
                  {SECTIONS_METADATA[1].tag}
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-wide text-white leading-tight">
                EMERGENCY{' '}
                <span className="text-comic-yellow italic [text-shadow:0_0_24px_rgba(255,217,61,0.5)]">
                  DISPATCH
                </span>
              </h2>

              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-normal">
                Swift call assignment with automated tracking. Instant notification to the nearest unit with digital routing overlays.
              </p>

              {/* Pipeline Stepper */}
              <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[10px]">
                <span className="rounded-md border border-ink bg-comic-yellow px-1.5 py-0.5 font-display font-bold text-ink shadow-xs">
                  FOUR CHANNELS
                </span>
                <ArrowRight className="h-2.5 w-2.5 text-comic-yellow" />
                <span className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 font-display text-white">
                  ONE QUEUE
                </span>
                <ArrowRight className="h-2.5 w-2.5 text-comic-yellow" />
                <span className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 font-display text-white">
                  BEST MATCH
                </span>
                <ArrowRight className="h-2.5 w-2.5 text-comic-yellow" />
                <span className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 font-display text-white">
                  HUMAN CONFIRMS
                </span>
              </div>
            </div>

            {/* 4 Interactive Channel Cards in compact 2x2 grid */}
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                return (
                  <div
                    key={ch.title}
                    className="rounded-2xl border-2 border-white/15 bg-[#0a0f1d]/85 p-3 backdrop-blur-xl shadow-xl hover:border-comic-yellow/50 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-ink bg-comic-yellow text-ink shadow-xs">
                          <Icon className="h-3 w-3" />
                        </span>
                        <h3 className="font-display text-xs sm:text-sm tracking-wide text-white leading-tight">
                          {ch.title}
                        </h3>
                      </div>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-comic-yellow text-ink font-display text-[10px] font-bold">
                        {ch.num}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium leading-tight">{ch.tagline}</p>

                    <ul className="space-y-0.5 border-t border-white/10 pt-1 text-[9px] sm:text-[10px] text-slate-300">
                      {ch.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-1">
                          <span className="text-comic-yellow font-bold leading-none">•</span>
                          <span className="leading-tight">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SLIDE 3: HOW IT WORKS & ON-ROUTE TRANSIT (03 / 05) */}
        {/* ----------------------------------------------------------------- */}
        <div className="w-[20%] h-full shrink-0 flex flex-col justify-center pl-16 sm:pl-20 lg:pl-24 pr-4 pb-16 pt-16 sm:pt-20 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-[460px] lg:max-w-[480px] space-y-2.5 my-auto">
            {/* Left Overview Card */}
            <div className="rounded-3xl border-2 border-white/15 bg-[#0a0f1d]/85 p-4 sm:p-5 backdrop-blur-2xl shadow-2xl space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] sm:text-xs tracking-wider text-slate-400 font-semibold uppercase">
                  {SECTIONS_METADATA[2].tag}
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-wide text-white leading-tight">
                HOW IT{' '}
                <span className="text-comic-yellow italic [text-shadow:0_0_24px_rgba(255,217,61,0.5)]">
                  WORKS
                </span>
              </h2>

              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-normal">
                Automation handles intake and telemetry tracking. People make every assignment decision. Rapid navigation through busy corridors with live-traffic rerouting and priority preemption.
              </p>

              {/* Speech Bubble Quote */}
              <div className="rounded-xl border-2 border-ink bg-white p-2.5 font-display text-xs sm:text-sm tracking-wide text-ink shadow-panel-sm">
                "Human dispatchers always keep the final say."
              </div>

              <div className="pt-0.5">
                <button
                  onClick={() => onNavigate('simulation')}
                  className="rounded-xl border-2 border-ink bg-comic-red px-3.5 py-1.5 text-xs font-bold text-white shadow-panel-sm hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  <span>TEST BPMN WORKFLOW</span>
                </button>
              </div>
            </div>

            {/* 4 Step Workflow Cards stacked cleanly inside left column */}
            <div className="space-y-1.5">
              {WORKFLOW_STEPS.map((step) => (
                <div
                  key={step.num}
                  className="rounded-xl border-2 border-white/15 bg-[#0a0f1d]/85 p-2 sm:p-2.5 backdrop-blur-xl shadow-xl flex items-center gap-2.5 hover:border-comic-yellow/50 transition-colors"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-ink bg-comic-yellow font-display text-xs text-ink shadow-panel-sm">
                    {step.num}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xs sm:text-sm text-comic-yellow tracking-wide leading-tight truncate">
                      {step.title}
                    </h3>
                    <p className="text-[10px] text-slate-300 font-normal leading-tight line-clamp-2">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SLIDE 4: TREATMENT PROTOCOLS & TELEMETRY (04 / 05) */}
        {/* ----------------------------------------------------------------- */}
        <div className="relative w-[20%] h-full shrink-0 flex flex-col justify-center pl-16 sm:pl-20 lg:pl-24 pr-4 pb-16 pt-16 sm:pt-20 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-[420px] lg:max-w-[440px] space-y-3 my-auto">
            {/* Left Glass Card */}
            <div className="rounded-3xl border-2 border-white/15 bg-[#0a0f1d]/85 p-5 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] sm:text-xs tracking-wider text-slate-400 font-semibold uppercase">
                  {SECTIONS_METADATA[3].tag}
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-wide text-white leading-tight">
                TREATMENT{' '}
                <span className="text-comic-yellow italic [text-shadow:0_0_24px_rgba(255,217,61,0.5)]">
                  PROTOCOLS
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Real-time telemetry and patient health updates shared with the receiving trauma hospital ahead of time. Ambulance operates with siren strobes on, navigating priority transit corridors.
              </p>

              <div className="rounded-xl border border-white/20 bg-white/5 p-3 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-comic-yellow">
                  <Activity className="h-4 w-4" />
                  <span>Continuous Vitals Stream</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Heart rate, SpO2, blood pressure & triage status live-synced to ER doctors.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => onNavigate('request')}
                  className="rounded-xl border-2 border-ink bg-comic-yellow px-3.5 py-1.5 text-xs font-bold text-ink shadow-panel-sm hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                >
                  <Ambulance className="h-3.5 w-3.5" />
                  <span>DISPATCH NOW</span>
                </button>

                <button
                  onClick={() => onNavigate('simulation')}
                  className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-all flex items-center gap-1.5 backdrop-blur-md"
                >
                  <span>BPMN Demo</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Mobile checklist HUD displayed under the card on small screens */}
            <div className="md:hidden rounded-2xl border-2 border-white/15 bg-[#0a0f1d]/85 p-3 backdrop-blur-xl shadow-xl space-y-1.5">
              <h3 className="font-display text-xs tracking-wider text-comic-yellow uppercase">
                En-Route Protocol Checklist
              </h3>
              {[
                { num: 1, text: 'Check the emergency workflow.' },
                { num: 2, text: 'Continuous patient vitals tracking.' },
                { num: 3, text: 'Continuous equipment readiness.' },
                { num: 4, text: 'Transfer protocol preparation.' },
              ].map((item) => (
                <div
                  key={item.num}
                  className="flex items-center gap-2 rounded-lg bg-white/5 p-1.5 text-[11px] text-slate-200 border border-white/5"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-comic-yellow text-ink font-display text-[10px] font-bold">
                    {item.num}
                  </span>
                  <span className="leading-tight font-medium text-slate-100">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Right Protocol Checklist HUD docked to the right edge, framing the ambulance in center-right */}
          <div className="hidden md:flex flex-col gap-2 w-[240px] lg:w-[280px] absolute right-16 lg:right-24 top-1/2 -translate-y-1/2 z-20">
            <div className="rounded-3xl border-2 border-white/15 bg-[#0a0f1d]/85 p-4 backdrop-blur-2xl shadow-2xl space-y-2">
              <h3 className="font-display text-xs sm:text-sm tracking-wider text-comic-yellow uppercase">
                En-Route Protocol Checklist
              </h3>
              {[
                { num: 1, text: 'Check the emergency workflow.' },
                { num: 2, text: 'Continuous patient vitals tracking.' },
                { num: 3, text: 'Continuous equipment readiness.' },
                { num: 4, text: 'Transfer protocol preparation.' },
              ].map((item) => (
                <div
                  key={item.num}
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2 text-xs text-slate-200 border border-white/5 hover:border-comic-yellow/40 transition-colors"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-comic-yellow text-ink font-display text-xs font-bold shadow-panel-sm">
                    {item.num}
                  </span>
                  <span className="leading-tight font-medium text-slate-100">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SLIDE 5: HOSPITAL ARRIVAL & MISSION HANDOVER (05 / 05) */}
        {/* ----------------------------------------------------------------- */}
        <div className="w-[20%] h-full shrink-0 flex flex-col justify-center pl-16 sm:pl-20 lg:pl-24 pr-4 pb-16 pt-16 sm:pt-20 overflow-y-auto no-scrollbar pointer-events-none">
          <div className="w-full max-w-[420px] lg:max-w-[440px] space-y-2.5 my-auto pointer-events-auto">
            {/* Handover Hero Card matching reference image media_1794819686574_69836512.jpg */}
            <div className="rounded-3xl border-2 border-white/15 bg-[#0a0f1d]/85 p-5 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] sm:text-xs tracking-wider text-slate-400 font-semibold uppercase">
                  {SECTIONS_METADATA[4].tag}
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-wide text-white leading-tight">
                MISSION{' '}
                <span className="text-comic-yellow italic [text-shadow:0_0_24px_rgba(255,217,61,0.5)]">
                  HANDOVER
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Safe arrival and patient handoff to emergency staff. The system prepares the vehicle for the next queue.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => onNavigate('request')}
                  className="rounded-xl border-2 border-ink bg-comic-yellow px-3.5 py-1.5 text-xs font-bold text-ink shadow-panel-sm hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                >
                  <Ambulance className="h-3.5 w-3.5" />
                  <span>DISPATCH NOW</span>
                </button>

                <button
                  onClick={() => onNavigate('simulation')}
                  className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-all flex items-center gap-1.5 backdrop-blur-md"
                >
                  <span>BPMN Demo</span>
                  <ArrowRight className="h-3 w-3" />
                </button>

                <button
                  onClick={() => onNavigate('dispatch')}
                  className="rounded-xl border border-white/15 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-white/40 transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard className="h-3 w-3" />
                  <span>Console</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 6. FIXED BOTTOM TIMELINE & CONTROL BAR (TRANSPARENT FLOATING) */}
      {/* ===================================================================== */}
      <div className="absolute bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black/80 via-black/25 to-transparent px-4 py-2.5 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs pointer-events-auto">
        {/* Left Status Badge */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-semibold text-comic-yellow flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-comic-yellow animate-pulse" />
            <span>{activeMeta.locationBadge}</span>
          </span>
        </div>

        {/* Center: 5 Interactive Stepper Pills (Slides horizontally on click) */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
          {SECTIONS_METADATA.map((sec) => {
            const isActive = currentSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setCurrentSection(sec.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                  isActive
                    ? 'bg-comic-yellow text-ink shadow-panel-sm -translate-y-0.5'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-comic-red' : 'bg-slate-500'}`} />
                <span>{sec.navLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Interactive Toggles (Sound, Strobes, Beam) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 transition-all ${
              soundEnabled
                ? 'border-comic-yellow/60 bg-comic-yellow/20 text-comic-yellow shadow-xs'
                : 'border-white/15 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
            title="Toggle siren sound simulation"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>Sound</span>
          </button>

          <button
            onClick={() => setStrobesEnabled((prev) => !prev)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 transition-all ${
              strobesEnabled
                ? 'border-red-500/60 bg-red-500/20 text-red-400 shadow-xs'
                : 'border-white/15 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
            title="Toggle flashing emergency lightbars"
          >
            <span className={`h-2 w-2 rounded-full ${strobesEnabled ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
            <span>Strobes</span>
          </button>

          <button
            onClick={() => setBeamEnabled((prev) => !prev)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 transition-all ${
              beamEnabled
                ? 'border-amber-400/60 bg-amber-400/20 text-amber-300 shadow-xs'
                : 'border-white/15 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
            title="Toggle headlights high beam"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Beam</span>
          </button>
        </div>
      </div>
    </div>
  );
}
