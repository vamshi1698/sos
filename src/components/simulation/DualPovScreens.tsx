import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Ambulance,
  ArrowRight,
  Baby,
  Battery,
  Bell,
  Car,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  Droplets,
  FileText,
  Gauge,
  HeartPulse,
  Hospital,
  Info,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Shield,
  ShieldCheck,
  Smartphone,
  Star,
  Stethoscope,
  Syringe,
  User,
  Wifi,
  XCircle,
  Zap,
} from 'lucide-react';
import type { Ambulance as AmbulanceType, AmbulanceRequest } from '@/types';

interface DualPovScreensProps {
  request: AmbulanceRequest | undefined;
  assignedAmbulance: AmbulanceType | undefined;
  currentSimStep: number;
  selectedServiceId?: string;
  onSelectServiceId?: (serviceId: string) => void;
  onAdvanceStage?: () => void;
  onOperatorDecline?: () => void;
  onOperatorAccept?: () => void;
  onResetSimulation?: () => void;
}

const EMERGENCY_PRESETS = [
  { id: 'accident', label: 'Accident / Trauma', icon: Car, color: 'text-comic-red' },
  { id: 'child', label: 'Child Emergency', icon: Baby, color: 'text-purple-600' },
  { id: 'cardiac', label: 'Cardiac / Heart', icon: HeartPulse, color: 'text-red-500' },
  { id: 'maternity', label: 'Maternity / Labor', icon: Baby, color: 'text-pink-600' },
  { id: 'stroke', label: 'Stroke / Neuro', icon: Zap, color: 'text-amber-500' },
];

export default function DualPovScreens({
  request,
  assignedAmbulance,
  currentSimStep,
  selectedServiceId,
  onSelectServiceId,
  onAdvanceStage,
  onOperatorDecline,
  onOperatorAccept,
  onResetSimulation,
}: DualPovScreensProps) {
  const [patientRating, setPatientRating] = useState<number>(5);

  const amb = assignedAmbulance || {
    registration: 'KA-03-DEMO-202',
    operator: 'CityMed Transport',
    category: 'ALS',
    area: 'Koramangala',
    speed: 48,
  };

  const hosp = request?.hospital || {
    name: 'Manipal Hospital (Old Airport Rd)',
    area: 'Indiranagar',
    traumaLevel: 'Level 1 Trauma & Cardiac Emergency',
    phone: '+91 80 2502 4444',
  };

  const pickupLocation =
    request?.pickupAddress ||
    request?.pickupArea ||
    'Indiranagar - 100ft Road, opposite Metro Pillar 142';

  const patientName = request?.patientName || 'Deepak Kumar';
  const serviceType = request?.serviceType || 'Road Accident / Trauma';
  const careCategory = request?.category || 'ALS';
  const requestId = request?.id || 'RR-MW8J92K8';

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 items-start">
      {/* =================================================================== */}
      {/* 1. PATIENT MOBILE APP POV */}
      {/* =================================================================== */}
      <div className="rounded-xl border-3 border-ink bg-white p-3.5 shadow-panel space-y-2.5">
        <div className="flex items-center justify-between border-b-2 border-ink pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-white font-display text-[11px]">
              POV 1
            </span>
            <span className="font-display text-base tracking-wide text-blue-900">
              Patient Mobile App Screen
            </span>
          </div>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
            {currentSimStep === 1
              ? 'Emergency Crisis & SOS'
              : currentSimStep === 2
              ? 'Detecting Live GPS'
              : currentSimStep === 3
              ? 'Sending SOS Alert'
              : currentSimStep <= 5
              ? 'Finding Nearest Ambulance'
              : currentSimStep <= 7
              ? 'Ambulance Confirmed'
              : currentSimStep === 8
              ? 'Tracking Ambulance Live'
              : currentSimStep === 9
              ? 'Ambulance Arrived'
              : currentSimStep === 10
              ? 'Driving to Hospital'
              : 'Trip Complete & Rating'}
          </span>
        </div>

        {/* Mobile Device Mockup */}
        <div className="mx-auto max-w-[320px] rounded-[28px] border-4 border-ink bg-slate-900 p-2.5 shadow-panel-sm">
          <div className="min-h-[420px] rounded-[18px] bg-slate-50 p-3 text-ink flex flex-col justify-between overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 border-b pb-1.5">
              <span className="flex items-center gap-1 text-slate-800 font-bold">
                <Smartphone className="h-3 w-3 text-blue-600" /> Pranrath SOS
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-slate-600 text-[9px] font-mono">
                  <Wifi className="h-2.5 w-2.5 text-emerald-600" /> 5G
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-mono text-[9px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {currentSimStep >= 2 ? 'GPS LOCKED' : 'CALIBRATING'}
                </span>
              </div>
            </div>

            {/* Step 1: Emergency Happens & Opening App with Rich Intake */}
            {currentSimStep === 1 && (
              <div className="my-auto space-y-2">
                {/* Emergency Crisis Alert Pill */}
                <div className="rounded-lg bg-red-600 text-white px-2 py-1 text-center font-display text-[11px] tracking-wide animate-pulse flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-comic-yellow" />
                  CRITICAL MEDICAL CRISIS DETECTED
                </div>

                {/* Patient Profile Quick Card */}
                <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-xs text-[11px]">
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-blue-600" /> {patientName} (52y)
                    </span>
                    <span className="rounded bg-rose-100 text-rose-700 px-1.5 py-0.2 text-[9px] font-black">
                      BLOOD: B+
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 flex justify-between">
                    <span>Emergency Contact: +91 98450 11223</span>
                    <span className="text-emerald-700 font-semibold">Auto-Sync ON</span>
                  </div>
                </div>

                {/* Emergency Scenario Selector Chips - FULLY CLICKABLE */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span>Select Emergency Type:</span>
                    <span className="text-[9px] text-blue-600 font-semibold">(Click to switch)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {EMERGENCY_PRESETS.slice(0, 4).map((preset) => {
                      const Icon = preset.icon;
                      const isSelected = (selectedServiceId || 'accident') === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onSelectServiceId?.(preset.id)}
                          className={`rounded p-1 text-[10px] font-bold flex items-center gap-1 transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'border-2 border-comic-red bg-rose-50 text-comic-red shadow-xs font-black scale-[1.02]'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`h-3 w-3 shrink-0 ${isSelected ? 'text-comic-red' : preset.color}`} />
                          <span className="truncate">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1-Tap Big SOS Button - CLICKABLE */}
                <div className="rounded-xl border-2 border-red-500 bg-red-50 p-2 text-center space-y-1">
                  <button
                    type="button"
                    onClick={onAdvanceStage}
                    className="w-full rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white font-display text-sm py-2 shadow-panel-sm tracking-wide flex items-center justify-center gap-1.5 animate-pulse cursor-pointer transition-transform"
                  >
                    <AlertTriangle className="h-4 w-4 text-comic-yellow" />
                    TAP TO SEND INSTANT SOS
                  </button>
                  <p className="text-[9px] text-slate-500">
                    Transmits satellite GPS coordinates & medical ID instantly to 108 / Central Control.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Live GPS Location Detected */}
            {currentSimStep === 2 && (
              <div className="my-auto space-y-2">
                <div className="rounded-lg bg-emerald-600 text-white px-2 py-1 text-center font-display text-[11px] tracking-wide flex items-center justify-center gap-1">
                  <Crosshair className="h-3.5 w-3.5 text-white" />
                  SATELLITE GPS ACCURACY LOCKED (±2.4m)
                </div>

                <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-[9px] font-bold text-emerald-900 uppercase">Auto-Detected Pickup Pin</p>
                      <p className="font-display text-xs text-ink truncate">{pickupLocation}</p>
                    </div>
                  </div>

                  <div className="border-t border-emerald-200 pt-1 grid grid-cols-2 gap-0.5 text-[9px] text-emerald-800">
                    <div>Lat: <strong>12.9352° N</strong></div>
                    <div>Lon: <strong>77.6245° E</strong></div>
                    <div>Satellites: <strong>14 Linked</strong></div>
                    <div>Fix: <strong>RTK High-Precision</strong></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-display text-xs py-2 shadow-panel-sm tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-transform"
                >
                  <Radio className="h-3.5 w-3.5" />
                  CONFIRM LOCATION & BROADCAST SOS →
                </button>
              </div>
            )}

            {/* Step 3: Emergency Type Selected & SOS Sent */}
            {currentSimStep === 3 && (
              <div className="my-auto space-y-2">
                <div className="rounded-lg bg-red-600 text-white px-2 py-1 text-center font-display text-[11px] tracking-wide animate-pulse flex items-center justify-center gap-1">
                  <Radio className="h-3.5 w-3.5 text-comic-yellow animate-ping" />
                  EMERGENCY SOS TRANSMITTED LIVE
                </div>

                <div className="rounded-xl border-2 border-red-400 bg-red-50 p-2 text-[10px] space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-red-900">Incident Code: {requestId}</span>
                    <span className="rounded bg-red-600 text-white px-1.5 py-0.2 text-[9px] font-bold">
                      {careCategory} TIER
                    </span>
                  </div>
                  <p className="text-slate-700">Patient: <strong>{patientName}</strong> (52 yrs)</p>
                  <p className="text-slate-700">Condition: <strong>{serviceType}</strong></p>
                  <p className="text-[10px] text-red-800 font-semibold truncate">📍 {pickupLocation}</p>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white font-display text-xs py-2 shadow-panel-sm tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-transform"
                >
                  <Radio className="h-3.5 w-3.5" />
                  BROADCAST TO BANGALORE 108 DISPATCH →
                </button>
              </div>
            )}

            {/* Step 4: Central Control Room Received the SOS */}
            {currentSimStep === 4 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs animate-bounce">
                  <Radio className="h-5 w-5" />
                </div>
                <p className="font-display text-base text-blue-950">Central Dispatch Connected</p>
                <p className="text-[10px] text-slate-600">
                  Call & telemetry received by Central Controller.
                </p>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-[10px] text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Incident Ref:</span>
                    <span className="font-mono font-bold text-blue-900">{requestId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Triage Priority:</span>
                    <span className="font-bold text-rose-700">Level 1 (Immediate Dispatch)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dispatcher:</span>
                    <span className="font-semibold text-slate-800">Operator Rajesh V. (Active)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-display text-xs py-1.5 shadow-sm tracking-wide flex items-center justify-center gap-1 cursor-pointer transition-transform"
                >
                  <Clock className="h-3.5 w-3.5" />
                  SCAN NEARBY FLEET AMBULANCES →
                </button>
              </div>
            )}

            {/* Step 5: Scanning fleet ambulances */}
            {currentSimStep === 5 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white animate-spin">
                  <Clock className="h-5 w-5" />
                </div>
                <p className="font-display text-base text-amber-950">Scanning 30 Fleet Ambulances</p>
                <p className="text-[10px] text-slate-600">
                  AI matching calculates closest vehicle by traffic, distance, and life-support tier.
                </p>

                <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10px] text-left space-y-1">
                  <div className="flex justify-between font-bold text-amber-900">
                    <span>Rank #1 Candidate:</span>
                    <span>{amb.registration}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Estimated Distance:</span>
                    <span>~{request?.distanceKm ?? 1.4} km away</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Estimated Transit:</span>
                    <span className="font-bold text-emerald-700">~{request?.etaMinutes ?? 3} mins</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-amber-500 hover:bg-amber-600 active:scale-95 text-ink font-display text-xs py-1.5 shadow-sm tracking-wide flex items-center justify-center gap-1 cursor-pointer transition-transform font-bold"
                >
                  <Ambulance className="h-3.5 w-3.5 text-comic-red" />
                  CONFIRM ALLOCATION TO {amb.registration} →
                </button>
              </div>
            )}

            {/* Steps 6 & 7: Ambulance Confirmed & Driver Alerted */}
            {(currentSimStep === 6 || currentSimStep === 7) && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs animate-bounce">
                  <Ambulance className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base text-emerald-950">Ambulance Confirmed!</p>
                  <p className="text-[10px] text-slate-600">
                    Unit <strong>{amb.registration}</strong> has been allocated to your emergency.
                  </p>
                </div>
                <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-2 text-[10px] text-left space-y-0.5">
                  <div className="flex justify-between font-bold text-emerald-950">
                    <span>Vehicle: {amb.registration}</span>
                    <span className="rounded bg-emerald-200 px-1 text-emerald-900">{amb.category}</span>
                  </div>
                  <p className="text-slate-700">Operator: <strong>{amb.operator}</strong></p>
                  <p className="text-slate-700">Crew Base: <strong>{amb.area} Sector</strong></p>
                  <p className="text-emerald-800 font-bold">Estimated Arrival: ~{request?.etaMinutes ?? 3} mins</p>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-display text-xs py-1.5 shadow-sm tracking-wide flex items-center justify-center gap-1 cursor-pointer transition-transform"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  TRACK AMBULANCE ROUTE LIVE →
                </button>
              </div>
            )}

            {/* Step 8: Live GPS Navigation to Patient */}
            {currentSimStep === 8 && (
              <div className="my-auto space-y-2">
                <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-2 shadow-xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase animate-pulse">
                      AMBULANCE ON THE WAY
                    </span>
                    <span className="font-bold text-emerald-800">
                      ETA: ~{request?.etaMinutes ?? 3} mins
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                      <Ambulance className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-display text-xs text-ink">{amb.registration}</p>
                      <p className="text-[9px] text-slate-600">{amb.operator} • {amb.category}</p>
                    </div>
                  </div>

                  <div className="mt-1 border-t border-emerald-200 pt-1 flex justify-between text-[10px] text-slate-700">
                    <span>Distance: <strong>{request?.distanceKm ?? 1.4} km</strong></span>
                    <span>Speed: <strong>{amb.speed ?? 48} km/h</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => alert(`Dialing Ambulance Crew (${amb.registration}) at +91 98450 11223...`)}
                    className="flex-1 rounded bg-ink hover:bg-slate-800 active:scale-95 py-1.5 text-[10px] font-bold text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Phone className="h-3 w-3 text-emerald-400" /> Call Crew
                  </button>
                  <button
                    type="button"
                    onClick={onAdvanceStage}
                    className="flex-1 rounded bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-1.5 text-[10px] font-bold text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Next: Arrive →
                  </button>
                </div>
              </div>
            )}

            {/* Step 9: Ambulance Arrived on Scene */}
            {currentSimStep === 9 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-display text-base text-emerald-900">Ambulance Arrived!</p>
                <p className="text-[10px] text-slate-600">
                  {amb.registration} has arrived outside. Paramedics are at your door.
                </p>
                <div className="rounded bg-emerald-50 border border-emerald-300 p-1.5 text-[10px] font-bold text-emerald-800">
                  ✓ Paramedic triage check & stretcher loading in progress
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-display text-xs py-1.5 shadow-sm tracking-wide flex items-center justify-center gap-1 cursor-pointer transition-transform"
                >
                  CONFIRM BOARDED → COMMENCE HOSPITAL RUN →
                </button>
              </div>
            )}

            {/* Step 10: Rushing to Hospital */}
            {currentSimStep === 10 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white animate-pulse">
                  <Hospital className="h-5 w-5" />
                </div>
                <p className="font-display text-base text-rose-950">Rushing to Emergency Hospital</p>
                <p className="text-[10px] text-slate-600">
                  Patient safely onboard with paramedic care en route to {hosp.name}.
                </p>
                <div className="rounded bg-rose-50 p-1.5 text-[10px] font-bold text-rose-900 border border-rose-200">
                  Pre-alert & live vitals transmitted to Emergency Room
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-display text-xs py-1.5 shadow-sm tracking-wide flex items-center justify-center gap-1 cursor-pointer transition-transform"
                >
                  DELIVER TO HOSPITAL TRAUMA BAY →
                </button>
              </div>
            )}

            {/* Step 11: Trip Complete & Rating */}
            {currentSimStep >= 11 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-5 w-5 stroke-[3]" />
                </div>
                <p className="font-display text-base text-ink">Trip Completed Safely</p>
                <p className="text-[10px] text-slate-600">
                  Delivered to <strong>{hosp.name}</strong>.
                </p>

                <div className="rounded-lg border border-slate-200 bg-white p-2 space-y-1">
                  <p className="text-[10px] font-bold text-ink">How was our emergency response?</p>
                  <div className="flex justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setPatientRating(star)}
                        className="text-amber-400 p-0.5 cursor-pointer hover:scale-125 transition-transform"
                      >
                        <Star className={`h-4 w-4 ${star <= patientRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <div className="rounded bg-emerald-100 p-1 text-[9px] font-bold text-emerald-800">
                    5★ Review Submitted - Patient in Safe Hands
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onResetSimulation || onAdvanceStage}
                  className="w-full rounded bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-display text-xs py-1.5 shadow-sm tracking-wide flex items-center justify-center gap-1 cursor-pointer transition-transform"
                >
                  START NEW EMERGENCY SIMULATION ↺
                </button>
              </div>
            )}

            {/* Phone Footer */}
            <div className="border-t pt-1 text-center text-[9px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Encrypted Medical Dispatch Channel</span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. AMBULANCE OPERATOR IN-CAB TERMINAL POV */}
      {/* =================================================================== */}
      <div className="rounded-xl border-3 border-ink bg-white p-3.5 shadow-panel space-y-2.5">
        <div className="flex items-center justify-between border-b-2 border-ink pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600 text-white font-display text-[11px]">
              POV 2
            </span>
            <span className="font-display text-base tracking-wide text-emerald-900">
              Ambulance Driver In-Cab Screen
            </span>
          </div>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            {amb.registration} ({amb.category})
          </span>
        </div>

        {/* In-Cab Terminal Mockup */}
        <div className="mx-auto max-w-[320px] rounded-[28px] border-4 border-ink bg-emerald-950 p-2.5 shadow-panel-sm">
          <div className="min-h-[420px] rounded-[18px] bg-slate-900 p-3 text-white flex flex-col justify-between overflow-hidden">
            {/* Cab Status Bar */}
            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300 border-b border-emerald-800/60 pb-1.5">
              <span className="flex items-center gap-1">
                <Navigation className="h-3 w-3 text-emerald-400" /> MDT TERMINAL
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {currentSimStep === 1
                  ? 'SHIFT READY'
                  : currentSimStep === 2
                  ? 'BASE STANDBY'
                  : currentSimStep === 3
                  ? 'CAD ALERT'
                  : currentSimStep <= 5
                  ? 'SCAN MATCH'
                  : currentSimStep <= 7
                  ? 'CALL RINGING'
                  : currentSimStep === 8
                  ? 'EN ROUTE'
                  : currentSimStep === 9
                  ? 'AT SCENE'
                  : currentSimStep === 10
                  ? 'TO HOSPITAL'
                  : 'READY FOR CALL'}
              </span>
            </div>

            {/* Step 1: In-Cab Diagnostics & Shift Readiness */}
            {currentSimStep === 1 && (
              <div className="my-auto space-y-2">
                <div className="rounded bg-emerald-900/60 border border-emerald-500/80 px-2 py-1 text-center font-display text-[11px] text-comic-yellow flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  CREW SHIFT ACTIVE • FULL READINESS
                </div>

                {/* Crew Details */}
                <div className="rounded border border-emerald-800 bg-black/50 p-2 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Driver / EVOC:</span>
                    <span className="font-bold text-white">Ramesh Kumar (Grade 1)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paramedic EMT:</span>
                    <span className="font-bold text-emerald-400">Priya Nair (ALS Certified)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Radio Channel:</span>
                    <span className="font-mono text-comic-yellow">VHF 154.250 MHz (Ch 4)</span>
                  </div>
                </div>

                {/* Vehicle Diagnostics Checklist */}
                <div className="rounded border border-slate-700 bg-black/40 p-1.5 text-[9px] space-y-0.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">O₂ Cylinder Tank:</span>
                    <span className="text-emerald-400 font-bold">2,200 PSI (Full)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Defibrillator Battery:</span>
                    <span className="text-emerald-400 font-bold">100% (Passed)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stretcher & Suction:</span>
                    <span className="text-emerald-400 font-bold">Hydraulic Locked</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fuel & Tire Pressure:</span>
                    <span className="text-comic-yellow font-bold">92% • 36 PSI Normal</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-black font-display text-xs py-1.5 shadow-md tracking-wider cursor-pointer transition-transform"
                >
                  CONFIRM VEHICLE READY & ON STANDBY →
                </button>
              </div>
            )}

            {/* Step 2: Base Standby & GPS Beacon Active */}
            {currentSimStep === 2 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900/60 border border-emerald-500 text-emerald-400">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <p className="font-display text-base text-comic-yellow">GPS Beacon Active & Calibrated</p>
                  <p className="text-[10px] text-slate-300">
                    Stationed at {amb.area} Base • Transmitting 1-sec heartbeat
                  </p>
                </div>

                <div className="rounded border border-slate-700 bg-black/50 p-2 text-left text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Corridor Sector:</span>
                    <span className="text-white font-bold">{amb.area} Hub</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Speed:</span>
                    <span className="text-emerald-400 font-mono">0 km/h (Idling at Bay)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CAD Connection:</span>
                    <span className="text-emerald-400 font-bold">100% Ping Responsive</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-display text-xs py-1.5 shadow-md tracking-wider cursor-pointer transition-transform"
                >
                  AWAIT CAD SECTOR BROADCAST →
                </button>
              </div>
            )}

            {/* Step 3: Sector Emergency Alert Broadcast Detected */}
            {currentSimStep === 3 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 animate-pulse">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base text-amber-300">Sector SOS Detected</p>
                  <p className="text-[10px] text-slate-300">
                    Control Room computing fleet vector for {pickupLocation}.
                  </p>
                </div>

                <div className="rounded border border-amber-600/50 bg-black/60 p-2 text-left text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Incident Category:</span>
                    <span className="text-comic-yellow font-bold">{careCategory} Emergency</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reported Condition:</span>
                    <span className="text-white truncate max-w-[150px]">{serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sector Status:</span>
                    <span className="text-amber-400 font-bold">Candidate Unit Standby</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-display text-xs py-1.5 shadow-md tracking-wider cursor-pointer transition-transform font-bold"
                >
                  CALCULATE FASTEST FLEET ROUTE →
                </button>
              </div>
            )}

            {/* Steps 4 & 5: CAD Evaluation & Match Locking */}
            {(currentSimStep === 4 || currentSimStep === 5) && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 border-2 border-sky-400 text-sky-400 animate-spin">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base text-sky-300">CAD Matching Lock: Rank #1</p>
                  <p className="text-[10px] text-slate-300">
                    Unit selected as optimal first responder vehicle.
                  </p>
                </div>

                <div className="rounded border border-sky-700/60 bg-black/60 p-2 text-left text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Distance to Pickup:</span>
                    <span className="text-comic-yellow font-bold">~{request?.distanceKm ?? 1.4} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Projected Drive Time:</span>
                    <span className="text-emerald-400 font-bold">~{request?.etaMinutes ?? 3} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tier Validation:</span>
                    <span className="text-emerald-400 font-bold">{amb.category} Equipment Verified</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-sky-500 hover:bg-sky-400 active:scale-95 text-black font-display text-xs py-1.5 shadow-md tracking-wider cursor-pointer transition-transform font-bold"
                >
                  ARM IN-CAB SIREN & MDT ALARM →
                </button>
              </div>
            )}

            {/* Steps 6 & 7: Incoming Alert Ringing & Driver Action */}
            {(currentSimStep === 6 || currentSimStep === 7) && (
              <div className="my-auto space-y-2 rounded-xl border-2 border-amber-400 bg-amber-950/90 p-2 text-center shadow-lg animate-wiggle">
                <Bell className="mx-auto h-6 w-6 text-amber-400 animate-bounce" />
                <p className="font-display text-base text-comic-yellow">EMERGENCY CALL ALERT</p>
                <div className="rounded bg-black/60 p-2 text-left text-[10px] space-y-0.5">
                  <p><strong>Pickup:</strong> {pickupLocation}</p>
                  <p><strong>Emergency:</strong> {serviceType} ({careCategory})</p>
                  <p><strong>Patient:</strong> {patientName} (52y)</p>
                  <p><strong>Distance:</strong> {request?.distanceKm ?? 1.4} km (Est: {request?.etaMinutes ?? 3}m)</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onOperatorAccept}
                    className="flex-1 rounded bg-emerald-500 py-1.5 font-display text-xs tracking-wider text-black shadow-md hover:bg-emerald-400 active:scale-95 cursor-pointer"
                  >
                    ✓ ACCEPT CALL
                  </button>
                  <button
                    type="button"
                    onClick={onOperatorDecline}
                    className="flex-1 rounded bg-red-600 py-1.5 font-display text-xs tracking-wider text-white shadow-md hover:bg-red-500 active:scale-95 cursor-pointer"
                  >
                    ✕ DECLINE
                  </button>
                </div>
              </div>
            )}

            {/* Step 8: Driving to Patient */}
            {currentSimStep === 8 && (
              <div className="my-auto space-y-2">
                <div className="rounded border border-sky-500 bg-black/60 p-2">
                  <p className="text-[9px] font-bold text-sky-400 flex items-center gap-1">
                    <Navigation className="h-3 w-3" /> TURN-BY-TURN GPS NAVIGATION
                  </p>
                  <p className="mt-0.5 font-display text-xs text-white truncate">{pickupLocation}</p>
                  <p className="text-[9px] text-slate-300">Turn right in 200m onto 80ft Road</p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-center text-xs">
                  <div className="rounded bg-black/40 p-1.5 border border-slate-700">
                    <p className="text-slate-400 text-[9px]">Live Speed</p>
                    <p className="font-display text-base text-emerald-400">{amb.speed ?? 48} km/h</p>
                  </div>
                  <div className="rounded bg-black/40 p-1.5 border border-slate-700">
                    <p className="text-slate-400 text-[9px]">Distance</p>
                    <p className="font-display text-base text-comic-yellow">{request?.distanceKm ?? 1.4} km</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-sky-500 py-1.5 font-display text-xs text-black shadow-md hover:bg-sky-400 active:scale-95 cursor-pointer transition-transform"
                >
                  MARK ARRIVED AT PATIENT →
                </button>
              </div>
            )}

            {/* Step 9: At Scene & Patient Stretcher Boarding */}
            {currentSimStep === 9 && (
              <div className="my-auto space-y-2">
                <div className="rounded border border-emerald-500 bg-emerald-950/60 p-2 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
                  <p className="mt-0.5 font-display text-sm text-white">Arrived at Patient</p>
                  <p className="text-[9px] text-emerald-200">Paramedics stabilizing & loading stretcher.</p>
                </div>

                <div className="rounded border border-slate-700 bg-black/60 p-1.5 text-[9px] space-y-0.5 text-slate-300">
                  <p className="text-emerald-400 font-bold">✓ Cervical collar applied</p>
                  <p className="text-emerald-400 font-bold">✓ Vitals logged: HR 108, BP 128/84</p>
                  <p className="text-white">✓ Hydraulic stretcher locked into vehicle bay</p>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-emerald-500 py-1.5 font-display text-xs text-black shadow-md hover:bg-emerald-400 active:scale-95 cursor-pointer transition-transform"
                >
                  PATIENT BOARDED → TO HOSPITAL →
                </button>
              </div>
            )}

            {/* Step 10: Driving to Trauma Center */}
            {currentSimStep === 10 && (
              <div className="my-auto space-y-2">
                <div className="rounded border border-rose-500 bg-black/60 p-2">
                  <p className="text-[9px] font-bold text-rose-400 flex items-center gap-1">
                    <Hospital className="h-3 w-3" /> SIRENS ON → TO TRAUMA HOSPITAL
                  </p>
                  <p className="mt-0.5 font-display text-xs text-white truncate">{hosp.name}</p>
                  <p className="text-[9px] text-slate-300">Level 1 Emergency Trauma Ward (Bay 2)</p>
                </div>

                <div className="rounded border border-rose-800/80 bg-rose-950/40 p-1.5 text-[9px] space-y-0.5 text-slate-300">
                  <p className="text-emerald-400 font-bold">⚡ Emergency Green Corridor Active</p>
                  <p className="text-slate-300">ETA to Hospital: ~4 mins (Speed: 52 km/h)</p>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-rose-600 py-1.5 font-display text-xs text-white shadow-md hover:bg-rose-500 active:scale-95 cursor-pointer transition-transform"
                >
                  DELIVERED TO EMERGENCY ROOM →
                </button>
              </div>
            )}

            {/* Step 11: Handover Done & Available */}
            {currentSimStep >= 11 && (
              <div className="my-auto space-y-2">
                <div className="rounded border border-emerald-500 bg-black/60 p-2 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
                  <p className="mt-0.5 font-display text-sm text-white truncate">Hospital Handover Complete</p>
                  <p className="text-[9px] text-slate-300">Doctors have assumed care of patient.</p>
                </div>

                <div className="rounded border border-slate-700 bg-black/50 p-1.5 text-[9px] space-y-0.5 text-slate-300">
                  <p className="text-emerald-400 font-bold">✓ Paramedic clinical transfer report signed</p>
                  <p className="text-emerald-400 font-bold">✓ Vehicle bay sanitized & restocked</p>
                </div>

                <button
                  type="button"
                  onClick={onResetSimulation || onAdvanceStage}
                  className="w-full rounded bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-display text-xs py-1.5 shadow-md tracking-wider cursor-pointer transition-transform font-bold"
                >
                  ✓ READY FOR NEXT CALL (RESET) ↺
                </button>
              </div>
            )}

            {/* In-Cab Footer */}
            <div className="border-t border-emerald-800/60 pt-1 text-center text-[9px] text-emerald-400">
              Pranrath In-Cab MDT Navigation
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. HOSPITAL ER RECEIVING SCREEN POV */}
      {/* =================================================================== */}
      <div className="rounded-xl border-3 border-ink bg-white p-3.5 shadow-panel space-y-2.5">
        <div className="flex items-center justify-between border-b-2 border-ink pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-600 text-white font-display text-[11px]">
              POV 3
            </span>
            <span className="font-display text-base tracking-wide text-rose-950">
              Hospital ER Receiving Screen
            </span>
          </div>
          <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900 truncate max-w-[150px]">
            {hosp.name}
          </span>
        </div>

        {/* Hospital Terminal Mockup */}
        <div className="mx-auto max-w-[320px] rounded-[28px] border-4 border-ink bg-rose-950 p-2.5 shadow-panel-sm">
          <div className="min-h-[420px] rounded-[18px] bg-slate-900 p-3 text-white flex flex-col justify-between overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between text-[10px] font-bold text-rose-300 border-b border-rose-800/60 pb-1.5">
              <span className="flex items-center gap-1">
                <Hospital className="h-3 w-3 text-rose-400" /> ER RECEIVING BAY
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-mono text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                {currentSimStep >= 8 ? 'TELEMETRY LIVE' : 'BAY READY'}
              </span>
            </div>

            {/* Step 1: Hospital ER Readiness Dashboard */}
            {currentSimStep === 1 && (
              <div className="my-auto space-y-2">
                <div className="rounded bg-rose-900/60 border border-rose-600/80 px-2 py-1 text-center font-display text-[11px] text-rose-200 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
                  TRAUMA RESUS BAY 2 • ON STANDBY
                </div>

                {/* Duty Doctors & Staff */}
                <div className="rounded border border-rose-800/80 bg-black/50 p-2 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chief Trauma Surgeon:</span>
                    <span className="font-bold text-white">Dr. Ananya Rao, MD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Triage Nurse In-Charge:</span>
                    <span className="font-bold text-rose-300">Sister Deepa S. (CEN)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Facility Level:</span>
                    <span className="font-bold text-comic-yellow">Level 1 Emergency Center</span>
                  </div>
                </div>

                {/* Hospital Critical Capacity & Supplies */}
                <div className="rounded border border-slate-700 bg-black/40 p-1.5 text-[9px] space-y-0.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trauma Bay Bed 2:</span>
                    <span className="text-emerald-400 font-bold">READY & STERILE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ICU Beds Free:</span>
                    <span className="text-emerald-400 font-bold">4 / 12 Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Blood Bank Reserve:</span>
                    <span className="text-rose-400 font-bold">O-ve: 6u | O+ve: 14u</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Crash Cart & Defib:</span>
                    <span className="text-emerald-400 font-bold">ARMED (08:00 AM)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-rose-700 hover:bg-rose-600 active:scale-95 text-white font-display text-[10px] py-1.5 shadow-sm tracking-wider cursor-pointer transition-transform"
                >
                  CONFIRM RESUS BAY 2 READY & STERILE →
                </button>
              </div>
            )}

            {/* Step 2: City EMS Grid Connection & Radar Standby */}
            {currentSimStep === 2 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-900/60 border border-rose-600 text-rose-400">
                  <Hospital className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base text-rose-200">EMS Grid Connected</p>
                  <p className="text-[10px] text-slate-300">
                    Monitoring emergency requests in Bangalore East corridor
                  </p>
                </div>

                <div className="rounded border border-slate-700 bg-black/50 p-2 text-left text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hospital Diversion:</span>
                    <span className="text-emerald-400 font-bold">OPEN (No diversion)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ambulances Monitored:</span>
                    <span className="text-white font-mono">8 Fleet Units in 5km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cath Lab & CT:</span>
                    <span className="text-emerald-400 font-bold">Ready on 5m Call</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-rose-800 hover:bg-rose-700 active:scale-95 text-rose-100 font-display text-[10px] py-1.5 shadow-sm tracking-wider cursor-pointer transition-transform"
                >
                  SYNC EMS GRID TELEMETRY →
                </button>
              </div>
            )}

            {/* Step 3: Central SOS Signal Logged in Network */}
            {currentSimStep === 3 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 animate-pulse">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base text-amber-300">City SOS Logged in Sector</p>
                  <p className="text-[10px] text-slate-300">
                    Central Dispatch processing request from {pickupLocation}.
                  </p>
                </div>

                <div className="rounded border border-amber-600/50 bg-black/60 p-2 text-left text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emergency Type:</span>
                    <span className="text-comic-yellow font-bold">{serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Anticipated Care:</span>
                    <span className="text-rose-400 font-bold">{careCategory} (Priority 1)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Designated Facility:</span>
                    <span className="text-white font-bold truncate max-w-[140px]">{hosp.name}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-display text-[10px] py-1.5 shadow-sm tracking-wider cursor-pointer transition-transform font-bold"
                >
                  PRE-ALLOCATE TRAUMA BAY 2 →
                </button>
              </div>
            )}

            {/* Steps 4 & 5: CAD Destination Designation */}
            {(currentSimStep === 4 || currentSimStep === 5) && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 border-2 border-rose-400 text-rose-400 animate-spin">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base text-rose-200">CAD Trauma Designation</p>
                  <p className="text-[10px] text-slate-300">
                    Primary Tertiary Trauma Hospital assigned for incoming case.
                  </p>
                </div>

                <div className="rounded border border-rose-800 bg-black/60 p-2 text-left text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Receiving Bay:</span>
                    <span className="text-emerald-400 font-bold">Trauma Resus Bay 2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Unit:</span>
                    <span className="text-comic-yellow font-bold">{amb.registration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Triage Alert:</span>
                    <span className="text-rose-400 font-bold">Trauma Team Alpha Standby</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-rose-700 hover:bg-rose-600 active:scale-95 text-white font-display text-[10px] py-1.5 shadow-sm tracking-wider cursor-pointer transition-transform"
                >
                  ALERT TRAUMA TEAM ALPHA ON DUTY →
                </button>
              </div>
            )}

            {/* Steps 6 & 7: Dispatch Pre-Alert Ringing */}
            {(currentSimStep === 6 || currentSimStep === 7) && (
              <div className="my-auto space-y-2 rounded-xl border-2 border-amber-400 bg-amber-950/90 p-2 text-center shadow-lg animate-wiggle">
                <Bell className="mx-auto h-6 w-6 text-amber-400 animate-bounce" />
                <p className="font-display text-base text-comic-yellow">INCOMING PRE-ALERT</p>
                <div className="rounded bg-black/60 p-2 text-left text-[10px] space-y-0.5">
                  <p><strong>Patient:</strong> {patientName} (52y, B+)</p>
                  <p><strong>Severity:</strong> {careCategory} ({serviceType})</p>
                  <p><strong>Incoming Unit:</strong> {amb.registration}</p>
                  <p><strong>Expected Arrival:</strong> ~10-12 mins</p>
                </div>
                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-display text-xs py-1.5 shadow-md tracking-wider cursor-pointer transition-transform font-bold"
                >
                  ✓ LOCK TRAUMA BAY 2 & AWAIT ARRIVAL →
                </button>
              </div>
            )}

            {/* Step 8: Live Telemetry Stream Inbound */}
            {currentSimStep === 8 && (
              <div className="my-auto space-y-2">
                <div className="rounded border border-sky-500 bg-black/60 p-2 text-[10px]">
                  <div className="flex items-center justify-between text-sky-400 font-bold">
                    <span className="flex items-center gap-1">
                      <HeartPulse className="h-3.5 w-3.5 text-rose-500 animate-pulse" /> LIVE VITALS STREAM
                    </span>
                    <span className="font-mono text-comic-yellow">ETA ~4m</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1 text-center">
                    <div className="rounded bg-slate-800 p-1">
                      <span className="text-[9px] text-slate-400">Heart Rate</span>
                      <p className="font-mono font-bold text-emerald-400">108 BPM</p>
                    </div>
                    <div className="rounded bg-slate-800 p-1">
                      <span className="text-[9px] text-slate-400">SpO2 (Oxygen)</span>
                      <p className="font-mono font-bold text-sky-400">94% O₂</p>
                    </div>
                    <div className="rounded bg-slate-800 p-1">
                      <span className="text-[9px] text-slate-400">Blood Pressure</span>
                      <p className="font-mono font-bold text-comic-yellow">128/84</p>
                    </div>
                    <div className="rounded bg-slate-800 p-1">
                      <span className="text-[9px] text-slate-400">GCS Score</span>
                      <p className="font-mono font-bold text-emerald-400">14 / 15</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-display text-xs py-1.5 shadow-md tracking-wider cursor-pointer transition-transform"
                >
                  CONFIRM LIVE VITALS STREAM SYNCED →
                </button>
              </div>
            )}

            {/* Step 9: Ambulance at Hospital Bay */}
            {currentSimStep === 9 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 animate-pulse">
                  <Ambulance className="h-5 w-5" />
                </div>
                <p className="font-display text-base text-comic-yellow">Ambulance Pulling In</p>
                <p className="text-[10px] text-slate-300">
                  {amb.registration} arrived at Bay 2 triage gate. Gurney team on approach.
                </p>
                <div className="rounded bg-emerald-950 border border-emerald-500 p-1 text-[9px] font-bold text-emerald-400">
                  Paramedics at Bay Door • Trauma Gurney Ready
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-display text-xs py-1.5 shadow-md tracking-wider cursor-pointer transition-transform font-bold"
                >
                  OPEN AIRLOCK DOORS FOR GURNEY →
                </button>
              </div>
            )}

            {/* Step 10: Clinical Handover in Progress */}
            {currentSimStep === 10 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400">
                  <Activity className="h-5 w-5" />
                </div>
                <p className="font-display text-base text-rose-300">Clinical Handover</p>
                <div className="rounded bg-black/60 p-2 text-left text-[9px] space-y-0.5">
                  <p className="text-emerald-400">✓ Vitals synced to Hospital EHR</p>
                  <p className="text-emerald-400">✓ Paramedic SBAR transfer report signed</p>
                  <p className="text-comic-yellow">⚡ Patient moved to Trauma Bay Bed 2</p>
                </div>

                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full rounded bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-display text-xs py-1.5 shadow-md tracking-wider cursor-pointer transition-transform font-bold"
                >
                  SIGN SBAR CLINICAL HANDOVER →
                </button>
              </div>
            )}

            {/* Step 11: Handover Complete & Admitted */}
            {currentSimStep >= 11 && (
              <div className="my-auto space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="font-display text-base text-white">Patient Admitted to ER</p>
                <p className="text-[10px] text-slate-300">
                  Emergency triage complete. Doctors managing patient care.
                </p>
                <div className="rounded bg-emerald-900/60 border border-emerald-600 p-1 text-[9px] font-bold text-emerald-300">
                  ✓ Transfer Signed • Vehicle Released
                </div>

                <button
                  type="button"
                  onClick={onResetSimulation || onAdvanceStage}
                  className="w-full rounded bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-display text-xs py-1.5 shadow-md tracking-wider cursor-pointer transition-transform font-bold"
                >
                  PATIENT ADMITTED • RESET ↺
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-rose-800/60 pt-1 text-center text-[9px] text-rose-400">
              HL7 FHIR • National Trauma Telemetry Bridge
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
