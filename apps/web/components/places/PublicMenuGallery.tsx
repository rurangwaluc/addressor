"use client";

import {
  ChevronLeft,
  ChevronRight,
  Expand,
  ExternalLink,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type MenuFile = {
  id: string;
  publicUrl: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
  createdAt: string;
};

export default function PublicMenuGallery({
  files,
  businessName,
}: {
  files: MenuFile[];
  businessName: string;
}) {
  const imageFiles = files.filter(
    (file) => file.contentType !== "application/pdf",
  );

  const pdfFiles = files.filter(
    (file) => file.contentType === "application/pdf",
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeFile =
    activeIndex === null ? null : imageFiles[activeIndex] ?? null;

  function closeViewer() {
    setActiveIndex(null);
  }

  function showPrevious() {
    if (activeIndex === null || imageFiles.length <= 1) return;

    setActiveIndex(
      activeIndex === 0 ? imageFiles.length - 1 : activeIndex - 1,
    );
  }

  function showNext() {
    if (activeIndex === null || imageFiles.length <= 1) return;

    setActiveIndex(
      activeIndex === imageFiles.length - 1 ? 0 : activeIndex + 1,
    );
  }

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex]);

  return (
    <>
      {imageFiles.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 md:grid-cols-3">
          {imageFiles.map((file, index) => (
            <button
              key={file.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group min-w-0 overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: "var(--surface-strong)",
                borderColor: "var(--border)",
              }}
              aria-label={`View menu page ${index + 1} in full`}
            >
              <div
                className="relative aspect-[3/4] overflow-hidden"
                style={{
                  background:
                    "color-mix(in srgb, var(--surface-strong) 88%, var(--bg))",
                }}
              >
                <img
                  src={file.publicUrl}
                  alt={`${businessName} menu page ${index + 1}`}
                  className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-[1.015]"
                />

                <span
                  className="absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-lg border backdrop-blur"
                  style={{
                    background:
                      "color-mix(in srgb, var(--surface-strong) 88%, transparent)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                >
                  <Expand size={17} aria-hidden="true" />
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-t px-3 py-3 sm:px-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    Menu page {index + 1}
                  </p>

                  <p
                    className="mt-0.5 text-xs font-bold"
                    style={{ color: "var(--muted)" }}
                  >
                    Tap to view full
                  </p>
                </div>

                <Expand
                  size={16}
                  aria-hidden="true"
                  className="shrink-0"
                  style={{ color: "var(--accent)" }}
                />
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {pdfFiles.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {pdfFiles.map((file, index) => (
            <a
              key={file.id}
              href={file.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-20 items-center justify-between gap-4 rounded-xl border px-4 py-4 transition hover:-translate-y-0.5"
              style={{
                background: "var(--surface-strong)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              <div className="min-w-0">
                <p className="text-sm font-black">
                  Menu document {index + 1}
                </p>

                <p
                  className="mt-1 text-xs font-bold"
                  style={{ color: "var(--muted)" }}
                >
                  Open full PDF
                </p>
              </div>

              <ExternalLink
                size={18}
                aria-hidden="true"
                className="shrink-0"
                style={{ color: "var(--accent)" }}
              />
            </a>
          ))}
        </div>
      ) : null}

      {activeFile ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewer();
            }
          }}
        >
          <div
            className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 px-4 sm:px-6"
            style={{
              paddingTop: "max(1rem, env(safe-area-inset-top))",
            }}
          >
            <div className="min-w-0 text-white">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                Menu
              </p>

              <p className="truncate text-sm font-black sm:text-base">
                Page {(activeIndex ?? 0) + 1} of {imageFiles.length}
              </p>
            </div>

            <button
              type="button"
              onClick={closeViewer}
              aria-label="Close menu viewer"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {imageFiles.length > 1 ? (
            <>
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Previous menu page"
                className="absolute left-2 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur sm:left-5"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={showNext}
                aria-label="Next menu page"
                className="absolute right-2 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur sm:right-5"
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </>
          ) : null}

          <div
            className="flex h-full w-full items-center justify-center px-3 sm:px-16"
            style={{
              paddingTop: "max(4.75rem, env(safe-area-inset-top))",
              paddingBottom:
                "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            <img
              src={activeFile.publicUrl}
              alt={`${businessName} menu page ${(activeIndex ?? 0) + 1}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
