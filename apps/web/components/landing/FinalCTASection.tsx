import Link from "next/link";

export default function FinalCTASection() {
  return (
    <section className="final-cta relative z-20 overflow-visible">
      <style>{`
        .final-cta {
          --cta-primary: #1ca8cb;
          background: transparent;
          font-family: var(--font-quicksand), system-ui, sans-serif;
        }

        .final-cta-card {
          background-image:
            linear-gradient(90deg, rgba(22, 35, 55, .9), rgba(22, 35, 55, .7)),
            url("/landing/final-cta.webp");
          background-size: cover;
          background-position: center;
        }
      `}</style>

      <div className="relative mx-auto max-w-[96rem] px-2 pt-10 sm:px-5 sm:pt-14 lg:px-7">
        <div className="mx-auto max-w-[72rem]">
          <div className="final-cta-card relative -mb-24 overflow-hidden rounded-[1.7rem] px-5 py-10 text-center text-white shadow-2xl sm:-mb-28 sm:rounded-[2.25rem] sm:px-10 sm:py-14 lg:-mb-32 lg:px-16 lg:py-16">
            <div className="imigongo-pattern absolute inset-0 opacity-[0.08]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(28,168,203,.28),transparent_18rem)]" />

            <div className="relative z-10">
              <p className="inline-flex rounded-full border border-white/18 bg-white/10 px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.18em] backdrop-blur-xl">
                Ready when you are
              </p>

              <h2 className="mx-auto mt-5 max-w-4xl text-[2.25rem] font-black leading-[0.95] tracking-tight min-[390px]:text-[2.65rem] sm:text-5xl lg:text-6xl">
                Start discovering Rwanda with confidence.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/82 sm:text-base">
                Explore trusted places or list your business on Addressor.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 min-[430px]:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-black text-[#263f66] shadow-xl transition hover:scale-[1.02] min-[430px]:w-auto"
                >
                  Explore Addressor
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1ca8cb] text-white">
                    ↗
                  </span>
                </Link>

                <Link
                  href="/business-login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/24 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white/16 min-[430px]:w-auto"
                >
                  List your business
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}