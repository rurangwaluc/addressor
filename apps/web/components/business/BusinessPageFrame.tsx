type BusinessPageFrameProps = {
  title: string;
  eyebrow: string;
  subtitle: string;
  compact?: boolean;
  children: React.ReactNode;
};

export default function BusinessPageFrame({
  title,
  eyebrow,
  subtitle,
  compact = false,
  children,
}: BusinessPageFrameProps) {
  return (
    <>
      <section
        className={
          compact
            ? "rounded-[1.35rem] border px-5 py-4 sm:px-6 sm:py-5"
            : "rounded-[2rem] border p-5 sm:p-7 lg:p-8"
        }
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <p
          className="whitespace-nowrap text-xs font-black uppercase tracking-[0.24em]"
          style={{ color: "var(--accent)" }}
        >
          {eyebrow}
        </p>
        <h1
          className={
            compact
              ? "mt-2 text-2xl font-black tracking-[-0.05em] sm:text-3xl"
              : "mt-4 text-3xl font-black tracking-[-0.06em] sm:text-5xl"
          }
        >
          {title}
        </h1>
        <p
          className={
            compact
              ? "mt-2 max-w-2xl text-sm font-semibold leading-6"
              : "mt-4 max-w-2xl text-sm font-semibold leading-7 sm:text-base"
          }
          style={{ color: "var(--muted)" }}
        >
          {subtitle}
        </p>
      </section>

      <div className="mt-5">{children}</div>
    </>
  );
}
