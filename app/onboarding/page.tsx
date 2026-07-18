"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { useApiClient } from "@/lib/use-api-client";

type Level = "beginner" | "intermediate" | "advanced";
type Goal = "hypertrophy" | "strength" | "weight_loss" | "endurance";

const LEVELS: { value: Level; label: string }[] = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
];

const GOALS: { value: Goal; label: string }[] = [
  { value: "hypertrophy", label: "Prise de muscle" },
  { value: "strength", label: "Force" },
  { value: "weight_loss", label: "Perte de poids" },
  { value: "endurance", label: "Endurance" },
];

const DAYS = [
  { value: 0, label: "L" },
  { value: 1, label: "M" },
  { value: 2, label: "M" },
  { value: 3, label: "J" },
  { value: 4, label: "V" },
  { value: 5, label: "S" },
  { value: 6, label: "D" },
] as const;

const STEP_COUNT = 3;

const selectableButton = (selected: boolean) =>
  selected
    ? "border-[#5DCAA5] bg-[#E1F5EE] text-[#085041]"
    : "border-zinc-300 text-zinc-700 hover:border-zinc-400";

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl border px-4 py-4 font-bold transition ${
        disabled
          ? "cursor-not-allowed border-zinc-200 bg-white text-zinc-300"
          : "border-transparent bg-[#0F6E56] text-white hover:opacity-90"
      }`}
    >
      {children}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const fetchAPI = useApiClient();

  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const [goal, setGoal] = useState<Goal>("hypertrophy");
  const [availabilityDays, setAvailabilityDays] = useState<number[]>([]);
  const [healthDataConsent, setHealthDataConsent] = useState(false);
  const [medicalDisclaimerAccepted, setMedicalDisclaimerAccepted] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function toggleDay(day: number) {
    setAvailabilityDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleCreateProgram() {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await fetchAPI("/users/me/onboarding", {
        method: "POST",
        body: JSON.stringify({
          level,
          goal,
          availability_days: availabilityDays,
          rgpd_consent: {
            health_data: healthDataConsent,
            geolocation: false,
            marketing: false,
          },
          medical_disclaimer_accepted: medicalDisclaimerAccepted,
        }),
      });
      router.push("/dashboard");
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Une erreur est survenue. Réessaie.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="flex w-full max-w-[440px] flex-col">
        <div className="mb-6 flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold leading-tight text-zinc-900">
            Personnalise ton programme
          </h1>
          <p className="mt-2 text-[13px] text-zinc-500">
            En 1 minute, on configure ton premier programme
          </p>
          <div className="mt-4 flex items-center gap-2">
            {Array.from({ length: STEP_COUNT }).map((_, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index <= step ? "bg-[#0F6E56]" : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-5 py-[1.1rem]">
            <p className="text-[13px] font-medium text-zinc-600">
              Ton niveau
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {LEVELS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  aria-pressed={level === opt.value}
                  className={`rounded-xl border-[0.5px] p-2.5 text-[13px] font-medium transition ${selectableButton(
                    level === opt.value,
                  )}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="mt-6 text-[13px] font-medium text-zinc-600">
              Ton objectif
            </p>
            <div className="relative mt-3">
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className="w-full appearance-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-[#0F6E56]"
              >
                {GOALS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-5 py-[1.1rem]">
            <p className="text-[13px] font-medium text-zinc-600">
              Jours disponibles
            </p>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  aria-pressed={availabilityDays.includes(day.value)}
                  className={`rounded-xl border-[0.5px] py-[9px] text-[12px] font-medium transition ${selectableButton(
                    availabilityDays.includes(day.value),
                  )}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-[#9FE1CB] bg-[#E1F5EE] px-5 py-4">
              <div className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-[14px] w-[14px] text-[#0F6E56]"
                >
                  <path
                    d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[12px] font-bold text-[#0F6E56]">
                  Consentement données de santé
                </span>
              </div>
              <label className="mt-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={healthDataConsent}
                  onChange={(e) => setHealthDataConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#5DCAA5] text-[#0F6E56] focus:ring-[#0F6E56]"
                />
                <span className="text-[13px] text-[#085041]">
                  J&apos;accepte que mes données de santé (RPE, séances,
                  charges) soient traitées pour personnaliser mes
                  recommandations.
                </span>
              </label>
            </div>

            <div className="rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-5 py-[1.1rem]">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={medicalDisclaimerAccepted}
                  onChange={(e) =>
                    setMedicalDisclaimerAccepted(e.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-[#0F6E56] focus:ring-[#0F6E56]"
                />
                <span className="text-[13px] text-zinc-600">
                  Je reconnais que FitConnect ne remplace pas un avis médical
                  professionnel.
                </span>
              </label>
            </div>
          </div>
        )}

        {serverError && (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-600">
            {serverError}
          </p>
        )}

        <div className="mt-6">
          {step === 0 && (
            <PrimaryButton disabled={!level} onClick={() => setStep(1)}>
              Continuer
            </PrimaryButton>
          )}
          {step === 1 && (
            <PrimaryButton
              disabled={availabilityDays.length === 0}
              onClick={() => setStep(2)}
            >
              Continuer
            </PrimaryButton>
          )}
          {step === 2 && (
            <PrimaryButton
              disabled={
                !healthDataConsent || !medicalDisclaimerAccepted || isSubmitting
              }
              onClick={handleCreateProgram}
            >
              {isSubmitting ? "Création..." : "Créer mon programme"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </main>
  );
}
