import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import PublicOrderAction from "@/components/places/PublicOrderAction";
import PublicBookingAction from "@/components/places/PublicBookingAction";
import PublicMenuGallery from "@/components/places/PublicMenuGallery";
import { cache } from "react";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Globe2,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";

type PublicBusiness = {
  id: string;
  displayName: string;
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
  logoUrl: string | null;
  coverImageUrl: string | null;
};

type Capabilities = {
  menu: boolean;
  services: boolean;
  products: boolean;
  bookings: boolean;
  orders: boolean;
};

type PublicBusinessResponse = {
  ok: true;
  data: {
    business: PublicBusiness;
    capabilities: Capabilities;
    booking: {
      enabled: boolean;
      label: string | null;
      instructions: string | null;
      minimumAdvanceMinutes: number | null;
      maximumAdvanceDays: number | null;
    };
    ordering: {
      enabled: boolean;
      instructions: string | null;
    };
  };
};

type MenuFile = {
  id: string;
  publicUrl: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
  createdAt: string;
};

type MenuResponse = {
  ok: true;
  data: {
    menu: {
      id: string;
      status: string;
      publishedAt: string | null;
      files: MenuFile[];
    } | null;
  };
};

type PublicService = {
  id: string;
  name: string;
  description: string | null;
  priceType: string;
  priceAmount: string | number | null;
  currency: string;
  durationMinutes: number | null;
  imageUrl: string | null;
  sortOrder: number;
};

type ServicesResponse = {
  ok: true;
  data: {
    services: PublicService[];
    pagination: {
      total: number;
    };
  };
};

type PublicReview = {
  id: string;
  customerName: string;
  rating: number;
  body: string | null;
  interactionType: "order" | "booking";
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PublicReviewsResponse = {
  ok: true;
  data: {
    summary: {
      reviewCount: number;
      averageRating: number | null;
      distribution: Record<1 | 2 | 3 | 4 | 5, number>;
    };
    reviews: PublicReview[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
  };
};

async function fetchPublic<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Public request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

const getPublicBusiness = cache(async (slug: string) => {
  const response = await fetch(
    `${API_BASE}/businesses/public/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Business request failed with ${response.status}`);
  }

  return (await response.json()) as PublicBusinessResponse;
});

function cleanPhone(value: string | null) {
  return value?.replace(/[^\d+]/g, "") ?? "";
}

function locationText(business: PublicBusiness) {
  return [business.sector, business.district, business.city]
    .filter(Boolean)
    .join(", ");
}

function fullLocationText(business: PublicBusiness) {
  const values = [
    business.addressLine,
    business.sector,
    business.district,
    business.city,
    business.country,
  ].filter((value): value is string => Boolean(value?.trim()));

  const seen = new Set<string>();
  const parts: string[] = [];

  for (const value of values) {
    for (const part of value.split(",").map((item) => item.trim()).filter(Boolean)) {
      const key = part.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        parts.push(part);
      }
    }
  }

  return parts.join(", ");
}

function whatsappLink(business: PublicBusiness) {
  const phone = cleanPhone(business.whatsappNumber || business.phone);

  if (!phone) return "";

  const message = encodeURIComponent(
    `Hello ${business.displayName}, I found you on Addressor and would like more details.`,
  );

  return `https://wa.me/${phone.replace(/^\+/, "")}?text=${message}`;
}

function directionsLink(business: PublicBusiness) {
  const query = encodeURIComponent(
    `${business.displayName}, ${fullLocationText(business)}`,
  );

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function safeWebsite(value: string | null) {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function formatPrice(service: PublicService) {
  if (service.priceType === "on_request" || service.priceAmount === null) {
    return "Price on request";
  }

  const value = Number(service.priceAmount);

  if (!Number.isFinite(value)) {
    return "Price on request";
  }

  const amount = new Intl.NumberFormat("en-RW", {
    maximumFractionDigits: 0,
  }).format(value);

  if (service.priceType === "starting_from") {
    return `From ${service.currency} ${amount}`;
  }

  return `${service.currency} ${amount}`;
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en-RW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function PublicStars({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          fill={value <= rating ? "currentColor" : "none"}
          aria-hidden="true"
          style={{
            color:
              value <= rating
                ? "var(--accent)"
                : "color-mix(in srgb, var(--muted) 42%, transparent)",
          }}
        />
      ))}
    </div>
  );
}

function ActionLink({
  href,
  children,
  icon,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5"
      style={{
        background: "var(--surface-strong)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
    >
      {icon}
      <span>{children}</span>
    </a>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const response = await getPublicBusiness(slug);
    const business = response?.data.business;

    if (!business) {
      return {
        title: "Place not found | Addressor",
      };
    }

    return {
      title: `${business.displayName} | Addressor`,
      description:
        business.shortDescription ||
        `Find ${business.displayName} on Addressor.`,
    };
  } catch {
    return {
      title: "Addressor",
    };
  }
}

export default async function PublicPlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const response = await getPublicBusiness(slug);

  if (!response) {
    notFound();
  }

  const { business, capabilities, booking, ordering } = response.data;

  const [menuResult, servicesResult, reviewsResult] =
    await Promise.allSettled([
      capabilities.menu
        ? fetchPublic<MenuResponse>(`/businesses/${business.id}/menu/public`)
        : Promise.resolve(null),
      capabilities.services
        ? fetchPublic<ServicesResponse>(
            `/businesses/${business.id}/services/public?page=1&limit=20`,
          )
        : Promise.resolve(null),
      fetchPublic<PublicReviewsResponse>(
        `/businesses/public/${encodeURIComponent(
          business.slug,
        )}/reviews?page=1&limit=10`,
      ),
    ]);

  const menu =
    menuResult.status === "fulfilled" ? menuResult.value?.data.menu ?? null : null;

  const services =
    servicesResult.status === "fulfilled"
      ? servicesResult.value?.data.services ?? []
      : [];

  const reviewsData =
    reviewsResult.status === "fulfilled" ? reviewsResult.value.data : null;

  const phone = cleanPhone(business.phone);
  const whatsapp = whatsappLink(business);
  const directions = directionsLink(business);
  const website = safeWebsite(business.websiteUrl);

  return (
    <main
      className="min-h-screen overflow-x-clip pb-20 lg:pb-0"
      style={{
        background: "transparent",
        color: "var(--text)",
      }}
    >
      <header
        className="border-b"
        style={{
          background: "var(--surface-strong)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto flex min-h-16 max-w-[82rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-black tracking-[-0.04em]"
          >
            Addressor
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="hidden whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-black md:inline-flex"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
            >
              Explore
            </Link>

            <ThemeToggle />

            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black"
              style={{
                background: "var(--accent)",
                color: "var(--primary-text)",
              }}
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[82rem] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
        <section
          className="overflow-hidden rounded-[1.2rem] border"
          style={{
            background: "var(--surface-strong)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="relative min-h-[14rem] overflow-hidden min-[430px]:min-h-[17rem] sm:min-h-[20rem] lg:min-h-[23rem] xl:min-h-[25rem]"
            style={{
              background: "#06182c",
            }}
          >
            {business.coverImageUrl ? (
              <img
                src={business.coverImageUrl}
                alt={`${business.displayName} cover`}
                className="absolute inset-0 h-full w-full object-contain sm:object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <span
                  className="text-7xl font-black"
                  style={{ color: "var(--muted)" }}
                >
                  {business.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="grid min-w-0 gap-7 px-4 pb-5 sm:px-6 sm:pb-7 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end lg:gap-10 lg:px-8">
            <div className="min-w-0">
              <div className="-mt-10 sm:-mt-12">
                <div
                  className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-xl border-[4px] text-2xl font-black sm:h-24 sm:w-24"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--surface-strong)",
                  }}
                >
                  {business.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt={`${business.displayName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    business.displayName.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span
                  className="text-xs font-black uppercase tracking-[0.16em]"
                  style={{ color: "var(--accent)" }}
                >
                  {business.category}
                </span>

                <span
                  className="inline-flex items-center gap-1.5 text-xs font-black"
                  style={{ color: "var(--muted)" }}
                >
                  <BadgeCheck
                    size={15}
                    aria-hidden="true"
                    style={{ color: "var(--success)" }}
                  />
                  Checked place
                </span>

                {reviewsData?.summary.reviewCount ? (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-black"
                    style={{ color: "var(--muted)" }}
                  >
                    <Star
                      size={14}
                      fill="currentColor"
                      aria-hidden="true"
                      style={{ color: "var(--accent)" }}
                    />
                    {reviewsData.summary.averageRating?.toFixed(1)} / 5
                    <span aria-hidden="true">·</span>
                    {reviewsData.summary.reviewCount}{" "}
                    {reviewsData.summary.reviewCount === 1 ? "review" : "reviews"}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-2 max-w-4xl text-3xl font-black leading-[1.06] tracking-[-0.045em] sm:text-4xl lg:text-[2.8rem] xl:text-5xl">
                {business.displayName}
              </h1>

              <p
                className="mt-3 flex items-start gap-2 text-sm font-bold sm:text-base"
                style={{ color: "var(--muted)" }}
              >
                <MapPin
                  size={17}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                />
                <span>{locationText(business)}</span>
              </p>

              {business.shortDescription ? (
                <p
                  className="mt-4 max-w-3xl text-sm font-semibold leading-7 sm:text-base"
                  style={{ color: "var(--muted)" }}
                >
                  {business.shortDescription}
                </p>
              ) : null}

              {ordering.enabled || booking.enabled ? (
                <div
                  className={[
                    "mt-5 grid min-w-0 gap-3",
                    ordering.enabled && booking.enabled
                      ? "sm:grid-cols-2"
                      : "sm:max-w-[31rem]",
                  ].join(" ")}
                >
                  {ordering.enabled ? (
                    <PublicOrderAction
                      businessId={business.id}
                      businessName={business.displayName}
                      slug={business.slug}
                      instructions={ordering.instructions}
                      embedded
                    />
                  ) : null}

                  {booking.enabled ? (
                    <PublicBookingAction
                      businessId={business.id}
                      businessName={business.displayName}
                      slug={business.slug}
                      label={booking.label}
                      instructions={booking.instructions}
                      minimumAdvanceMinutes={
                        booking.minimumAdvanceMinutes
                      }
                      maximumAdvanceDays={booking.maximumAdvanceDays}
                      services={services.map((service) => ({
                        id: service.id,
                        name: service.name,
                        durationMinutes: service.durationMinutes,
                      }))}
                      primary={!ordering.enabled}
                      embedded
                      mobileStickyEnabled={!ordering.enabled}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="grid min-w-0 gap-2 min-[430px]:grid-cols-2 lg:grid-cols-1">
              {phone ? (
                <ActionLink
                  href={`tel:${phone}`}
                  icon={<Phone size={16} aria-hidden="true" />}
                >
                  Call
                </ActionLink>
              ) : null}

              {whatsapp ? (
                <ActionLink
                  href={whatsapp}
                  icon={<MessageCircle size={16} aria-hidden="true" />}
                  external
                >
                  WhatsApp
                </ActionLink>
              ) : null}

              <ActionLink
                href={directions}
                icon={<MapPin size={16} aria-hidden="true" />}
                external
              >
                Directions
              </ActionLink>

              {website ? (
                <ActionLink
                  href={website}
                  icon={<Globe2 size={16} aria-hidden="true" />}
                  external
                >
                  Website
                </ActionLink>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-8 grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-10">
          <div className="grid min-w-0 gap-10">
            {capabilities.menu ? (
              <section className="min-w-0">
                <div
                  className="flex flex-wrap items-end justify-between gap-3 border-b pb-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div>
                    <p
                      className="text-xs font-black uppercase tracking-[0.16em]"
                      style={{ color: "var(--accent)" }}
                    >
                      Menu
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                      Current menu
                    </h2>
                  </div>

                  {menu?.files.length ? (
                    <p
                      className="text-xs font-bold"
                      style={{ color: "var(--muted)" }}
                    >
                      {menu.files.length}{" "}
                      {menu.files.length === 1 ? "menu page" : "menu pages"}
                    </p>
                  ) : null}
                </div>

                {menu?.files.length ? (
                  <PublicMenuGallery
                    files={menu.files}
                    businessName={business.displayName}
                  />
                ) : (
                  <div
                    className="mt-4 border-y py-5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p className="text-sm font-black">
                      Menu not available yet
                    </p>

                    <p
                      className="mt-1 text-sm font-semibold leading-6"
                      style={{ color: "var(--muted)" }}
                    >
                      Contact the business directly for current menu details.
                    </p>
                  </div>
                )}
              </section>
            ) : null}

            {capabilities.services && services.length ? (
              <section className="min-w-0">
                <div
                  className="border-b pb-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="text-xs font-black uppercase tracking-[0.16em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Services
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                    Services available here
                  </h2>
                </div>

                <div
                  className="divide-y"
                  style={{ borderColor: "var(--border)" }}
                >
                  {services.map((service) => (
                    <article
                      key={service.id}
                      className="grid min-w-0 gap-4 py-5 first:pt-5 md:grid-cols-[6.5rem_minmax(0,1fr)_auto] md:items-center"
                    >
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt=""
                          className="h-24 w-full rounded-lg object-cover sm:h-20 sm:w-24"
                        />
                      ) : (
                        <div
                          className="hidden h-20 w-24 rounded-lg sm:block"
                          style={{ background: "var(--surface-strong)" }}
                        />
                      )}

                      <div className="min-w-0">
                        <h3 className="text-base font-black">
                          {service.name}
                        </h3>

                        {service.description ? (
                          <p
                            className="mt-1 text-sm font-semibold leading-6"
                            style={{ color: "var(--muted)" }}
                          >
                            {service.description}
                          </p>
                        ) : null}

                        {service.durationMinutes ? (
                          <p
                            className="mt-1 text-xs font-bold"
                            style={{ color: "var(--muted)" }}
                          >
                            {service.durationMinutes} minutes
                          </p>
                        ) : null}
                      </div>

                      <p className="whitespace-nowrap text-sm font-black">
                        {formatPrice(service)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="min-w-0">
            <section
              className="rounded-xl border p-5 sm:p-6 xl:sticky xl:top-24"
              style={{
                background: "var(--surface-strong)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.16em]"
                  style={{ color: "var(--accent)" }}
                >
                  Visit & contact
                </p>

                <h2 className="mt-1 text-xl font-black tracking-[-0.035em]">
                  Business details
                </h2>
              </div>

              <div
                className="mt-5 divide-y"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="py-4 first:pt-0">
                  <p
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em]"
                    style={{ color: "var(--muted)" }}
                  >
                    <MapPin size={14} aria-hidden="true" />
                    Address
                  </p>

                  <p className="mt-2 text-sm font-bold leading-6">
                    {fullLocationText(business)}
                  </p>
                </div>

                {business.phone ? (
                  <div className="py-4">
                    <p
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em]"
                      style={{ color: "var(--muted)" }}
                    >
                      <Phone size={14} aria-hidden="true" />
                      Phone
                    </p>

                    <a
                      href={`tel:${phone}`}
                      className="mt-2 block break-words text-sm font-black"
                      style={{ color: "var(--accent)" }}
                    >
                      {business.phone}
                    </a>
                  </div>
                ) : null}

                {business.email ? (
                  <div className="py-4">
                    <p
                      className="text-xs font-black uppercase tracking-[0.1em]"
                      style={{ color: "var(--muted)" }}
                    >
                      Email
                    </p>

                    <a
                      href={`mailto:${business.email}`}
                      className="mt-2 block break-words text-sm font-black"
                      style={{ color: "var(--accent)" }}
                    >
                      {business.email}
                    </a>
                  </div>
                ) : null}

                {ordering.enabled ? (
                  <div className="py-4 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: "var(--success)" }}
                      />

                      <p className="text-sm font-black">
                        Accepting order requests
                      </p>
                    </div>

                    {ordering.instructions ? (
                      <p
                        className="mt-2 text-sm font-semibold leading-6"
                        style={{ color: "var(--muted)" }}
                      >
                        {ordering.instructions}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>

            {reviewsData ? (
              <section className="mt-10 min-w-0">
                <div
                  className="flex flex-wrap items-end justify-between gap-3 border-b pb-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div>
                    <p
                      className="text-xs font-black uppercase tracking-[0.16em]"
                      style={{ color: "var(--accent)" }}
                    >
                      Reviews
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                      Verified customer experiences
                    </h2>
                  </div>

                  {reviewsData.summary.reviewCount > 0 ? (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-2xl font-black tracking-[-0.04em]">
                          {reviewsData.summary.averageRating?.toFixed(1)}
                        </span>
                        <Star
                          size={19}
                          fill="currentColor"
                          aria-hidden="true"
                          style={{ color: "var(--accent)" }}
                        />
                      </div>
                      <p
                        className="mt-0.5 text-xs font-bold"
                        style={{ color: "var(--muted)" }}
                      >
                        {reviewsData.summary.reviewCount} verified{" "}
                        {reviewsData.summary.reviewCount === 1
                          ? "experience"
                          : "experiences"}
                      </p>
                    </div>
                  ) : null}
                </div>

                {reviewsData.summary.reviewCount === 0 ? (
                  <div
                    className="border-b py-6"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p className="text-sm font-black">
                      No verified reviews yet
                    </p>
                    <p
                      className="mt-1 max-w-xl text-sm font-semibold leading-6"
                      style={{ color: "var(--muted)" }}
                    >
                      Reviews appear after customers complete an Addressor
                      order or booking.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 py-5 md:grid-cols-[14rem_minmax(0,1fr)]">
                      <div>
                        <p
                          className="text-xs font-black uppercase tracking-[0.12em]"
                          style={{ color: "var(--muted)" }}
                        >
                          Rating breakdown
                        </p>

                        <div className="mt-3 space-y-2">
                          {([5, 4, 3, 2, 1] as const).map((rating) => {
                            const count =
                              reviewsData.summary.distribution[rating] ?? 0;
                            const percent =
                              reviewsData.summary.reviewCount > 0
                                ? Math.round(
                                    (count /
                                      reviewsData.summary.reviewCount) *
                                      100,
                                  )
                                : 0;

                            return (
                              <div
                                key={rating}
                                className="grid grid-cols-[2rem_minmax(0,1fr)_1.8rem] items-center gap-2"
                              >
                                <span className="text-xs font-black">
                                  {rating} ★
                                </span>

                                <div
                                  className="h-1.5 overflow-hidden rounded-full"
                                  style={{
                                    background: "var(--surface-strong)",
                                  }}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${percent}%`,
                                      background: "var(--accent)",
                                    }}
                                  />
                                </div>

                                <span
                                  className="text-right text-xs font-bold"
                                  style={{ color: "var(--muted)" }}
                                >
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <p
                        className="text-sm font-semibold leading-6"
                        style={{ color: "var(--muted)" }}
                      >
                        Every review is linked to a completed Addressor order
                        or booking. Businesses can reply, but cannot change
                        customer ratings or feedback.
                      </p>
                    </div>

                    <div
                      className="divide-y divide-[var(--border)] border-t"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {reviewsData.reviews.map((review) => (
                        <article key={review.id} className="py-5 first:pt-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-black">
                                {review.customerName}
                              </p>

                              <p
                                className="mt-0.5 text-xs font-bold"
                                style={{ color: "var(--success)" }}
                              >
                                Verified{" "}
                                {review.interactionType === "order"
                                  ? "order"
                                  : "booking"}{" "}
                                / {formatReviewDate(review.createdAt)}
                              </p>
                            </div>

                            <PublicStars rating={review.rating} />
                          </div>

                          {review.body ? (
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-7">
                              {review.body}
                            </p>
                          ) : (
                            <p
                              className="mt-3 text-sm font-semibold"
                              style={{ color: "var(--muted)" }}
                            >
                              {review.rating}-star rating
                            </p>
                          )}

                          {review.ownerReply ? (
                            <div
                              className="mt-4 border-l-2 pl-4"
                              style={{ borderColor: "var(--accent)" }}
                            >
                              <p
                                className="text-xs font-black uppercase tracking-[0.1em]"
                                style={{ color: "var(--muted)" }}
                              >
                                Response from {business.displayName}
                              </p>

                              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold leading-6">
                                {review.ownerReply}
                              </p>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </section>
            ) : null}
      </div>

      <footer
        className="mt-8 border-t"
        style={{
          background: "var(--surface-strong)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto flex max-w-[82rem] flex-col gap-4 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-lg font-black tracking-[-0.04em]"
          >
            Addressor
          </Link>

          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold"
            style={{ color: "var(--muted)" }}
          >
            <Link href="/">Explore places</Link>
            <Link href="/business-onboarding">List your place</Link>
            <Link href="/login">Login</Link>
          </div>

          <p
            className="text-xs font-bold sm:text-right"
            style={{ color: "var(--muted)" }}
          >
            © 2026 Addressor
          </p>
        </div>
      </footer>
    </main>
  );
}
