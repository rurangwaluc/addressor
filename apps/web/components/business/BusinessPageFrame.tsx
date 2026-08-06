type BusinessPageFrameProps = {
  title: string;
  eyebrow: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function BusinessPageFrame({
  title,
  eyebrow,
  subtitle,
  children,
}: BusinessPageFrameProps) {
  return (
    <>
      <section
        className="rounded-[2rem] border p-5 sm:p-7 lg:p-8"
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
        <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] sm:text-5xl">
          {title}
        </h1>
        <p
          className="mt-4 max-w-2xl text-sm font-semibold leading-7 sm:text-base"
          style={{ color: "var(--muted)" }}
        >
          {subtitle}
        </p>
      </section>

      <div className="mt-5">{children}</div>
    </>
  );
}
