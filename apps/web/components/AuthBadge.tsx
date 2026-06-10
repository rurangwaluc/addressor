type AuthBadgeProps = {
  children: React.ReactNode;
};

export default function AuthBadge({ children }: AuthBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.18em] shadow-sm"
      style={{
        background: "var(--accent-soft)",
        borderColor: "var(--border)",
        color: "var(--accent)",
      }}
    >
      <span
        className="h-2 w-2 rounded-full shadow-sm"
        style={{ background: "var(--accent)" }}
      />
      {children}
    </span>
  );
}