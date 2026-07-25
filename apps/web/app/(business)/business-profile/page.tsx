"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import RequireAccess from "@/components/auth/RequireAccess";
import LogoutButton from "@/components/auth/LogoutButton";
import BusinessNav from "@/components/business/BusinessNav";
import { apiRequest } from "@/lib/api";
import {
  getCurrentAccessContext,
  getStoredAccessContext,
  getStoredAccessToken,
  saveAccessContext,
} from "@/lib/authSession";
import type { AccessContext } from "@/lib/authRedirect";
import {
  chooseActiveBusiness,
  getBusinessId,
  saveActiveBusinessId,
} from "@/lib/businessSession";

type BusinessProfile = {
  id: string;
  displayName: string;
  legalName: string;
  slug: string;
  category: string;
  shortDescription: string | null;
  phone: string;
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
  data: {
    businesses: BusinessProfile[];
  };
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

const fallbackCover =
  "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1400&q=85";

function emptyForm(): ProfileForm {
  return {
    displayName: "",
    legalName: "",
    category: "Restaurant",
    shortDescription: "",
    phone: "",
    whatsappNumber: "",
    email: "",
    websiteUrl: "",
    city: "Kigali",
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
    category: business.category ?? "Restaurant",
    shortDescription: business.shortDescription ?? "",
    phone: business.phone ?? "",
    whatsappNumber: business.whatsappNumber ?? "",
    email: business.email ?? "",
    websiteUrl: business.websiteUrl ?? "",
    city: business.city ?? "Kigali",
    district: business.district ?? "",
    sector: business.sector ?? "",
    addressLine: business.addressLine ?? "",
    logoUrl: business.logoUrl ?? "",
    coverImageUrl: business.coverImageUrl ?? "",
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span
        className="whitespace-nowrap text-xs font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>

      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-[1.1rem] border px-4 py-3 text-sm font-bold outline-none transition focus:scale-[1.005]"
        style={{
          background: "var(--surface-strong)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span
        className="whitespace-nowrap text-xs font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full resize-none rounded-[1.1rem] border px-4 py-3 text-sm font-bold leading-6 outline-none transition focus:scale-[1.005]"
        style={{
          background: "var(--surface-strong)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      />
    </label>
  );
}

export default function BusinessProfilePage() {
  const [access, setAccess] = useState<AccessContext | null>(null);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(() => emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const cachedAccess = getStoredAccessContext();

      if (cachedAccess && !cancelled) {
        setAccess(cachedAccess);
      }

      try {
        const response = await apiRequest<MyBusinessesResponse>("/businesses/my", {
          method: "GET",
        });

        const selectedBusiness = chooseActiveBusiness(response.data.businesses);

        if (!cancelled) {
          setBusinesses(response.data.businesses);
          setBusiness(selectedBusiness);
          if (selectedBusiness) {
            setForm(formFromBusiness(selectedBusiness));
          }
        }

        const token = getStoredAccessToken();

        if (token) {
          const freshAccess = await getCurrentAccessContext(token);

          if (!cancelled) {
            setAccess(freshAccess);
          }
        }
      } catch {
        if (!cancelled) {
          setError("We could not load your business profile. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const locationText = useMemo(() => {
    return [form.addressLine, form.sector, form.district, form.city]
      .filter(Boolean)
      .join(", ");
  }, [form.addressLine, form.city, form.district, form.sector]);

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function switchBusiness(businessId: string) {
    const selectedBusiness = businesses.find(
      (item) => getBusinessId(item) === businessId,
    );

    if (!selectedBusiness) return;

    saveActiveBusinessId(businessId);
    setBusiness(selectedBusiness);
    setForm(formFromBusiness(selectedBusiness));
    setNotice("");
    setError("");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business) {
      setError("No business profile was found.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await apiRequest<UpdateBusinessResponse>(
        `/businesses/${business.id}/profile`,
        {
          method: "PATCH",
          body: JSON.stringify(form),
        },
      );

      const updatedBusiness = {
        ...response.data.business,
        role: business.role,
        teamStatus: business.teamStatus,
      };

      setBusiness(updatedBusiness);
      setBusinesses((current) =>
        current.map((item) =>
          item.id === updatedBusiness.id ? updatedBusiness : item,
        ),
      );
      setForm(formFromBusiness(response.data.business));
      saveAccessContext(response.data.access);
      setAccess(response.data.access);
      setNotice("Business profile saved.");
    } catch {
      setError("Profile was not saved. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAccess mode="business">
      <main
        className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
        style={{ background: "var(--background)", color: "var(--text)" }}
      >
        <div className="imigongo-pattern fixed inset-0 opacity-10" />

        <section className="relative mx-auto w-full max-w-7xl">
          <nav
            className="flex flex-col gap-3 rounded-[1.5rem] border p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <Link href="/business-dashboard" className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full whitespace-nowrap text-sm font-black"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-contrast)",
                }}
              >
                A
              </span>

              <span className="min-w-0">
                <span className="block truncate whitespace-nowrap text-sm font-black">
                  Business profile
                </span>
                <span
                  className="block truncate text-xs font-bold"
                  style={{ color: "var(--muted)" }}
                >
                  Public business details
                </span>
              </span>
            </Link>

            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
              {businesses.length > 1 ? (
                <label className="min-w-0">
                  <span className="sr-only">Switch business</span>
                  <select
                    value={business ? getBusinessId(business) : ""}
                    onChange={(event) => switchBusiness(event.target.value)}
                    className="max-w-[15rem] rounded-full border px-4 py-3 text-sm font-black outline-none"
                    style={{
                      background: "var(--surface-strong)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                  >
                    {businesses.map((item) => (
                      <option key={getBusinessId(item)} value={getBusinessId(item)}>
                        {item.displayName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <Link
                href="/businesses"
                className="rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                Switch business
              </Link>

              <Link
                href="/business-dashboard"
                className="rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                Dashboard
              </Link>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </nav>

          <BusinessNav />

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.72fr]">
            <form
              onSubmit={saveProfile}
              className="rounded-[2rem] border p-5 shadow-2xl sm:p-7"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p
                    className="whitespace-nowrap text-xs font-black uppercase tracking-[0.24em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Edit profile
                  </p>

                  <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                    Make the business clear.
                  </h1>

                  <p
                    className="mt-3 max-w-2xl text-sm font-semibold leading-7"
                    style={{ color: "var(--muted)" }}
                  >
                    These details help customers understand what the business is,
                    where it is, and how to contact it.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="rounded-full px-5 py-3 whitespace-nowrap text-sm font-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-contrast)",
                  }}
                >
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </div>

              {notice ? (
                <p
                  className="mt-5 rounded-[1rem] border px-4 py-3 whitespace-nowrap text-sm font-black"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--border)",
                    color: "var(--accent)",
                  }}
                >
                  {notice}
                </p>
              ) : null}

              {error ? (
                <p className="mt-5 rounded-[1rem] border border-red-500/40 bg-red-500/10 px-4 py-3 whitespace-nowrap text-sm font-black text-red-300">
                  {error}
                </p>
              ) : null}

              <div className="mt-7 grid gap-5">
                <section
                  className="rounded-[1.5rem] border p-4 sm:p-5"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--border)",
                  }}
                >
                  <h2 className="text-xl font-black tracking-[-0.04em]">
                    Business basics
                  </h2>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field
                      required
                      label="Business name"
                      value={form.displayName}
                      onChange={(value) => updateField("displayName", value)}
                      placeholder="Nyungwe View Retreat"
                    />

                    <Field
                      label="Legal name"
                      value={form.legalName}
                      onChange={(value) => updateField("legalName", value)}
                      placeholder="Registered business name"
                    />

                    <label className="block">
                      <span
                        className="whitespace-nowrap text-xs font-black uppercase tracking-[0.18em]"
                        style={{ color: "var(--muted)" }}
                      >
                        Business type
                      </span>

                      <select
                        value={form.category}
                        onChange={(event) =>
                          updateField("category", event.target.value)
                        }
                        className="mt-2 w-full rounded-[1.1rem] border px-4 py-3 text-sm font-bold outline-none"
                        style={{
                          background: "var(--surface-strong)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      >
                        {categories.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                    </label>

                    <Field
                      required
                      label="Main phone"
                      value={form.phone}
                      onChange={(value) => updateField("phone", value)}
                      placeholder="250788000000"
                    />
                  </div>

                  <div className="mt-4">
                    <TextArea
                      label="Short description"
                      value={form.shortDescription}
                      onChange={(value) => updateField("shortDescription", value)}
                      placeholder="A clear one or two sentence description customers can understand quickly."
                    />
                  </div>
                </section>

                <section
                  className="rounded-[1.5rem] border p-4 sm:p-5"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--border)",
                  }}
                >
                  <h2 className="text-xl font-black tracking-[-0.04em]">
                    Location and contact
                  </h2>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field
                      required
                      label="City"
                      value={form.city}
                      onChange={(value) => updateField("city", value)}
                      placeholder="Kigali"
                    />

                    <Field
                      label="District"
                      value={form.district}
                      onChange={(value) => updateField("district", value)}
                      placeholder="Nyarugenge"
                    />

                    <Field
                      label="Area"
                      value={form.sector}
                      onChange={(value) => updateField("sector", value)}
                      placeholder="Kiyovu"
                    />

                    <Field
                      label="Address hint"
                      value={form.addressLine}
                      onChange={(value) => updateField("addressLine", value)}
                      placeholder="Near KN 3 Avenue"
                    />

                    <Field
                      label="WhatsApp"
                      value={form.whatsappNumber}
                      onChange={(value) => updateField("whatsappNumber", value)}
                      placeholder="250788000000"
                    />

                    <Field
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(value) => updateField("email", value)}
                      placeholder="business@example.com"
                    />

                    <Field
                      label="Website"
                      value={form.websiteUrl}
                      onChange={(value) => updateField("websiteUrl", value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </section>

                <section
                  className="rounded-[1.5rem] border p-4 sm:p-5"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--border)",
                  }}
                >
                  <h2 className="text-xl font-black tracking-[-0.04em]">
                    Images
                  </h2>

                  <p
                    className="mt-2 text-sm font-semibold leading-6"
                    style={{ color: "var(--muted)" }}
                  >
                    Add image links for now. Later we will connect real uploads.
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Cover photo link"
                      value={form.coverImageUrl}
                      onChange={(value) => updateField("coverImageUrl", value)}
                      placeholder="https://..."
                    />

                    <Field
                      label="Logo link"
                      value={form.logoUrl}
                      onChange={(value) => updateField("logoUrl", value)}
                      placeholder="https://..."
                    />
                  </div>
                </section>
              </div>
            </form>

            <aside className="grid gap-5">
              <section
                className="overflow-hidden rounded-[2rem] border shadow-2xl"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="relative min-h-72">
                  <img
                    src={form.coverImageUrl || fallbackCover}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/48" />

                  <div className="relative flex min-h-72 flex-col justify-end p-5">
                    <div
                      className="grid h-16 w-16 place-items-center overflow-hidden rounded-[1.25rem] border text-xl font-black"
                      style={{
                        background: "var(--surface)",
                        borderColor: "rgba(255,255,255,0.28)",
                        color: "var(--text)",
                      }}
                    >
                      {form.logoUrl ? (
                        <img
                          src={form.logoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        form.displayName.slice(0, 1) || "A"
                      )}
                    </div>

                    <p className="mt-5 whitespace-nowrap text-xs font-black uppercase tracking-[0.2em] text-white/70">
                      {form.category || "Business"}
                    </p>

                    <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">
                      {form.displayName || "Business name"}
                    </h2>

                    <p className="mt-3 text-sm font-semibold leading-6 text-white/78">
                      {form.shortDescription ||
                        "A short description will help customers understand this place faster."}
                    </p>
                  </div>
                </div>
              </section>

              <section
                className="rounded-[2rem] border p-5 shadow-xl"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                <p
                  className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em]"
                  style={{ color: "var(--accent)" }}
                >
                  Customer preview
                </p>

                <div className="mt-5 grid gap-3">
                  {[
                    ["Location", locationText || "Add location"],
                    ["Phone", form.phone || "Add phone"],
                    ["WhatsApp", form.whatsappNumber || "Optional"],
                    ["Email", form.email || "Optional"],
                    ["Website", form.websiteUrl || "Optional"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[1.15rem] border p-4"
                      style={{
                        background: "var(--surface-strong)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <p
                        className="whitespace-nowrap text-xs font-black uppercase tracking-[0.16em]"
                        style={{ color: "var(--muted)" }}
                      >
                        {label}
                      </p>
                      <p className="mt-2 break-words whitespace-nowrap text-sm font-black">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section
                className="rounded-[2rem] border p-5 shadow-xl"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                <p
                  className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em]"
                  style={{ color: "var(--accent)" }}
                >
                  Next pages
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Photos", "/business-photos"],
                    ["Hours", "/business-hours"],
                    ["Settings", "/business-settings"],
                    ["Dashboard", "/business-dashboard"],
                  ].map(([label, href]) => (
                    <Link
                      key={label}
                      href={href}
                      className="rounded-[1.15rem] border p-4 whitespace-nowrap text-sm font-black"
                      style={{
                        background: "var(--surface-strong)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </RequireAccess>
  );
}
