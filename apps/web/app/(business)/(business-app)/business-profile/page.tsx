"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { AccessContext } from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";
import { saveAccessContext } from "@/lib/authSession";
import { chooseActiveBusiness } from "@/lib/businessSession";

type BusinessProfile = {
  id: string;
  displayName: string;
  legalName: string;
  slug: string;
  category: string;
  shortDescription: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  whatsappNumber: string | null;
  country: string;
  city: string;
  district: string | null;
  sector: string | null;
  addressLine: string | null;
  verificationStatus: string;
  onboardingStatus: string;
  subscriptionStatus: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  role: string;
  teamStatus: string;
};

type MyBusinessesResponse = {
  ok: true;
  data: { businesses: BusinessProfile[] };
};

type UpdateBusinessResponse = {
  ok: true;
  data: {
    business: BusinessProfile;
    access: AccessContext;
  };
};

type ProfileForm = {
  displayName: string;
  legalName: string;
  category: string;
  shortDescription: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  websiteUrl: string;
  city: string;
  district: string;
  sector: string;
  addressLine: string;
  logoUrl: string;
  coverImageUrl: string;
};

type ReadinessItem = {
  label: string;
  complete: boolean;
  href: string;
};

type ImagePurpose = "cover" | "logo";
type ImageUploadStatus = "idle" | "uploading" | "ready" | "error";

type ImageUploadState = {
  status: ImageUploadStatus;
  previewUrl: string | null;
  message: string;
};

type ProfileImageUploadResponse = {
  ok: true;
  data: {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresInSeconds: number;
  };
};

const profileImageRules = {
  cover: { label: "Cover photo", maxBytes: 8 * 1024 * 1024 },
  logo: { label: "Business logo", maxBytes: 4 * 1024 * 1024 },
} as const;

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];

function emptyUploadState(): ImageUploadState {
  return { status: "idle", previewUrl: null, message: "" };
}

const categorySuggestions = [
  "Restaurant",
  "Cafe",
  "Hotel",
  "Guest house",
  "Salon",
  "Wellness",
  "Clinic",
  "Pharmacy",
  "Shop",
  "Garage",
  "Agency",
  "Professional service",
  "Tour experience",
  "Event venue",
];

function emptyForm(): ProfileForm {
  return {
    displayName: "",
    legalName: "",
    category: "",
    shortDescription: "",
    phone: "",
    whatsappNumber: "",
    email: "",
    websiteUrl: "",
    city: "",
    district: "",
    sector: "",
    addressLine: "",
    logoUrl: "",
    coverImageUrl: "",
  };
}

function formFromBusiness(business: BusinessProfile): ProfileForm {
  return {
    displayName: business.displayName ?? "",
    legalName: business.legalName ?? business.displayName ?? "",
    category: business.category ?? "",
    shortDescription: business.shortDescription ?? "",
    phone: business.phone ?? "",
    whatsappNumber: business.whatsappNumber ?? "",
    email: business.email ?? "",
    websiteUrl: business.websiteUrl ?? "",
    city: business.city ?? "",
    district: business.district ?? "",
    sector: business.sector ?? "",
    addressLine: business.addressLine ?? "",
    logoUrl: business.logoUrl ?? "",
    coverImageUrl: business.coverImageUrl ?? "",
  };
}

function getStatusLabel(status: string) {
  return status
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  maxLength,
  inputMode,
  autoComplete,
  list,
  note,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel";
  required?: boolean;
  maxLength?: number;
  inputMode?: "text" | "email" | "url" | "tel";
  autoComplete?: string;
  list?: string;
  note?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[0.72rem] font-black uppercase tracking-[0.14em]" style={{ color: "var(--text)" }}>
        {label}{required ? " *" : ""}
      </span>
      {note ? (
        <span className="mt-1 block text-sm font-semibold leading-5" style={{ color: "var(--muted)" }}>
          {note}
        </span>
      ) : null}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        list={list}
        className="mt-2 w-full min-w-0 rounded-[1rem] border px-3 py-3 text-sm font-bold outline-none transition-colors focus:border-[var(--accent)] sm:px-4"
        style={{
          background: "var(--surface-strong)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      />
    </label>
  );
}

function DescriptionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="flex items-center justify-between gap-3">
        <span className="text-[0.72rem] font-black uppercase tracking-[0.14em]" style={{ color: "var(--text)" }}>
          Short description
        </span>
        <span className="text-[0.75rem] font-bold" style={{ color: "var(--muted)" }}>
          {value.length}/220
        </span>
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Explain clearly what customers can expect from your business."
        maxLength={220}
        rows={4}
        className="mt-2 w-full min-w-0 resize-none rounded-[1rem] border px-3 py-3 text-sm font-bold leading-6 outline-none transition-colors focus:border-[var(--accent)] sm:px-4"
        style={{
          background: "var(--surface-strong)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      />
    </label>
  );
}

function ImageUploadControl({
  purpose,
  currentUrl,
  upload,
  onFile,
  onClear,
}: {
  purpose: ImagePurpose;
  currentUrl: string;
  upload: ImageUploadState;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const rules = profileImageRules[purpose];
  const imageUrl = upload.previewUrl || currentUrl;
  const inputId = `business-${purpose}-image`;

  return (
    <div className="min-w-0 rounded-[1rem] border p-3" style={{ background: "var(--surface-strong)", borderColor: "var(--border)" }}>
      <div className={purpose === "cover" ? "grid min-w-0 gap-3" : "flex min-w-0 items-center gap-3"}>
        <div className={`relative shrink-0 overflow-hidden border ${purpose === "cover" ? "h-24 w-full rounded-[0.85rem] sm:h-28" : "h-20 w-20 rounded-[1rem]"}`} style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-2 text-center text-[0.72rem] font-black" style={{ color: "var(--muted)" }}>No image</div>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{rules.label}</p>
          <p className="mt-1 text-sm font-semibold leading-5" style={{ color: upload.status === "error" ? "#fca5a5" : "var(--muted)" }} aria-live="polite">
            {upload.status === "uploading" ? "Uploading image…" : upload.status === "ready" ? "Uploaded and ready to save" : upload.status === "error" ? upload.message : `JPG, PNG or WebP · up to ${purpose === "cover" ? "8" : "4"} MB`}
          </p>
        </div>
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={upload.status === "uploading"}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) onFile(file);
          }}
        />
        <label htmlFor={inputId} className={`rounded-full px-3 py-2 whitespace-nowrap text-xs font-black ${upload.status === "uploading" ? "pointer-events-none opacity-50" : "cursor-pointer"}`} style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>
          {imageUrl ? "Replace image" : "Choose image"}
        </label>
        {imageUrl ? <button type="button" onClick={onClear} disabled={upload.status === "uploading"} className="rounded-full border px-3 py-2 whitespace-nowrap text-xs font-black disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Remove</button> : null}
      </div>
    </div>
  );
}

function PageState({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[1.5rem] border p-4 sm:rounded-[1.75rem] sm:p-6"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.05em] sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>
        {text}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

function FormSection({
  id,
  step,
  eyebrow,
  title,
  text,
  status,
  primary = false,
  children,
}: {
  id: string;
  step: string;
  eyebrow: string;
  title: string;
  text: string;
  status: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-5 rounded-[1.35rem] border p-3 sm:p-5"
      style={{
        background: "var(--surface)",
        borderColor: primary
          ? "color-mix(in srgb, var(--accent) 34%, var(--border))"
          : "var(--border)",
      }}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black"
            style={{
              background: primary ? "var(--accent)" : "var(--surface-strong)",
              color: primary ? "var(--accent-contrast)" : "var(--text)",
            }}
          >
            {step}
          </span>
          <div className="min-w-0">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
              {eyebrow}
            </p>
            <h2 className="mt-1 text-lg font-black tracking-[-0.035em] sm:text-xl">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-5" style={{ color: "var(--muted)" }}>
              {text}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-1.5 text-[0.72rem] font-black" style={{ background: "var(--surface-strong)", color: "var(--text)" }}>
          {status}
        </span>
      </div>
      <div className="mt-3 sm:mt-4">{children}</div>
    </section>
  );
}

export default function BusinessProfilePage() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(() => emptyForm());
  const [savedForm, setSavedForm] = useState<ProfileForm>(() => emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [coverUpload, setCoverUpload] = useState<ImageUploadState>(() => emptyUploadState());
  const [logoUpload, setLogoUpload] = useState<ImageUploadState>(() => emptyUploadState());
  const uploadRequestIds = useRef<Record<ImagePurpose, number>>({ cover: 0, logo: 0 });

  useEffect(() => {
    const previewUrl = coverUpload.previewUrl;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [coverUpload.previewUrl]);

  useEffect(() => {
    const previewUrl = logoUpload.previewUrl;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [logoUpload.previewUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest<MyBusinessesResponse>("/businesses/my", {
          method: "GET",
        });
        const selectedBusiness = chooseActiveBusiness(response.data.businesses);

        if (!cancelled) {
          setBusiness(selectedBusiness);

          if (selectedBusiness) {
            const nextForm = formFromBusiness(selectedBusiness);
            setForm(nextForm);
            setSavedForm(nextForm);
          }
        }
      } catch {
        if (!cancelled) {
          setBusiness(null);
          setError("We could not load your business profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  );
  const imageUploadInProgress = coverUpload.status === "uploading" || logoUpload.status === "uploading";

  const readinessItems = useMemo<ReadinessItem[]>(
    () => [
      { label: "Business name", complete: Boolean(form.displayName.trim()), href: "#public-identity" },
      { label: "Business type", complete: Boolean(form.category.trim()), href: "#public-identity" },
      { label: "Description", complete: Boolean(form.shortDescription.trim()), href: "#public-identity" },
      { label: "Contact method", complete: Boolean(form.phone.trim() || form.whatsappNumber.trim()), href: "#contact" },
      { label: "Location", complete: Boolean(form.city.trim()), href: "#location" },
      { label: "Cover photo", complete: Boolean(form.coverImageUrl.trim()), href: "#business-details" },
      { label: "Logo", complete: Boolean(form.logoUrl.trim()), href: "#business-details" },
    ],
    [form],
  );

  const missingItems = readinessItems.filter((item) => !item.complete);
  const readinessPercent = Math.round(
    ((readinessItems.length - missingItems.length) / readinessItems.length) * 100,
  );

  const locationText = useMemo(
    () => [form.addressLine, form.sector, form.district, form.city].filter(Boolean).join(", "),
    [form.addressLine, form.city, form.district, form.sector],
  );

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setNotice("");
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadProfileImage(purpose: ImagePurpose, file: File) {
    const rules = profileImageRules[purpose];
    const setUpload = purpose === "cover" ? setCoverUpload : setLogoUpload;
    const field = purpose === "cover" ? "coverImageUrl" : "logoUrl";
    const requestId = uploadRequestIds.current[purpose] + 1;
    uploadRequestIds.current[purpose] = requestId;

    if (!acceptedImageTypes.includes(file.type)) {
      setUpload({ status: "error", previewUrl: null, message: "Choose a JPG, PNG or WebP image." });
      return;
    }

    if (file.size > rules.maxBytes) {
      setUpload({ status: "error", previewUrl: null, message: `${rules.label} must be ${purpose === "cover" ? "8" : "4"} MB or smaller.` });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setUpload({ status: "uploading", previewUrl, message: "" });

    try {
      if (!business) throw new Error("Business unavailable");

      const response = await apiRequest<ProfileImageUploadResponse>(
        `/businesses/${business.id}/profile-image-upload`,
        {
          method: "POST",
          body: JSON.stringify({
            purpose,
            contentType: file.type,
            size: file.size,
          }),
        },
      );
      const uploadResponse = await fetch(response.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");
      if (uploadRequestIds.current[purpose] !== requestId) return;

      updateField(field, response.data.publicUrl);
      setUpload({ status: "ready", previewUrl, message: "" });
    } catch {
      if (uploadRequestIds.current[purpose] !== requestId) return;
      setUpload({ status: "error", previewUrl, message: "Upload failed. Choose the image again." });
    }
  }

  function clearProfileImage(purpose: ImagePurpose) {
    uploadRequestIds.current[purpose] += 1;

    if (purpose === "cover") {
      setCoverUpload(emptyUploadState());
      updateField("coverImageUrl", "");
      return;
    }

    setLogoUpload(emptyUploadState());
    updateField("logoUrl", "");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business || !isDirty || imageUploadInProgress) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await apiRequest<UpdateBusinessResponse>(
        `/businesses/${business.id}/profile`,
        { method: "PATCH", body: JSON.stringify(form) },
      );
      const updatedBusiness = {
        ...response.data.business,
        role: business.role,
        teamStatus: business.teamStatus,
      };
      const nextForm = formFromBusiness(updatedBusiness);

      setBusiness(updatedBusiness);
      setForm(nextForm);
      setSavedForm(nextForm);
      setCoverUpload(emptyUploadState());
      setLogoUpload(emptyUploadState());
      saveAccessContext(response.data.access);
      setNotice("Business profile saved.");
    } catch {
      setError("Profile was not saved. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-3" aria-live="polite" aria-busy="true">
        <PageState
          eyebrow="Business profile"
          title="Loading your business details…"
          text="Your business navigation remains available while the profile loads."
        />
        <div
          className="h-52 rounded-[1.5rem] border sm:h-80"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        />
      </div>
    );
  }

  if (error && !business) {
    return (
      <PageState
        eyebrow="Profile unavailable"
        title="We could not load the business profile."
        text="No profile information is being shown because it may be inaccurate."
        action={
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="rounded-full px-5 py-3 whitespace-nowrap text-sm font-black"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            Try again
          </button>
        }
      />
    );
  }

  if (!business) {
    return (
      <PageState
        eyebrow="Business needed"
        title="Choose a business to edit."
        text="The profile page needs an active business before it can show public information."
        action={
          <Link
            href="/businesses"
            prefetch
            className="inline-flex rounded-full px-5 py-3 whitespace-nowrap text-sm font-black"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            Choose business
          </Link>
        }
      />
    );
  }

  const completedCount = readinessItems.length - missingItems.length;
  const primaryNextAction = missingItems[0] ?? null;
  const identityCompleteCount = [form.displayName, form.category, form.shortDescription].filter((value) => value.trim()).length;
  const locationCompleteCount = [form.city, form.district, form.sector, form.addressLine].filter((value) => value.trim()).length;
  const contactCompleteCount = [form.phone, form.whatsappNumber, form.email, form.websiteUrl].filter((value) => value.trim()).length;
  const detailsCompleteCount = [form.legalName, form.coverImageUrl, form.logoUrl].filter((value) => value.trim()).length;
  const saveLabel = imageUploadInProgress ? "Uploading image…" : saving ? "Saving changes…" : error ? "Changes not saved" : isDirty ? "Unsaved changes" : "All changes saved";
  const coverPreviewUrl = coverUpload.previewUrl || form.coverImageUrl;
  const logoPreviewUrl = logoUpload.previewUrl || form.logoUrl;

  return (
    <div className={`grid min-w-0 gap-3 sm:gap-4 ${isDirty ? "pb-20 sm:pb-0" : ""}`}>
      <section className="rounded-[1.5rem] border p-4 sm:rounded-[1.75rem] sm:p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>Public business identity</p>
            <h1 className="mt-1.5 break-words text-2xl font-black tracking-[-0.05em] sm:text-3xl">{form.displayName || "Complete your business profile"}</h1>
            <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-5" style={{ color: "var(--muted)" }}>Control what customers see and make the next important improvement quickly.</p>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-3 lg:justify-end">
            <span className="min-w-0 text-sm font-bold leading-5" style={{ color: error ? "#fca5a5" : "var(--muted)" }} aria-live="polite">{saveLabel}</span>
            <button type="submit" form="business-profile-form" disabled={saving || imageUploadInProgress || !isDirty} className="shrink-0 rounded-full px-4 py-2.5 whitespace-nowrap text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 sm:px-5" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>
              <span className="sm:hidden">{saving ? "Saving…" : "Save"}</span>
              <span className="hidden sm:inline">{saving ? "Saving…" : "Save changes"}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid min-w-0 gap-3 border-t pt-4 md:grid-cols-[auto_auto_minmax(0,1fr)] md:items-center md:gap-5" style={{ borderColor: "var(--border)" }}>
          <div className="grid min-w-0 gap-2">
            <div className="flex items-center gap-2.5">
              <strong className="text-3xl font-black tracking-[-0.07em]">{readinessPercent}%</strong>
              <span className="text-sm font-bold leading-5" style={{ color: "var(--muted)" }}>listing<br />readiness</span>
            </div>
            <div
              className="h-1.5 w-28 max-w-full overflow-hidden rounded-full"
              style={{ background: "var(--surface-strong)" }}
              role="progressbar"
              aria-label="Listing readiness"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={readinessPercent}
            >
              <div className="h-full rounded-full" style={{ width: `${readinessPercent}%`, background: "var(--accent)" }} />
            </div>
          </div>
          <div className="flex items-center gap-2 border-t pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0" style={{ borderColor: "var(--border)" }}>
            <strong className="text-xl font-black">{missingItems.length}</strong>
            <span className="text-sm font-bold leading-5" style={{ color: "var(--muted)" }}>{missingItems.length === 1 ? "item needs" : "items need"}<br />attention</span>
          </div>
          <div className="min-w-0 rounded-[1rem] border p-3 md:justify-self-end" style={{ background: "var(--surface-strong)", borderColor: "color-mix(in srgb, var(--accent) 28%, var(--border))" }}>
            {primaryNextAction ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <span className="min-w-0 text-sm font-black" style={{ color: "var(--text)" }}>Next priority</span>
                <a href={primaryNextAction.href} className="rounded-full px-3 py-2 whitespace-nowrap text-xs font-black" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Add {primaryNextAction.label.toLowerCase()}</a>
              </div>
            ) : (
              <p className="text-sm font-black" style={{ color: "var(--accent)" }}>Your profile essentials are complete</p>
            )}
          </div>
        </div>
      </section>

      <div aria-live="polite" className="grid gap-2">
        {notice ? <p className="px-1 text-sm font-black" style={{ color: "var(--accent)" }}>{notice}</p> : null}
        {error ? <p className="rounded-[1rem] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300">{error}</p> : null}
      </div>

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start xl:gap-4">
        <form id="business-profile-form" onSubmit={saveProfile} className="grid min-w-0 gap-3">
          <datalist id="business-category-suggestions">{categorySuggestions.map((category) => <option key={category} value={category} />)}</datalist>

          <FormSection id="public-identity" step="01" primary eyebrow="What customers understand" title="Public identity" text="Make the business clear at a glance." status={`${identityCompleteCount} of 3 added`}>
            <div className="grid gap-3 md:grid-cols-2 md:gap-4">
              <Field required label="Business name" value={form.displayName} onChange={(value) => updateField("displayName", value)} placeholder="Your public business name" maxLength={120} autoComplete="organization" />
              <Field required label="Business type" value={form.category} onChange={(value) => updateField("category", value)} placeholder="Salon, clinic, shop, hotel…" maxLength={80} list="business-category-suggestions" note="Choose a suggestion or enter the best description." />
            </div>
            <div className="mt-3"><DescriptionField value={form.shortDescription} onChange={(value) => updateField("shortDescription", value)} /></div>
          </FormSection>

          <FormSection id="location" step="02" eyebrow="Where customers find you" title="Location" text={`Give customers a clear destination in ${business.country}.`} status={`${locationCompleteCount} of 4 added`}>
            <div className="grid gap-3 md:grid-cols-2 md:gap-4">
              <Field required label="City" value={form.city} onChange={(value) => updateField("city", value)} placeholder="Kigali" maxLength={80} autoComplete="address-level2" />
              <Field label="District" value={form.district} onChange={(value) => updateField("district", value)} placeholder="Nyarugenge" maxLength={80} autoComplete="address-level1" />
              <Field label="Area" value={form.sector} onChange={(value) => updateField("sector", value)} placeholder="Kiyovu" maxLength={80} />
              <Field label="Directions" value={form.addressLine} onChange={(value) => updateField("addressLine", value)} placeholder="Near a known road or landmark" maxLength={180} autoComplete="street-address" note="Use a landmark or detail customers will recognise." />
            </div>
          </FormSection>

          <FormSection id="contact" step="03" eyebrow="How customers reach you" title="Contact" text="Keep the best ways to call, message, or learn more in one place." status={`${contactCompleteCount} of 4 added`}>
            <div className="grid gap-3 md:grid-cols-2 md:gap-4">
              <Field required label="Main phone" type="tel" inputMode="tel" value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="250788000000" maxLength={40} autoComplete="tel" />
              <Field label="WhatsApp" type="tel" inputMode="tel" value={form.whatsappNumber} onChange={(value) => updateField("whatsappNumber", value)} placeholder="250788000000" maxLength={40} />
              <Field label="Email" type="email" inputMode="email" value={form.email} onChange={(value) => updateField("email", value)} placeholder="business@example.com" autoComplete="email" />
              <Field label="Website" type="url" inputMode="url" value={form.websiteUrl} onChange={(value) => updateField("websiteUrl", value)} placeholder="https://example.com" autoComplete="url" />
            </div>
          </FormSection>

          <FormSection id="business-details" step="04" eyebrow="Brand and official details" title="Business details" text="Keep your public images and registered name accurate." status={`${detailsCompleteCount} of 3 added`}>
            <div className="grid gap-3 md:grid-cols-2 md:gap-4">
              <Field label="Legal name" value={form.legalName} onChange={(value) => updateField("legalName", value)} placeholder="Registered business name" maxLength={160} note="Leave blank to use the public business name." />
              <div className="hidden md:block" />
              <ImageUploadControl purpose="cover" currentUrl={form.coverImageUrl} upload={coverUpload} onFile={(file) => uploadProfileImage("cover", file)} onClear={() => clearProfileImage("cover")} />
              <ImageUploadControl purpose="logo" currentUrl={form.logoUrl} upload={logoUpload} onFile={(file) => uploadProfileImage("logo", file)} onClear={() => clearProfileImage("logo")} />
            </div>
          </FormSection>
        </form>

        <aside className="contents xl:sticky xl:top-5 xl:grid xl:min-w-0 xl:gap-3">
          <section className="order-first overflow-hidden rounded-[1.5rem] border xl:order-none" style={{ background: "var(--surface)", borderColor: "color-mix(in srgb, var(--accent) 22%, var(--border))" }}>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ background: "var(--surface-strong)", borderColor: "var(--border)" }}>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>Live public preview</p>
                <p className="mt-0.5 text-sm font-bold leading-5" style={{ color: "var(--muted)" }}>{isDirty ? "Showing unsaved changes" : "What customers will see"}</p>
              </div>
              <span className="rounded-full border px-2.5 py-1.5 text-[0.72rem] font-black" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{getStatusLabel(business.verificationStatus)}</span>
            </div>
            <div className="relative min-h-40 sm:min-h-48 xl:min-h-52">
              {coverPreviewUrl ? <img src={coverPreviewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: "var(--surface-strong)" }} />}
              {coverPreviewUrl ? <div className="absolute inset-0 bg-black/55" /> : null}
              <div className="relative flex min-h-40 flex-col justify-end p-4 sm:min-h-48 xl:min-h-52">
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-[0.9rem] border text-base font-black" style={{ background: "var(--surface)", borderColor: coverPreviewUrl ? "rgba(255,255,255,0.55)" : "var(--border)", color: "var(--text)" }}>{logoPreviewUrl ? <img src={logoPreviewUrl} alt="" className="h-full w-full object-cover" /> : form.displayName.slice(0, 1) || "A"}</div>
                <p className={`mt-3 text-[0.72rem] font-black uppercase tracking-[0.16em] ${coverPreviewUrl ? "text-white/90" : ""}`} style={coverPreviewUrl ? undefined : { color: "var(--muted)" }}>{form.category || "Business type"}</p>
                <h2 className={`mt-1 break-words text-xl font-black tracking-[-0.05em] ${coverPreviewUrl ? "text-white" : ""}`}>{form.displayName || "Business name"}</h2>
                <p className={`mt-1.5 line-clamp-2 text-sm font-semibold leading-5 ${coverPreviewUrl ? "text-white/90" : ""}`} style={coverPreviewUrl ? undefined : { color: "var(--muted)" }}>{form.shortDescription || "Add a short description so customers know what to expect."}</p>
              </div>
            </div>
            <div className="grid divide-y border-t" style={{ background: "var(--surface-strong)", borderColor: "var(--border)" }}>
              <div className="grid min-w-0 gap-1.5 px-4 py-3"><p className="text-xs font-black" style={{ color: "var(--muted)" }}>Find us</p><p className="min-w-0 break-words text-base font-black leading-6 [overflow-wrap:anywhere]">{locationText || "Location not added"}</p></div>
              <div className="grid min-w-0 gap-1.5 px-4 py-3"><p className="text-xs font-black" style={{ color: "var(--muted)" }}>Contact</p><p className="min-w-0 break-words text-base font-black leading-6 [overflow-wrap:anywhere]">{form.phone || form.whatsappNumber || "Contact not added"}</p></div>
            </div>
          </section>

          <section className="rounded-[1.35rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between gap-3"><h2 className="text-base font-black">Missing items</h2><span className="text-sm font-bold" style={{ color: "var(--muted)" }}>{completedCount}/{readinessItems.length} complete</span></div>
            {missingItems.length ? (
              <div className="mt-3 grid gap-1.5">
                {missingItems.map((item, index) => <a key={item.label} href={item.href} className="flex min-w-0 items-center justify-between gap-3 rounded-[0.9rem] border px-3 py-2.5 text-sm font-black leading-5" style={{ background: index === 0 ? "var(--surface-strong)" : "transparent", borderColor: index === 0 ? "color-mix(in srgb, var(--accent) 28%, var(--border))" : "transparent", color: "var(--text)" }}><span className="min-w-0 break-words">{item.label}</span><span className="shrink-0 text-sm" style={{ color: "var(--accent)" }}>Add</span></a>)}
              </div>
            ) : <p className="mt-3 text-sm font-bold leading-5" style={{ color: "var(--accent)" }}>Customers have the essential information they need.</p>}
          </section>

          <section className="rounded-[1.35rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-base font-black">Customer contact</h2>
            <dl className="mt-2 divide-y" style={{ borderColor: "var(--border)" }}>{[["Phone", form.phone || "Not added"], ["WhatsApp", form.whatsappNumber || "Not added"], ["Email", form.email || "Not added"], ["Website", form.websiteUrl || "Not added"]].map(([label, value]) => <div key={label} className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-2.5"><dt className="text-sm font-bold leading-6" style={{ color: "var(--muted)" }}>{label}</dt><dd className="min-w-0 break-words text-sm font-black leading-6 [overflow-wrap:anywhere] sm:text-right">{value}</dd></div>)}</dl>
          </section>

          <section className="rounded-[1.35rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-black">Complete your listing</h2><p className="mt-1 text-sm font-bold leading-5" style={{ color: "var(--muted)" }}>{getStatusLabel(business.subscriptionStatus)} plan</p></div><div className="flex flex-wrap gap-2"><Link href="/business-photos" prefetch className="rounded-full border px-3 py-2 whitespace-nowrap text-xs font-black" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Photos</Link><Link href="/business-menu" prefetch className="rounded-full border px-3 py-2 whitespace-nowrap text-xs font-black" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Menu</Link></div></div>
          </section>
        </aside>
      </div>

      {isDirty || saving || imageUploadInProgress ? <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[1.25rem] border p-2.5 sm:hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p className="min-w-0 truncate text-sm font-black">{imageUploadInProgress ? "Uploading image…" : saving ? "Saving changes…" : "Unsaved changes"}</p><button type="submit" form="business-profile-form" disabled={saving || imageUploadInProgress} className="rounded-full px-4 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-50" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>{saving ? "Saving…" : "Save"}</button></div> : null}
    </div>
  );
}
