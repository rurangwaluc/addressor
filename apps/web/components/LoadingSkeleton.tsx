export default function LoadingSkeleton() {
  return (
    <div
      className="rounded-[2rem] border p-5 shadow-2xl"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="space-y-4">
        <div
          className="h-8 w-40 animate-pulse rounded-full"
          style={{ background: "var(--border)" }}
        />
        <div
          className="h-12 w-4/5 animate-pulse rounded-2xl"
          style={{ background: "var(--border)" }}
        />
        <div
          className="h-4 w-full animate-pulse rounded-full"
          style={{ background: "var(--border)" }}
        />
        <div
          className="h-4 w-3/4 animate-pulse rounded-full"
          style={{ background: "var(--border)" }}
        />
        <div
          className="h-14 w-full animate-pulse rounded-2xl"
          style={{ background: "var(--border)" }}
        />
        <div
          className="h-14 w-full animate-pulse rounded-2xl"
          style={{ background: "var(--border)" }}
        />
      </div>
    </div>
  );
}