import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, Shield } from 'lucide-react';
import LocationStep from '@/components/request/LocationStep';
import PatientStep from '@/components/request/PatientStep';
import ReviewStep from '@/components/request/ReviewStep';
import RequestConfirmation from '@/components/request/RequestConfirmation';
import {
  sanitizeAge,
  sanitizeName,
  sanitizePhone,
  sanitizeText,
  validateLocation,
  validatePatient,
  type DraftErrors,
  type RequestDraft,
} from '@/lib/requestValidation';
import { sendDispatchSmsAlerts, type DispatchAlertResult } from '@/lib/twilioSms';
import type { NewRequestFields } from '@/lib/channels';
import type { View } from '@/types';

interface RequestPageProps {
  onCreate: (input: NewRequestFields) => string;
  onNavigate: (view: View) => void;
}

const STEPS = ['Location', 'Patient Details', 'Review & Dispatch'] as const;

const EMPTY_DRAFT: RequestDraft = {
  pickupArea: '',
  pickupNote: '',
  patientName: '',
  patientPhone: '',
  patientAge: '',
  description: '',
  category: 'BLS',
  serviceType: undefined,
};

export default function RequestPage({ onCreate, onNavigate }: RequestPageProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<RequestDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [smsResult, setSmsResult] = useState<DispatchAlertResult | null>(null);

  const update = <K extends keyof RequestDraft>(key: K, value: RequestDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const goNext = () => {
    const stepErrors = step === 0 ? validateLocation(draft) : validatePatient(draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setSubmitting(true);
    const sanitizedName = sanitizeName(draft.patientName.trim()) || 'Unknown Patient';
    const sanitizedPhone = sanitizePhone(draft.patientPhone.trim());
    const sanitizedNote = sanitizeText(draft.pickupNote.trim(), 150);
    const sanitizedDesc = sanitizeText(draft.description.trim(), 400);
    const sanitizedAge = draft.patientAge ? Number(sanitizeAge(draft.patientAge)) : null;

    const id = onCreate({
      channel: 'Mobile app',
      pickupArea: draft.pickupArea,
      pickupNote: sanitizedNote,
      patientName: sanitizedName,
      patientPhone: sanitizedPhone,
      patientAge: sanitizedAge,
      description: sanitizedDesc,
      category: draft.category,
      serviceType: draft.serviceType,
      network: 'private',
      aiCaptured: false,
      externalRef: null,
    });

    // Transmit Twilio SMS alerts to both the patient and Central Admin (8431591698)
    try {
      const res = await sendDispatchSmsAlerts({
        requestId: id,
        patientName: sanitizedName,
        patientPhone: sanitizedPhone,
        pickupArea: draft.pickupArea,
        pickupNote: sanitizedNote,
        coords: draft.coords,
        serviceType: draft.serviceType,
        category: draft.category,
      });
      setSmsResult(res);
    } catch (err) {
      console.error('Failed to send Twilio SMS:', err);
    } finally {
      setSubmitting(false);
      setSubmittedId(id);
    }
  };

  if (submittedId) {
    return (
      <RequestConfirmation
        requestId={submittedId}
        onNavigate={onNavigate}
        smsResult={smsResult}
        patientPhone={draft.patientPhone}
        pickupArea={draft.pickupArea}
        onNewRequest={() => {
          setSubmittedId(null);
          setSmsResult(null);
          setDraft(EMPTY_DRAFT);
          setStep(0);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-3 py-3 sm:px-6 sm:py-5">
      {/* Compact Header Bar */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded border-2 border-ink bg-comic-red text-white shadow-xs">
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-ink leading-tight">
              Request an Ambulance
            </h1>
            <p className="text-[11px] sm:text-xs text-ink/70">
              Private ambulance dispatch • Human operator verification on assignment.
            </p>
          </div>
        </div>

        <span className="comic-tag bg-comic-yellow text-xs font-bold">
          Step {step + 1} of 3: {STEPS[step]}
        </span>
      </header>

      {/* Compact Progress Stepper */}
      <ol className="mb-3 grid grid-cols-3 gap-2" aria-label="Request progress">
        {STEPS.map((label, index) => {
          const done = index < step;
          const current = index === step;
          return (
            <li
              key={label}
              aria-current={current ? 'step' : undefined}
              className={`flex items-center justify-center gap-1.5 rounded-lg border-2 border-ink px-2 py-1 font-display text-xs sm:text-sm tracking-wide transition-all ${
                current
                  ? 'bg-comic-yellow text-ink shadow-panel-sm font-bold -translate-y-0.5'
                  : done
                    ? 'bg-ink text-comic-cream'
                    : 'bg-white text-ink/50'
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                done ? 'bg-emerald-500 text-white' : current ? 'bg-comic-red text-white' : 'border border-ink/40 text-ink/60'
              }`}>
                {done ? <Check className="h-3 w-3 stroke-[3]" /> : index + 1}
              </span>
              <span className="truncate">{label}</span>
            </li>
          );
        })}
      </ol>

      {/* Main Step Content Box with Optimized Padding */}
      <div className="rounded-xl border-4 border-ink bg-white p-3.5 sm:p-5 shadow-panel">
        {step === 0 && <LocationStep draft={draft} errors={errors} onChange={update} />}
        {step === 1 && <PatientStep draft={draft} errors={errors} onChange={update} />}
        {step === 2 && <ReviewStep draft={draft} />}

        {/* Compact Navigation Controls */}
        <div className="mt-4 flex items-center justify-between border-t-2 border-ink/15 pt-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="comic-button-ghost px-3 py-1.5 text-xs sm:text-sm flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="comic-button-primary px-5 py-1.5 text-xs sm:text-sm flex items-center gap-1 shadow-panel-sm"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="comic-button-primary px-6 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-panel-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Transmitting SMS...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Confirm & Dispatch</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
