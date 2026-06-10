"use client";

type AsyncButtonProps = {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
};

export default function AsyncButton({
  children,
  loading = false,
  disabled = false,
  type = "submit",
  onClick,
}: AsyncButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="group relative w-full overflow-hidden rounded-[1.15rem] px-5 py-4 text-sm font-black transition duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background:
          "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 86%, var(--accent)))",
        color: "var(--primary-text)",
        boxShadow:
          "0 20px 45px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <span className="absolute inset-0 opacity-0 transition group-hover:opacity-10 bg-white" />
      <span className="absolute inset-x-8 top-0 h-px bg-white/25" />

      {loading ? (
        <span className="relative inline-flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Processing...
        </span>
      ) : (
        <span className="relative">{children}</span>
      )}
    </button>
  );
}