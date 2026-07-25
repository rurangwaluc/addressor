import Link from "next/link";

type FeaturedPlace = {
  name: string;
  type: string;
  location: string;
  text: string;
  image: string;
  note: string;
};

const mainPlace: FeaturedPlace = {
  name: "Nyungwe View Retreat",
  type: "Guest house",
  location: "Kiyovu, Kigali",
  text: "A calm stay idea with rooms, breakfast, and nature experiences people can understand before they contact.",
  image: "/landing/category-stays.webp",
  note: "Good for stays",
};

const places: FeaturedPlace[] = [
  {
    name: "Kigali Garden Table",
    type: "Restaurant",
    location: "Kimihurura, Kigali",
    text: "A relaxed food spot for lunch, dinner, and simple group plans.",
    image: "/landing/category-restaurants.webp",
    note: "Food nearby",
  },
  {
    name: "Rwanda Culture Night",
    type: "Event",
    location: "Kigali",
    text: "An evening idea for visitors and locals looking for what to do.",
    image: "/landing/category-events.webp",
    note: "This weekend",
  },
  {
    name: "Kigali Night Terrace",
    type: "Lounge",
    location: "Nyarutarama, Kigali",
    text: "A social evening place with atmosphere, music, and clear contact options.",
    image: "/landing/category-nightlife.webp",
    note: "Going out",
  },
];

function PlaceBadge({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/24 bg-white/14 px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl">
      {children}
    </span>
  );
}

export default function FeaturedPlacesSection() {
  return (
    <section id="featured-places" className="featured-places relative overflow-hidden">
      <style>{`
        .featured-places {
          --places-card: rgba(255,255,255,.92);
          --places-soft: rgba(255,255,255,.72);
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
          --places-text: #f6f6f6;
          --places-muted: rgba(246,246,246,.66);
          --places-border: rgba(246,246,246,.13);
        }

        .featured-place-main,
        .featured-place-small {
          transition:
            transform .28s ease,
            border-color .28s ease,
            box-shadow .28s ease;
        }

        .featured-place-main:hover,
        .featured-place-small:hover {
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
                Start with places that are easier to choose.
              </h2>
            </div>

            <p
              className="max-w-xl text-sm font-semibold leading-7 sm:text-base lg:text-lg lg:leading-8"
              style={{ color: "var(--places-muted)" }}
            >
              Clear place cards reduce guessing before people call, save, visit,
              or ask for more details.
            </p>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
            <article
              className="featured-place-main relative min-h-[30rem] overflow-hidden rounded-[1.6rem] border shadow-xl sm:min-h-[34rem] lg:min-h-full"
              style={{ borderColor: "var(--places-border)" }}
            >
              <img
                src={mainPlace.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.78)),linear-gradient(90deg,rgba(0,0,0,.64),rgba(0,0,0,.12))]" />

              <div className="relative flex min-h-[30rem] flex-col justify-between p-5 text-white sm:min-h-[34rem] sm:p-7 lg:min-h-full lg:p-8">
                <div className="flex items-start justify-between gap-3">
                  <PlaceBadge>{mainPlace.type}</PlaceBadge>

                  <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#292929]">
                    {mainPlace.note}
                  </span>
                </div>

                <div className="max-w-2xl">
                  <p className="text-sm font-bold text-white/70">{mainPlace.location}</p>

                  <h3 className="mt-2 text-[2.4rem] font-black leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
                    {mainPlace.name}
                  </h3>

                  <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
                    {mainPlace.text}
                  </p>
                </div>
              </div>
            </article>

            <div className="grid gap-4">
              {places.map((place) => (
                <article
                  key={place.name}
                  className="featured-place-small overflow-hidden rounded-[1.5rem] border shadow-xl"
                  style={{
                    background: "var(--places-soft)",
                    borderColor: "var(--places-border)",
                  }}
                >
                  <div className="grid min-h-[13.5rem] sm:grid-cols-[13.5rem_1fr] lg:min-h-[12.25rem]">
                    <div className="relative min-h-[12rem] overflow-hidden sm:min-h-full">
                      <img
                        src={place.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/28" />
                    </div>

                    <div className="flex flex-col justify-between p-4 sm:p-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full border px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.14em]"
                            style={{
                              borderColor: "var(--places-border)",
                              color: "var(--places-muted)",
                            }}
                          >
                            {place.type}
                          </span>

                          <span
                            className="rounded-full border px-3 py-1.5 text-[0.65rem] font-black"
                            style={{
                              borderColor: "var(--places-border)",
                              color: "var(--places-muted)",
                            }}
                          >
                            {place.note}
                          </span>
                        </div>

                        <h3 className="mt-4 text-2xl font-black leading-tight tracking-tight">
                          {place.name}
                        </h3>

                        <p
                          className="mt-1 text-xs font-bold"
                          style={{ color: "var(--places-muted)" }}
                        >
                          {place.location}
                        </p>
                      </div>

                      <p
                        className="mt-3 text-sm font-semibold leading-6"
                        style={{ color: "var(--places-muted)" }}
                      >
                        {place.text}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
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
              A small preview today. Later, this becomes a live list from real
              approved businesses.
            </p>

            <div className="flex flex-col gap-3 min-[430px]:flex-row">
              <Link
                href="#places"
                className="inline-flex items-center justify-center rounded-full bg-[#1ca8cb] px-6 py-4 text-sm font-black text-white transition hover:scale-[1.02]"
              >
                Find places
              </Link>

              <Link
                href="/business-onboarding"
                className="inline-flex items-center justify-center rounded-full border px-6 py-4 text-sm font-black transition hover:scale-[1.02]"
                style={{
                  borderColor: "var(--places-border)",
                  color: "var(--places-text)",
                }}
              >
                Add your business
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
