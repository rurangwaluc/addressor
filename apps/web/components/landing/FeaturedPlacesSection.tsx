"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type FeaturedBusiness = {
  id: string;
  displayName: string;
  slug: string;
  category: string;
  shortDescription: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  city: string;
  district: string | null;
  sector: string | null;
  addressLine: string | null;
  verificationStatus: string;
  onboardingStatus: string;
  coverImageUrl: string | null;
  logoUrl: string | null;
};

type FeaturedResponse = {
  ok: true;
  data: {
    businesses: FeaturedBusiness[];
  };
};

function cleanPhone(value: string | null) {
  if (!value) return "";

  return value.replace(/[^\d+]/g, "");
}

function locationText(place: FeaturedBusiness) {
  return [place.sector, place.district, place.city].filter(Boolean).join(", ");
}

function fullLocationText(place: FeaturedBusiness) {
  return [place.addressLine, place.sector, place.district, place.city, "Rwanda"]
    .filter(Boolean)
    .join(", ");
}

function placeText(place: FeaturedBusiness) {
  return (
    place.shortDescription ||
    "Clear details help people decide faster before they call or visit."
  );
}

function trustText(place: FeaturedBusiness) {
  if (place.verificationStatus === "approved") return "Checked place";

  return "Recently added";
}

function phoneLink(place: FeaturedBusiness) {
  const phone = cleanPhone(place.phone);

  return phone ? `tel:${phone}` : "";
}

function whatsappLink(place: FeaturedBusiness) {
  const phone = cleanPhone(place.whatsappNumber || place.phone);

  if (!phone) return "";

  const message = encodeURIComponent(
    `Hello ${place.displayName}, I found you on Addressor and would like more details.`,
  );

  return `https://wa.me/${phone.replace(/^\+/, "")}?text=${message}`;
}

function mapLink(place: FeaturedBusiness) {
  const query = encodeURIComponent(`${place.displayName}, ${fullLocationText(place)}`);

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function EmptyFeaturedPlaces() {
  return (
    <div
      className="mt-7 rounded-[1.6rem] border p-5 sm:p-7 lg:p-9"
      style={{
        background: "var(--places-soft)",
        borderColor: "var(--places-border)",
      }}
    >
      <div className="max-w-3xl">
        <p
          className="text-xs font-black uppercase tracking-[0.16em]"
          style={{ color: "var(--places-primary)" }}
        >
          Places are coming
        </p>

        <h3 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
          Approved places will appear here.
        </h3>

        <p
          className="mt-3 max-w-2xl text-sm font-semibold leading-7 sm:text-base"
          style={{ color: "var(--places-muted)" }}
        >
          Addressor will only show real businesses that are ready for people to
          discover, compare, and contact.
        </p>

        <div className="mt-6 flex flex-col gap-3 min-[430px]:flex-row">
          <Link
            href="/business-onboarding"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#1ca8cb] px-6 py-4 text-sm font-black text-white transition hover:scale-[1.02]"
          >
            Add your business
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full border px-6 py-4 text-sm font-black transition hover:scale-[1.02]"
            style={{
              borderColor: "var(--places-border)",
              color: "var(--places-text)",
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlacePhoto({ place }: { place: FeaturedBusiness }) {
  if (place.coverImageUrl) {
    return (
      <img
        src={place.coverImageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
      />
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "var(--places-empty)" }}
    >
      <div className="absolute inset-0 opacity-25">
        <div className="imigongo-pattern h-full w-full" />
      </div>

      <div className="relative grid h-full place-items-center">
        <div className="grid h-20 w-20 place-items-center rounded-[1.4rem] bg-white/10 text-3xl font-black text-white ring-1 ring-white/16">
          {place.displayName.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  href,
  children,
  primary = false,
  external = false,
}: {
  href: string;
  children: string;
  primary?: boolean;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 py-3 text-sm font-black transition hover:scale-[1.02]"
        style={{
          background: primary ? "var(--places-primary)" : "transparent",
          border: primary ? "1px solid transparent" : "1px solid var(--places-border)",
          color: primary ? "white" : "var(--places-text)",
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 py-3 text-sm font-black transition hover:scale-[1.02]"
      style={{
        background: primary ? "var(--places-primary)" : "transparent",
        border: primary ? "1px solid transparent" : "1px solid var(--places-border)",
        color: primary ? "white" : "var(--places-text)",
      }}
    >
      {children}
    </a>
  );
}

function FeaturedPlaceCard({ place, wide = false }: { place: FeaturedBusiness; wide?: boolean }) {
  const call = phoneLink(place);
  const whatsapp = whatsappLink(place);
  const directions = mapLink(place);

  return (
    <article
      className={[
        "featured-place-card group overflow-hidden rounded-[1.6rem] border",
        wide ? "xl:min-h-[30rem]" : "",
      ].join(" ")}
      style={{
        background: "var(--places-soft)",
        borderColor: "var(--places-border)",
      }}
    >
      <div
        className={[
          "relative overflow-hidden",
          wide ? "min-h-[23rem] sm:min-h-[25rem] xl:min-h-[25.5rem]" : "min-h-[20rem]",
        ].join(" ")}
      >
        <PlacePhoto place={place} />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.78)),linear-gradient(90deg,rgba(0,0,0,.58),rgba(0,0,0,.08))]" />

        <div
          className={[
            "relative flex flex-col justify-between p-5 text-white sm:p-6",
            wide ? "min-h-[23rem] sm:min-h-[25rem] xl:min-h-[25.5rem]" : "min-h-[20rem]",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full border border-white/24 bg-white/14 px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl">
              {place.category}
            </span>

            <span className="whitespace-nowrap rounded-full bg-white px-3 py-2 text-xs font-black text-[#292929]">
              {trustText(place)}
            </span>
          </div>

          <div className={wide ? "max-w-3xl" : ""}>
            <p className="text-xs font-bold text-white/70 sm:text-sm">
              {locationText(place)}
            </p>

            <h3
              className={[
                "mt-1 font-black leading-tight tracking-tight",
                wide ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl lg:text-4xl",
              ].join(" ")}
            >
              {place.displayName}
            </h3>

            <p className="mt-2 line-clamp-2 max-w-xl text-sm font-semibold leading-6 text-white/80">
              {placeText(place)}
            </p>
          </div>
        </div>
      </div>

      <div
        className="border-t p-4"
        style={{ borderColor: "var(--places-border)" }}
      >
        <div className="grid gap-2 min-[430px]:grid-cols-2">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#1ca8cb] px-4 py-3 text-sm font-black text-white transition hover:scale-[1.02]"
          >
            View place
          </Link>

          <ActionButton href={directions} external>
            Directions
          </ActionButton>
        </div>

        <div className="mt-2 grid gap-2 min-[430px]:grid-cols-2">
          {call ? <ActionButton href={call}>Call</ActionButton> : null}

          {whatsapp ? (
            <ActionButton href={whatsapp} external>
              WhatsApp
            </ActionButton>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function FeaturedPlacesSection() {
  const [places, setPlaces] = useState<FeaturedBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      try {
        const response = await apiRequest<FeaturedResponse>("/businesses/featured", {
          method: "GET",
          skipAuth: true,
        });

        if (!cancelled) {
          setPlaces(response.data.businesses);
        }
      } catch {
        if (!cancelled) {
          setPlaces([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlaces();

    return () => {
      cancelled = true;
    };
  }, []);

  const gridClass =
    places.length === 1
      ? "mt-7 grid gap-4"
      : places.length === 2
        ? "mt-7 grid gap-4 lg:grid-cols-2"
        : "mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3";

  return (
    <section id="featured-places" className="featured-places relative overflow-hidden">
      <style>{`
        .featured-places {
          --places-card: rgba(255,255,255,.92);
          --places-soft: rgba(255,255,255,.72);
          --places-empty: #263f66;
          --places-text: #101010;
          --places-muted: rgba(16,16,16,.62);
          --places-border: rgba(16,16,16,.10);
          --places-primary: #1ca8cb;
          background: transparent;
          color: var(--places-text);
          font-family: var(--font-quicksand), system-ui, sans-serif;
        }

        .dark .featured-places,
        [data-theme="dark"] .featured-places {
          --places-card: rgba(41,41,41,.9);
          --places-soft: rgba(35,35,35,.76);
          --places-empty: #263f66;
          --places-text: #f6f6f6;
          --places-muted: rgba(246,246,246,.66);
          --places-border: rgba(246,246,246,.13);
        }

        .featured-place-card {
          transition:
            transform .28s ease,
            border-color .28s ease,
            box-shadow .28s ease;
        }

        .featured-place-card:hover {
          transform: translateY(-3px);
          border-color: rgba(28,168,203,.42);
          box-shadow: 0 24px 54px rgba(0,0,0,.18);
        }
      `}</style>

      <div className="relative mx-auto max-w-[96rem] px-2 pb-2 sm:px-5 sm:pb-5 lg:px-7">
        <div
          className="overflow-hidden rounded-[1.7rem] border p-4 shadow-2xl backdrop-blur-xl sm:rounded-[2.75rem] sm:p-6 md:p-7 lg:p-10"
          style={{
            background: "var(--places-card)",
            borderColor: "var(--places-border)",
          }}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_0.62fr] lg:items-end">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--places-primary)" }}
              >
                Featured places
              </p>

              <h2 className="mt-3 max-w-4xl text-[2.25rem] font-black leading-[0.94] tracking-tight min-[390px]:text-[2.65rem] sm:text-5xl lg:text-[4.35rem]">
                Real places. Clear next steps.
              </h2>
            </div>

            <p
              className="max-w-xl text-sm font-semibold leading-7 sm:text-base lg:text-lg lg:leading-8"
              style={{ color: "var(--places-muted)" }}
            >
              Choose faster, then call, message, or get directions without
              searching again.
            </p>
          </div>

          {loading ? (
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="min-h-[25rem] rounded-[1.6rem] border"
                  style={{
                    background: "var(--places-soft)",
                    borderColor: "var(--places-border)",
                  }}
                />
              ))}
            </div>
          ) : places.length === 0 ? (
            <EmptyFeaturedPlaces />
          ) : (
            <>
              <div className={gridClass}>
                {places.map((place) => (
                  <FeaturedPlaceCard
                    key={place.id}
                    place={place}
                    wide={places.length <= 2}
                  />
                ))}
              </div>

              <div
                className="mt-5 flex flex-col gap-3 rounded-[1.4rem] border p-4 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  background: "var(--places-soft)",
                  borderColor: "var(--places-border)",
                }}
              >
                <p
                  className="max-w-2xl text-sm font-semibold leading-6"
                  style={{ color: "var(--places-muted)" }}
                >
                  These cards come from real business profiles and help visitors
                  take action faster.
                </p>

                <Link
                  href="/business-onboarding"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-full border px-6 py-4 text-sm font-black transition hover:scale-[1.02]"
                  style={{
                    borderColor: "var(--places-border)",
                    color: "var(--places-text)",
                  }}
                >
                  Add your business
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
