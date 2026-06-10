"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthBadge from "@/components/AuthBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { apiRequest } from "@/lib/api";

type BusinessAccessItem = {
  businessId: string;
  branchId: string | null;
  role: "business_owner" | "business_admin" | "business_manager" | "business_staff";
  status: string;
};

type BusinessMeResponse = {
  ok: true;
  data: {
    userId: string;
    businesses: BusinessAccessItem[];
  };
};

const cards = [
  {
    title: "Business profile",
    text: "Manage name, category, description, contacts, photos, and trust details.",
  },
  {
    title: "Branches",
    text: "Add and manage multiple business branches across Kigali and Rwanda.",
  },
  {
    title: "Offers",
    text: "Post daily specials, packages, discounts, and limited-time promotions.",
  },
  {
    title: "Bookings",
    text: "Receive and manage customer reservations and activity requests.",
  },
  {
    title: "Events",
    text: "Publish upcoming events, nightlife activities, and experiences.",
  },
  {
    title: "Insights",
    text: "See views, leads, bookings, conversion signals, and revenue opportunities.",
  },
];

export default function BusinessDashboardPage() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessAccessItem[]>([]);

  useEffect(() => {
    async function checkBusinessAccess() {
      const token = localStorage.getItem("addressorAuthToken");

      if (!token) {
        setAllowed(false);
        setReady(true);
        return;
      }

      try {
        const response = await apiRequest<BusinessMeResponse>("/business/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setBusinesses(response.data.businesses);
        setAllowed(true);
      } catch {
        setAllowed(false);
      } finally {
        setReady(true);
      }
    }

    checkBusinessAccess();
  }, []);

  if (!ready) {
    return (
      <main className="min-h-screen p-6" style={{ background: "var(--bg)" }}>
        <div
          className="mx-auto h-64 max-w-5xl animate-pulse rounded-[2rem]"
          style={{ background: "var(--border)" }}
        />
      </main>
    );
  }

  if (!allowed) {
    return (
      <main
        className="grid min-h-screen place-items-center px-4"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="max-w-md rounded-[2rem] border p-6 text-center shadow-xl"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <AuthBadge>Business access</AuthBadge>

          <h1 className="mt-5 text-3xl font-black">
            Business access required
          </h1>

          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
            This area is only for verified business owners and approved business
            team members.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/business-login"
              className="rounded-2xl px-5 py-3 text-sm font-bold"
              style={{
                background: "var(--primary)",
                color: "var(--primary-text)",
              }}
            >
              Go to business login
            </Link>

            <Link
              href="/business-register"
              className="rounded-2xl border px-5 py-3 text-sm font-bold"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-strong)",
                color: "var(--text)",
              }}
            >
              Register business
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const primaryBusiness = businesses[0];

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="imigongo-pattern absolute inset-0 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(182,95,42,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(22,17,12,0.14),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        <nav
          className="flex items-center justify-between rounded-full border px-4 py-3 backdrop-blur-xl"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <p className="text-lg font-black tracking-tight">
              Addressor Business
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Business control room
              {primaryBusiness ? ` · ${primaryBusiness.role}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("addressorAuthToken");
                window.location.href = "/business-login";
              }}
              className="rounded-full border px-4 py-2 text-sm font-bold"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-strong)",
                color: "var(--text)",
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        <section className="grid min-h-[calc(100vh-7rem)] items-center gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <AuthBadge>Business owner tools</AuthBadge>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl">
              Turn visibility into real bookings.
            </h1>

            <p
              className="mt-6 max-w-xl text-base leading-8"
              style={{ color: "var(--muted)" }}
            >
              This is where businesses manage listings, branches, offers,
              events, availability, bookings, and trust signals on Addressor.
            </p>

            <div
              className="mt-6 rounded-3xl border p-5"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <p className="text-sm font-black" style={{ color: "var(--accent)" }}>
                Backend access verified
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                Access is checked through <strong>/business/me</strong>, so a
                normal customer token cannot enter this dashboard.
              </p>
            </div>
          </div>

          <div
            className="rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl sm:p-7"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border p-5"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p className="text-lg font-black">{card.title}</p>
                  <p
                    className="mt-2 text-sm leading-6"
                    style={{ color: "var(--muted)" }}
                  >
                    {card.text}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="mt-5 rounded-3xl border p-5"
              style={{
                background: "var(--accent-soft)",
                borderColor: "var(--border)",
              }}
            >
              <p className="text-sm font-black" style={{ color: "var(--accent)" }}>
                Business access
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text)" }}>
                You currently have access to{" "}
                <strong>{businesses.length}</strong>{" "}
                business{businesses.length === 1 ? "" : "es"}.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}