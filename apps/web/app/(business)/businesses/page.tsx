"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import RequireAccess from "@/components/auth/RequireAccess";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/lib/api";
import {
  getBusinessId,
  getStoredActiveBusinessId,
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

function roleLabel(role: string) {
  if (role === "business_owner") return "Owner";
  if (role === "business_manager") return "Manager";
  return "Team member";
}

function statusLabel(status: string) {
  if (status === "approved") return "Approved";
  if (status === "draft") return "Needs review";
  return status;
}

export default function BusinessesPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState(
    () => getStoredActiveBusinessId(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBusinesses() {
      try {
        const response = await apiRequest<MyBusinessesResponse>("/businesses/my", {
          method: "GET",
        });

        if (!cancelled) {
          setBusinesses(response.data.businesses);
        }
      } catch {
        if (!cancelled) {
          setError("We could not load your businesses. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBusinesses();

    return () => {
      cancelled = true;
    };
  }, []);

  function manageBusiness(business: BusinessProfile) {
    const businessId = getBusinessId(business);

    if (!businessId) return;

    saveActiveBusinessId(businessId);
    setActiveBusinessId(businessId);
    router.push("/business-dashboard");
  }

  return (
    <RequireAccess mode="business">
      <main
        className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
        style={{ color: "var(--text)" }}
      >
        
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
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-contrast)",
                }}
              >
                A
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-black">
                  Your businesses
                </span>
                <span
                  className="block truncate text-xs font-bold"
                  style={{ color: "var(--muted)" }}
                >
                  Choose what you want to manage
                </span>
              </span>
            </Link>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <Link
                href="/business-onboarding"
                className="whitespace-nowrap rounded-full px-4 py-3 text-sm font-black"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-contrast)",
                }}
              >
                Add business
              </Link>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </nav>

          <section
            className="mt-5 rounded-[2rem] border p-5 shadow-2xl sm:p-7"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.24em]"
                  style={{ color: "var(--accent)" }}
                >
                  Business accounts
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                  Choose a business.
                </h1>

                <p
                  className="mt-3 max-w-2xl text-sm font-semibold leading-7"
                  style={{ color: "var(--muted)" }}
                >
                  Select the business you want to manage. Addressor will use it across the business dashboard and tools.
                </p>
              </div>

              <div
                className="rounded-[1.25rem] border px-4 py-3 text-sm font-black"
                style={{
                  background: "var(--surface-strong)",
                  borderColor: "var(--border)",
                }}
              >
                {businesses.length} business{businesses.length === 1 ? "" : "es"}
              </div>
            </div>

            {error ? (
              <p className="mt-5 rounded-[1rem] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300">
                {error}
              </p>
            ) : null}

            {loading ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-60 rounded-[1.5rem] border"
                    style={{
                      background: "var(--surface-strong)",
                      borderColor: "var(--border)",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {businesses.map((business) => {
                  const businessId = getBusinessId(business);
                  const isActive = businessId === activeBusinessId;
                  const location = [
                    business.sector,
                    business.district,
                    business.city,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <article
                      key={business.id}
                      className="overflow-hidden rounded-[1.75rem] border"
                      style={{
                        background: "var(--surface-strong)",
                        borderColor: isActive ? "var(--accent)" : "var(--border)",
                      }}
                    >
                      <div className="relative min-h-48">
                        {business.coverImageUrl ? (
                          <img
                            src={business.coverImageUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="absolute inset-0"
                            style={{ background: "var(--surface)" }}
                          />
                        )}

                        <div className="absolute inset-0 bg-black/45" />

                        <div className="relative flex min-h-48 flex-col justify-end p-5">
                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                                {business.category}
                              </p>

                              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">
                                {business.displayName}
                              </h2>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                              {isActive ? (
                                <span
                                  className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-black"
                                  style={{
                                    background: "var(--accent)",
                                    color: "var(--accent-contrast)",
                                  }}
                                >
                                  Current business
                                </span>
                              ) : null}

                              <span className="whitespace-nowrap rounded-full bg-white px-3 py-2 text-xs font-black text-[#263f66]">
                                {roleLabel(business.role)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="grid grid-cols-2 gap-3">
                          <div
                            className="rounded-[1rem] border p-3"
                            style={{
                              background: "var(--surface)",
                              borderColor: "var(--border)",
                            }}
                          >
                            <p
                              className="text-xs font-black uppercase tracking-[0.16em]"
                              style={{ color: "var(--muted)" }}
                            >
                              Status
                            </p>
                            <p className="mt-2 whitespace-nowrap text-sm font-black">
                              {statusLabel(business.verificationStatus)}
                            </p>
                          </div>

                          <div
                            className="rounded-[1rem] border p-3"
                            style={{
                              background: "var(--surface)",
                              borderColor: "var(--border)",
                            }}
                          >
                            <p
                              className="text-xs font-black uppercase tracking-[0.16em]"
                              style={{ color: "var(--muted)" }}
                            >
                              Location
                            </p>
                            <p className="mt-2 text-sm font-black">
                              {location || business.city || "Not added"}
                            </p>
                          </div>
                        </div>

                        <p
                          className="mt-4 line-clamp-2 text-sm font-semibold leading-6"
                          style={{ color: "var(--muted)" }}
                        >
                          {business.shortDescription ||
                            "Add a short description so customers understand this business faster."}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => manageBusiness(business)}
                            className="whitespace-nowrap rounded-full px-4 py-3 text-sm font-black transition hover:scale-[1.01]"
                            style={{
                              background: "var(--accent)",
                              color: "var(--accent-contrast)",
                            }}
                          >
                            {isActive ? "Open dashboard" : "Switch to business"}
                          </button>

                          <Link
                            href="/business-profile"
                            onClick={() => saveActiveBusinessId(business.id)}
                            className="whitespace-nowrap rounded-full border px-4 py-3 text-center text-sm font-black transition hover:scale-[1.01]"
                            style={{
                              borderColor: "var(--border)",
                              color: "var(--text)",
                            }}
                          >
                            Edit profile
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </RequireAccess>
  );
}
