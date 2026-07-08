"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAccess from "@/components/auth/RequireAccess";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import AsyncButton from "@/components/AsyncButton";
import InputField from "@/components/InputField";
import { apiRequest } from "@/lib/api";
import type { AccessContext } from "@/lib/authRedirect";

type BusinessOnboardingResponse = {
  ok: true;
  data: {
    business: {
      id: string;
      displayName: string;
      slug: string;
      category: string;
      shortDescription: string | null;
      city: string;
      district: string | null;
      sector: string | null;
      addressLine: string | null;
      phone: string | null;
      whatsappNumber: string | null;
      logoUrl: string | null;
      coverImageUrl: string | null;
    };
    access: AccessContext;
  };
};

const categories = [
  "Restaurant",
  "Cafe",
  "Hotel",
  "Guest house",
  "Lounge",
  "Nightlife",
  "Event place",
  "Tour experience",
  "Wellness",
  "Shop",
];

const coverOptions = [
  {
    label: "Restaurant",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85",
  },
  {
    label: "Cafe",
    url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=85",
  },
  {
    label: "Hotel",
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85",
  },
  {
    label: "Experience",
    url: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=85",
  },
];

const steps = [
  {
    title: "Business",
    helper: "Name and what customers should know first.",
  },
  {
    title: "Location",
    helper: "Where people find you and how they contact you.",
  },
  {
    title: "Photos",
    helper: "Choose the first image customers see.",
  },
];

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    legalName: "",
    category: "Restaurant",
    shortDescription: "",
    city: "Kigali",
    district: "",
    sector: "",
    addressLine: "",
    phone: "",
    whatsappNumber: "",
    email: "",
    websiteUrl: "",
    coverImageUrl: coverOptions[0].url,
    logoUrl: "",
  });

  const locationText = useMemo(() => {
    return [form.addressLine, form.sector, form.district, form.city]
      .filter(Boolean)
      .join(", ");
  }, [form.addressLine, form.city, form.district, form.sector]);

  function updateField(key: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function getStepError(stepIndex: number) {
    if (stepIndex === 0) {
      if (!form.displayName.trim()) return "Add the business name.";
      if (!form.category.trim()) return "Choose the business type.";
      if (!form.shortDescription.trim()) {
        return "Add a short customer-friendly description.";
      }
    }

    if (stepIndex === 1) {
      if (!form.city.trim()) return "Add the city.";
      if (!form.phone.trim()) return "Add the main phone number.";
    }

    if (stepIndex === 2) {
      if (!form.coverImageUrl.trim()) return "Choose or paste a cover photo.";
    }

    return "";
  }

  function validateCurrentStep() {
    return getStepError(step);
  }

  function canOpenStep(stepIndex: number) {
    if (stepIndex <= step) return true;
    if (stepIndex === 1) return !getStepError(0);
    if (stepIndex === 2) return !getStepError(0) && !getStepError(1);

    return false;
  }

  function openStep(stepIndex: number) {
    if (canOpenStep(stepIndex)) {
      setError("");
      setStep(stepIndex);
      return;
    }

    if (stepIndex === 1) {
      setError(getStepError(0) || "Finish step 1 first.");
      setStep(0);
      return;
    }

    if (stepIndex === 2) {
      const firstError = getStepError(0);
      const secondError = getStepError(1);

      setError(firstError || secondError || "Finish the previous step first.");
      setStep(firstError ? 0 : 1);
    }
  }

  function goNext() {
    const message = validateCurrentStep();

    if (message) {
      setError(message);
      return;
    }

    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function finishOnboarding() {
    const message = validateCurrentStep();

    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await apiRequest<BusinessOnboardingResponse>(
        "/businesses/onboarding",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );

      localStorage.setItem(
        "addressorAccessContext",
        JSON.stringify(response.data.access),
      );

      router.replace("/business-dashboard");
    } catch {
      setError("Business profile could not be created. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAccess mode="auth">
      <main
        className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8"
        style={{
          background: "var(--background)",
          color: "var(--text)",
        }}
      >
        <div className="imigongo-pattern pointer-events-none absolute inset-0 opacity-[0.024] dark:opacity-[0.04]" />
        <section className="relative mx-auto w-full max-w-7xl">
          <header
            className="mb-3 rounded-[1.35rem] border p-2.5 shadow-sm sm:mb-4 sm:rounded-[1.75rem] sm:p-4"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  href="/welcome"
                  className="grid size-9 shrink-0 place-items-center rounded-xl border text-xs font-black shadow-sm sm:size-11 sm:rounded-2xl sm:text-sm"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--border)",
                    color: "var(--accent)",
                  }}
                  aria-label="Go to Addressor home"
                >
                  A
                </Link>

                <div className="min-w-0">
                  <p
                    className="text-[0.66rem] font-black uppercase tracking-[0.22em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Addressor business
                  </p>
                  <h2 className="mt-1 truncate text-xs font-black tracking-[-0.02em] sm:text-lg sm:tracking-[-0.03em]">
                    Create a profile customers can trust.
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-1.5 sm:flex sm:justify-end sm:gap-2">
                <Link
                  href="/welcome"
                  className="rounded-full border px-3 py-2 text-center text-[0.68rem] font-black transition hover:scale-[1.01] sm:px-4 sm:py-2.5 sm:text-xs"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Customer home
                </Link>

                <ThemeToggle />

                <LogoutButton />
              </div>
            </div>
          </header>

          <div className="grid min-h-[calc(100vh-7rem)] gap-3 sm:gap-4 lg:grid-cols-[0.78fr_1.22fr] lg:items-stretch">
            <aside
              className="rounded-[1.35rem] border p-3.5 shadow-sm sm:rounded-[2rem] sm:p-6 lg:p-7"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex h-full flex-col">
                <div>
                  <div
                    className="inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.22em]"
                    style={{
                      background: "var(--surface-strong)",
                      borderColor: "var(--border)",
                      color: "var(--accent)",
                    }}
                  >
                    Business onboarding
                  </div>

                  <h1 className="mt-4 max-w-xl text-2xl font-black tracking-[-0.055em] sm:mt-5 sm:text-4xl sm:tracking-[-0.065em] lg:text-5xl">
                    Set up your business in minutes.
                  </h1>

                  <p
                    className="mt-3 max-w-xl text-xs leading-5 sm:mt-4 sm:text-base sm:leading-7"
                    style={{ color: "var(--muted)" }}
                  >
                    Add only what customers need first: what you offer, where you are,
                    how to reach you, and the photo they see first.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-1.5 sm:mt-6 sm:gap-2">
                  {steps.map((item, index) => {
                    const active = index === step;
                    const done = index < step;
                    const available = canOpenStep(index);

                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => openStep(index)}
                        disabled={!available && index > step}
                        className="rounded-xl border p-2 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 sm:rounded-2xl sm:p-3"
                        style={{
                          background:
                            active || done
                              ? "var(--surface-strong)"
                              : "var(--surface)",
                          borderColor:
                            active || done ? "var(--accent)" : "var(--border)",
                        }}
                      >
                        <span
                          className="block text-[0.65rem] font-black uppercase tracking-[0.18em]"
                          style={{ color: active || done ? "var(--accent)" : "var(--muted)" }}
                        >
                          Step {index + 1}
                        </span>
                        <span className="mt-1.5 block text-[0.68rem] font-black sm:mt-2 sm:text-sm">
                          {item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {error ? (
                  <div
                    className="mt-5 rounded-2xl border px-4 py-3 text-sm font-bold leading-6"
                    style={{
                      background: "var(--surface-strong)",
                      borderColor: "var(--border)",
                      color: "var(--danger)",
                    }}
                  >
                    {error}
                  </div>
                ) : null}

                <div className="mt-4 flex-1 sm:mt-6">
                  {step === 0 ? (
                    <div className="space-y-4">
                      <InputField
                        label="Business name"
                        value={form.displayName}
                        onChange={(value) => updateField("displayName", value)}
                        placeholder="Kigali Garden Lounge"
                      />

                      <InputField
                        label="Legal name, optional"
                        value={form.legalName}
                        onChange={(value) => updateField("legalName", value)}
                        placeholder="Registered business name"
                      />

                      <div>
                        <label className="text-sm font-black">Business type</label>
                        <select
                          value={form.category}
                          onChange={(event) => updateField("category", event.target.value)}
                          className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-bold outline-none"
                          style={{
                            background: "var(--surface-strong)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                          }}
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <InputField
                        label="Short description"
                        value={form.shortDescription}
                        onChange={(value) => updateField("shortDescription", value)}
                        placeholder="Rooftop food, cocktails, and weekend live music."
                      />
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField
                          label="City"
                          value={form.city}
                          onChange={(value) => updateField("city", value)}
                          placeholder="Kigali"
                        />
                        <InputField
                          label="District"
                          value={form.district}
                          onChange={(value) => updateField("district", value)}
                          placeholder="Gasabo"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField
                          label="Area"
                          value={form.sector}
                          onChange={(value) => updateField("sector", value)}
                          placeholder="Kacyiru"
                        />
                        <InputField
                          label="Address hint"
                          value={form.addressLine}
                          onChange={(value) => updateField("addressLine", value)}
                          placeholder="Near the main road"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField
                          label="Main phone"
                          value={form.phone}
                          onChange={(value) => updateField("phone", value)}
                          placeholder="2507..."
                        />
                        <InputField
                          label="WhatsApp, optional"
                          value={form.whatsappNumber}
                          onChange={(value) => updateField("whatsappNumber", value)}
                          placeholder="2507..."
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField
                          label="Email, optional"
                          value={form.email}
                          onChange={(value) => updateField("email", value)}
                          placeholder="hello@business.rw"
                        />
                        <InputField
                          label="Website, optional"
                          value={form.websiteUrl}
                          onChange={(value) => updateField("websiteUrl", value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-black">Choose a cover photo</p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {coverOptions.map((option) => {
                            const selected = form.coverImageUrl === option.url;

                            return (
                              <button
                                key={option.url}
                                type="button"
                                onClick={() => updateField("coverImageUrl", option.url)}
                                className="group overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5"
                                style={{
                                  background: "var(--surface-strong)",
                                  borderColor: selected ? "var(--accent)" : "var(--border)",
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={option.url}
                                  alt=""
                                  className="h-24 w-full object-cover"
                                />
                                <div className="px-3 py-2 text-xs font-black">
                                  {option.label}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <InputField
                        label="Or paste your own cover photo link"
                        value={form.coverImageUrl}
                        onChange={(value) => updateField("coverImageUrl", value)}
                        placeholder="https://..."
                      />

                      <InputField
                        label="Logo link, optional"
                        value={form.logoUrl}
                        onChange={(value) => updateField("logoUrl", value)}
                        placeholder="https://..."
                      />
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
                  <button
                    type="button"
                    disabled={step === 0 || saving}
                    onClick={() => {
                      setError("");
                      setStep((current) => Math.max(current - 1, 0));
                    }}
                    className="rounded-full border px-5 py-3 text-sm font-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: "var(--surface-strong)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                  >
                    Back
                  </button>

                  {step < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="rounded-full px-5 py-3 text-sm font-black transition hover:scale-[1.01]"
                      style={{
                        background: "var(--accent)",
                        color: "var(--accent-contrast)",
                      }}
                    >
                      Continue
                    </button>
                  ) : (
                    <AsyncButton
                      type="button"
                      loading={saving}
                      onClick={finishOnboarding}
                    >
                      Finish and open dashboard
                    </AsyncButton>
                  )}
                </div>
              </div>
            </aside>

            <section
              className="overflow-hidden rounded-[1.35rem] border shadow-sm sm:rounded-[2rem]"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex min-h-full flex-col">
                <div className="relative min-h-[305px] overflow-hidden sm:min-h-[520px] lg:min-h-[610px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.coverImageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/45" />

                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-7 lg:p-8">
                    <article
                      className="max-w-3xl rounded-[1.1rem] border p-3 shadow-sm sm:rounded-[1.35rem] sm:p-5 lg:p-6"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      <div
                        className="mb-3 inline-flex rounded-full border px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.18em] sm:mb-4 sm:px-3 sm:text-[0.68rem] sm:tracking-[0.22em]"
                        style={{
                          background: "var(--surface-strong)",
                          borderColor: "var(--border)",
                          color: "var(--accent)",
                        }}
                      >
                        {form.category || "Business type"}
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border text-sm font-black sm:size-16 sm:rounded-2xl sm:text-lg"
                          style={{
                            background: "var(--surface-strong)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                          }}
                        >
                          {form.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={form.logoUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (form.displayName || "A").slice(0, 1).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <h2
                            className="max-w-[24ch] break-words text-[clamp(1rem,2vw,2.2rem)] font-black leading-[1.08] tracking-[-0.035em]"
                            style={{ color: "var(--text)" }}
                          >
                            {form.displayName || "Your business name"}
                          </h2>
                          <p
                            className="mt-1.5 line-clamp-2 max-w-2xl text-[0.68rem] font-semibold leading-4 sm:mt-3 sm:text-sm sm:leading-6"
                            style={{ color: "var(--muted)" }}
                          >
                            {form.shortDescription ||
                              "A short line that helps customers understand why they should visit."}
                          </p>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 sm:gap-3 sm:p-6 lg:p-7">
                  <div
                    className="rounded-2xl border p-3 sm:rounded-3xl sm:p-4"
                    style={{
                      background: "var(--surface-strong)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <p
                      className="text-xs font-black uppercase tracking-[0.18em]"
                      style={{ color: "var(--muted)" }}
                    >
                      Location
                    </p>
                    <p className="mt-2 text-[0.68rem] font-black leading-4 sm:mt-3 sm:text-sm sm:leading-6">
                      {locationText || "Add city, area, and address hint"}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl border p-3 sm:rounded-3xl sm:p-4"
                    style={{
                      background: "var(--surface-strong)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <p
                      className="text-xs font-black uppercase tracking-[0.18em]"
                      style={{ color: "var(--muted)" }}
                    >
                      Contact
                    </p>
                    <p className="mt-2 text-[0.68rem] font-black leading-4 sm:mt-3 sm:text-sm sm:leading-6">
                      {form.whatsappNumber || form.phone || "Add phone or WhatsApp"}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl border p-3 sm:rounded-3xl sm:p-4"
                    style={{
                      background: "var(--surface-strong)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <p
                      className="text-xs font-black uppercase tracking-[0.18em]"
                      style={{ color: "var(--muted)" }}
                    >
                      Customer action
                    </p>
                    <p className="mt-2 text-[0.68rem] font-black leading-4 sm:mt-3 sm:text-sm sm:leading-6">
                      Call, message, visit, or request
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </RequireAccess>
  );
}
