"use client";

import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import type { AccessContext } from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";
import { getStoredAccessContext } from "@/lib/authSession";
import { chooseActiveBusiness, getBusinessId } from "@/lib/businessSession";

type MenuFile = {
  id: string;
  publicUrl: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
  createdAt: string;
};

type MenuRevision = {
  id: string;
  status: "draft" | "published" | "unpublished" | "archived";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  files: MenuFile[];
};

type MenuState = {
  published: MenuRevision | null;
  draft: MenuRevision | null;
  unpublished: MenuRevision | null;
};

type ApiResponse<T> = { ok: true; data: T };
type UploadResponse = ApiResponse<{
  fileId: string;
  uploadUrl: string;
  expiresInSeconds: number;
}>;

type UploadProgress = {
  current: number;
  total: number;
  fileName: string;
};

const acceptedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const minimumMenuImageWidth = 900;
const minimumMenuImageHeight = 1200;
const minimumMenuImageRatio = 0.6;
const maximumMenuImageRatio = 0.85;
const maximumMenuImageSize = 8 * 1024 * 1024;
const maximumMenuPdfSize = 20 * 1024 * 1024;

type RejectedMenuFile = {
  name: string;
  message: string;
};

function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      reject(new Error("This menu image could not be read. Try another image or use a PDF."));
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });
}

async function validateMenuFile(file: File): Promise<RejectedMenuFile | null> {
  if (!acceptedTypes.includes(file.type)) {
    return {
      name: file.name,
      message: "Use a PDF, JPG, PNG, or WebP file.",
    };
  }

  if (file.type === "application/pdf") {
    return file.size > maximumMenuPdfSize
      ? { name: file.name, message: "Menu PDF must be 20 MB or smaller." }
      : null;
  }

  if (file.size > maximumMenuImageSize) {
    return { name: file.name, message: "Menu image must be 8 MB or smaller." };
  }

  if (!imageTypes.includes(file.type)) return null;

  try {
    const { width, height } = await readImageDimensions(file);
    if (width < minimumMenuImageWidth || height < minimumMenuImageHeight) {
      return {
        name: file.name,
        message: "This menu image is too small. Use an image at least 900 × 1200 px.",
      };
    }

    const ratio = width / height;
    if (ratio < minimumMenuImageRatio || ratio > maximumMenuImageRatio) {
      return {
        name: file.name,
        message: "This menu image is not the right shape. Upload a portrait menu image, or use a PDF.",
      };
    }
  } catch (error) {
    return {
      name: file.name,
      message:
        error instanceof Error
          ? error.message
          : "This menu image could not be read. Try another image or use a PDF.",
    };
  }

  return null;
}

function formatRejectedFiles(files: RejectedMenuFile[]) {
  return files.map((file) => `${file.name}: ${file.message}`).join(" ");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    error.error &&
    typeof error.error === "object" &&
    "message" in error.error &&
    typeof error.error.message === "string"
  ) {
    return error.error.message;
  }

  return fallback;
}

function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function UploadDropZone({
  active,
  compact = false,
  disabled,
  progress,
  onActivate,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  active: boolean;
  compact?: boolean;
  disabled: boolean;
  progress: UploadProgress | null;
  onActivate: () => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!disabled) onActivate();
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && onActivate()}
      onKeyDown={handleKeyDown}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`grid min-w-0 place-items-center rounded-[1.25rem] border border-dashed text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${compact ? "p-3.5 sm:p-4" : "p-5 sm:p-7"} ${disabled ? "cursor-wait opacity-70" : "cursor-pointer"}`}
      style={{
        background: active ? "var(--surface-strong)" : "transparent",
        borderColor: active ? "var(--accent)" : "var(--border)",
      }}
    >
      <p className={`${compact ? "text-base" : "text-xl sm:text-2xl"} max-w-full break-words font-black tracking-[-0.03em] [overflow-wrap:anywhere]`}>
        {progress ? (
          `Uploading ${progress.current} of ${progress.total} — ${progress.fileName}`
        ) : (
          <>
            <span className="hidden sm:inline">Drag menu files here or choose files</span>
            <span className="sm:hidden">Choose menu files</span>
          </>
        )}
      </p>
      <p className="mt-1.5 text-sm font-semibold leading-5" style={{ color: "var(--muted)" }}>
        PDF, JPG, PNG or WebP · Images at least 900 × 1200 px
      </p>
      <p className="mt-1 text-sm font-semibold leading-5" style={{ color: "var(--muted)" }}>
        Portrait menu images work best.
      </p>
    </div>
  );
}

function MenuPreview({ menu, label }: { menu: MenuRevision; label: string }) {
  return (
    <section
      className="min-w-0 overflow-hidden rounded-[1.5rem] border sm:rounded-[1.75rem]"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 sm:py-4" style={{ borderColor: "var(--border)" }}>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>{label}</p>
          <p className="mt-1 text-sm font-bold" style={{ color: "var(--muted)" }}>
            {menu.files.length} {menu.files.length === 1 ? "menu file" : "menu files"}
          </p>
        </div>
        <span className="rounded-full border px-3 py-1.5 whitespace-nowrap text-xs font-black" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
          {menu.status === "published" ? "Live" : menu.status === "draft" ? "Not live yet" : "Not published"}
        </span>
      </div>

      <div className="grid min-w-0 gap-4 p-3 sm:p-5">
        {menu.files.map((file, index) => (
          <article key={file.id} className="min-w-0 overflow-hidden rounded-[1.25rem] border" style={{ background: "var(--surface-strong)", borderColor: "var(--border)" }}>
            {file.contentType === "application/pdf" ? (
              <iframe
                src={file.publicUrl}
                title={`Menu PDF ${index + 1}`}
                className="h-[28rem] w-full max-w-full border-0 sm:h-[38rem]"
              />
            ) : (
              // Menu artwork often contains important edge-to-edge text, so it must not be cropped.
              <img
                src={file.publicUrl}
                alt={`Menu image ${index + 1}`}
                className="max-h-[42rem] w-full object-contain"
              />
            )}
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5 sm:px-4" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-black">{file.contentType === "application/pdf" ? "Menu document" : `Menu image ${index + 1}`}</span>
              <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>{formatFileSize(file.sizeBytes)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function BusinessMenuPage() {
  const [access] = useState<AccessContext | null>(() => getStoredAccessContext());
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploadDragActive, setIsUploadDragActive] = useState(false);
  const [canDragFiles, setCanDragFiles] = useState(false);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDragDepthRef = useRef(0);
  const business = chooseActiveBusiness(access?.businesses);
  const businessId = business ? getBusinessId(business) : "";

  async function loadMenu() {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setError("");
    try {
      const response = await apiRequest<ApiResponse<MenuState>>(`/businesses/${businessId}/menu`);
      setMenuState(response.data);
    } catch (nextError) {
      setError(getErrorMessage(nextError, "We could not load your menu."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenu();
    // The selected business is the only dependency that should reload menu state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const update = () => setCanDragFiles(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  async function getDraft() {
    if (menuState?.draft) return menuState.draft;
    const response = await apiRequest<ApiResponse<MenuRevision>>(
      `/businesses/${businessId}/menu/drafts`,
      { method: "POST" },
    );
    return response.data;
  }

  async function uploadFiles(files: FileList | File[] | null) {
    if (!files?.length || !businessId) return;

    setWorking(true);
    setError("");
    setNotice("");

    try {
      const selectedFiles = Array.from(files);
      const validationResults = await Promise.all(selectedFiles.map(validateMenuFile));
      const rejectedFiles = validationResults.filter(
        (result): result is RejectedMenuFile => result !== null,
      );
      const validFiles = selectedFiles.filter((_, index) => validationResults[index] === null);

      if (validFiles.length === 0) {
        setError(formatRejectedFiles(rejectedFiles));
        return;
      }

      const draft = await getDraft();
      if (draft.files.length + validFiles.length > 20) {
        throw new Error("A menu can contain up to 20 files.");
      }

      for (const [index, file] of validFiles.entries()) {
        let pendingFileId = "";
        setUploadProgress({
          current: index + 1,
          total: validFiles.length,
          fileName: file.name,
        });

        try {
          const upload = await apiRequest<UploadResponse>(
            `/businesses/${businessId}/menu/revisions/${draft.id}/upload`,
            {
              method: "POST",
              body: JSON.stringify({
                contentType: file.type,
                size: file.size,
                sortOrder: draft.files.length + index,
              }),
            },
          );
          pendingFileId = upload.data.fileId;
          const uploadResult = await fetch(upload.data.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadResult.ok) {
            throw new Error("A menu file could not be uploaded.");
          }

          await apiRequest(
            `/businesses/${businessId}/menu/revisions/${draft.id}/files/${pendingFileId}/confirm`,
            { method: "POST" },
          );
        } catch (uploadError) {
          if (pendingFileId) {
            try {
              await apiRequest(
                `/businesses/${businessId}/menu/revisions/${draft.id}/files/${pendingFileId}`,
                { method: "DELETE" },
              );
            } catch {
              // Preserve the original upload failure for the owner.
            }
          }

          throw uploadError;
        }
      }

      await loadMenu();
      setNotice("Your menu is uploaded and ready to publish.");
      if (rejectedFiles.length > 0) {
        setError(formatRejectedFiles(rejectedFiles));
      }
    } catch (nextError) {
      const message = getErrorMessage(
        nextError,
        nextError instanceof Error ? nextError.message : "Menu upload failed.",
      );
      await loadMenu();
      setError(message);
    } finally {
      setWorking(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleUploadDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (working) return;
    uploadDragDepthRef.current += 1;
    setIsUploadDragActive(true);
  }

  function handleUploadDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!working) event.dataTransfer.dropEffect = "copy";
  }

  function handleUploadDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (working) return;
    uploadDragDepthRef.current = Math.max(0, uploadDragDepthRef.current - 1);
    if (uploadDragDepthRef.current === 0) setIsUploadDragActive(false);
  }

  function handleUploadDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    uploadDragDepthRef.current = 0;
    setIsUploadDragActive(false);
    if (!working) void uploadFiles(Array.from(event.dataTransfer.files));
  }

  async function removeFile(revisionId: string, fileId: string) {
    setWorking(true);
    setError("");
    try {
      await apiRequest(`/businesses/${businessId}/menu/revisions/${revisionId}/files/${fileId}`, { method: "DELETE" });
      await loadMenu();
      setNotice("Menu file removed.");
    } catch (nextError) {
      setError(getErrorMessage(nextError, "The menu file could not be removed."));
    } finally {
      setWorking(false);
    }
  }

  function setDraftFiles(files: MenuFile[]) {
    setMenuState((current) =>
      current?.draft
        ? {
            ...current,
            draft: {
              ...current.draft,
              files: files.map((file, sortOrder) => ({ ...file, sortOrder })),
            },
          }
        : current,
    );
  }

  async function saveDraftOrder(nextFiles: MenuFile[], previousFiles: MenuFile[]) {
    const draft = menuState?.draft;
    if (!draft || working || nextFiles.length < 2) return;

    setDraftFiles(nextFiles);
    setWorking(true);
    setError("");
    setNotice("");

    try {
      const response = await apiRequest<ApiResponse<MenuRevision>>(
        `/businesses/${businessId}/menu/revisions/${draft.id}/files/order`,
        {
          method: "PATCH",
          body: JSON.stringify({ fileIds: nextFiles.map((file) => file.id) }),
        },
      );
      setMenuState((current) =>
        current ? { ...current, draft: response.data } : current,
      );
      setNotice("Menu file order saved.");
    } catch (nextError) {
      setDraftFiles(previousFiles);
      setError(getErrorMessage(nextError, "The menu file order could not be saved."));
    } finally {
      setWorking(false);
    }
  }

  function moveDraftFile(fileId: string, direction: -1 | 1) {
    const files = menuState?.draft?.files ?? [];
    const currentIndex = files.findIndex((file) => file.id === fileId);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= files.length) return;

    const nextFiles = [...files];
    const [movedFile] = nextFiles.splice(currentIndex, 1);
    if (!movedFile) return;
    nextFiles.splice(nextIndex, 0, movedFile);
    void saveDraftOrder(nextFiles, files);
  }

  function handleFileDrop(event: DragEvent<HTMLElement>, targetFileId: string) {
    event.preventDefault();
    const sourceFileId = draggedFileId;
    setDraggedFileId(null);

    if (!sourceFileId || sourceFileId === targetFileId) return;

    const files = menuState?.draft?.files ?? [];
    const sourceIndex = files.findIndex((file) => file.id === sourceFileId);
    const targetIndex = files.findIndex((file) => file.id === targetFileId);

    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextFiles = [...files];
    const [movedFile] = nextFiles.splice(sourceIndex, 1);
    if (!movedFile) return;
    nextFiles.splice(targetIndex, 0, movedFile);
    void saveDraftOrder(nextFiles, files);
  }

  async function publish(revisionId: string) {
    setWorking(true);
    setError("");
    try {
      await apiRequest(`/businesses/${businessId}/menu/revisions/${revisionId}/publish`, { method: "POST" });
      await loadMenu();
      setNotice("Your menu is now published.");
    } catch (nextError) {
      setError(getErrorMessage(nextError, "The menu could not be published."));
    } finally {
      setWorking(false);
    }
  }

  async function unpublish() {
    setWorking(true);
    setError("");
    try {
      await apiRequest(`/businesses/${businessId}/menu/unpublish`, { method: "POST" });
      await loadMenu();
      setNotice("Your menu is no longer public.");
    } catch (nextError) {
      setError(getErrorMessage(nextError, "The menu could not be unpublished."));
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return <section className="rounded-[1.5rem] border p-5 sm:p-7" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><h1 className="text-3xl font-black">Loading your menu…</h1><p className="mt-2 text-sm font-bold" style={{ color: "var(--muted)" }}>Your business navigation remains available.</p></section>;
  }

  if (!businessId) {
    return <section className="rounded-[1.5rem] border p-5 sm:p-7" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><h1 className="text-3xl font-black">Choose a business first.</h1></section>;
  }

  const published = menuState?.published ?? null;
  const draft = menuState?.draft ?? null;
  const unpublished = menuState?.unpublished ?? null;
  const retained = published ?? unpublished;
  const status = published
    ? "Published"
    : draft?.files.length
      ? "Ready to publish"
      : draft
        ? "Upload needed"
        : unpublished
          ? "Unpublished"
          : "No menu";

  return (
    <div className="grid w-full min-w-0 gap-4 sm:gap-5">
      <input ref={fileInputRef} type="file" className="hidden" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => void uploadFiles(event.target.files)} />

      <section className="min-w-0 rounded-[1.5rem] border p-4 sm:rounded-[1.75rem] sm:p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>Menu</p>
              <span className="rounded-full border px-3 py-1 whitespace-nowrap text-xs font-black" style={{ borderColor: "var(--border)" }}>{status}</span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Share the menu you already use.</h1>
            <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-6 sm:text-base" style={{ color: "var(--muted)" }}>
              Upload a PDF or clear menu images. Replacements stay private until you publish them.
            </p>
          </div>
          {(retained || draft) && (
            <button type="button" disabled={working} onClick={() => fileInputRef.current?.click()} className="w-full rounded-full px-5 py-3 whitespace-nowrap text-sm font-black disabled:opacity-60 sm:w-auto" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>
              {uploadProgress
                ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}`
                : draft
                  ? "Add menu files"
                  : "Replace menu"}
            </button>
          )}
        </div>

        {(error || notice) && <p className="mt-3 rounded-[1rem] border px-4 py-3 text-sm font-bold leading-5" role={error ? "alert" : "status"} style={{ borderColor: error ? "#b91c1c" : "var(--border)", color: error ? "#ef4444" : "var(--text)", background: "var(--surface-strong)" }}>{error || notice}</p>}
      </section>

      {draft && (
        <section className="min-w-0 rounded-[1.5rem] border p-4 sm:rounded-[1.75rem] sm:p-5" style={{ background: "var(--surface)", borderColor: "var(--accent)" }}>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-2"><p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>{published ? (draft.files.length ? "Replacement ready" : "Replacement draft") : "Menu draft"}</p><span className="text-xs font-bold" style={{ color: "var(--muted)" }}>{draft.files.length} {draft.files.length === 1 ? "menu file" : "menu files"}</span></div><h2 className="mt-1.5 text-2xl font-black tracking-[-0.04em]">Review before publishing</h2><p className="mt-1.5 text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>{published ? "Your current menu stays live until you publish this replacement." : "Customers cannot see this menu until you publish it."}</p></div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <button type="button" disabled={working} onClick={() => fileInputRef.current?.click()} className="rounded-full border px-4 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-60" style={{ borderColor: "var(--border)" }}>Add menu files</button>
              <button type="button" disabled={working || draft.files.length === 0} onClick={() => void publish(draft.id)} className="rounded-full px-4 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-60" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Publish{published ? " replacement" : ""}</button>
            </div>
          </div>

          <div className="mt-4">
            <UploadDropZone
              active={isUploadDragActive}
              compact
              disabled={working}
              progress={uploadProgress}
              onActivate={() => fileInputRef.current?.click()}
              onDragEnter={handleUploadDragEnter}
              onDragOver={handleUploadDragOver}
              onDragLeave={handleUploadDragLeave}
              onDrop={handleUploadDrop}
            />
          </div>

          {draft.files.length > 0 ? (
            <div className="mt-3 grid items-stretch gap-3 sm:grid-cols-2">
              {draft.files.map((file, index) => (
                <article
                  key={file.id}
                  onDragOver={(event) => {
                    if (draggedFileId) event.preventDefault();
                  }}
                  onDrop={(event) => handleFileDrop(event, file.id)}
                  className={`grid h-full min-w-0 grid-rows-[1fr_auto] overflow-hidden rounded-[1.2rem] border ${draggedFileId === file.id ? "opacity-60" : ""}`}
                  style={{
                    background: "transparent",
                    borderColor: draggedFileId === file.id ? "var(--accent)" : "var(--border)",
                  }}
                >
                  {file.contentType === "application/pdf" ? (
                    <div className="grid h-56 place-items-center overflow-hidden p-4 text-center sm:h-64 lg:h-80" style={{ background: "var(--surface-strong)" }}>
                      <span className="text-lg font-black">Menu PDF</span>
                    </div>
                  ) : (
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open Menu image ${index + 1} full size`}
                      className="grid h-full min-h-56 min-w-0 place-items-center p-2 sm:min-h-64 sm:p-3"
                      style={{ background: "var(--surface-strong)" }}
                    >
                      <img
                        src={file.publicUrl}
                        alt={`Draft menu image ${index + 1}`}
                        className="h-auto max-h-[28rem] w-auto max-w-full object-contain sm:max-h-[32rem] lg:max-h-[36rem]"
                      />
                    </a>
                  )}

                  <div className="grid min-h-[6.25rem] min-w-0 grid-rows-[auto_auto] content-between gap-1.5 border-t px-3 py-2.5" style={{ borderColor: "var(--border)" }}>
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="min-w-0 text-sm font-black">
                        {file.contentType === "application/pdf"
                          ? "Menu PDF"
                          : `Menu image ${index + 1}`}
                      </span>
                      <button
                        type="button"
                        draggable={canDragFiles && !working}
                        disabled={!canDragFiles || working}
                        onDragStart={(event) => {
                          setDraggedFileId(file.id);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", file.id);
                        }}
                        onDragEnd={() => setDraggedFileId(null)}
                        className="hidden shrink-0 cursor-grab px-2 py-1.5 whitespace-nowrap text-xs font-black active:cursor-grabbing md:inline-flex disabled:cursor-default disabled:opacity-50"
                        style={{ color: "var(--muted)" }}
                        aria-label={`Drag ${file.contentType === "application/pdf" ? "menu document" : `menu image ${index + 1}`} to reorder`}
                      >
                        Drag to reorder
                      </button>
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={working || index === 0}
                        onClick={() => moveDraftFile(file.id, -1)}
                        className="rounded-full border px-3 py-1.5 whitespace-nowrap text-xs font-black disabled:opacity-40"
                        style={{ borderColor: "var(--border)" }}
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        disabled={working || index === draft.files.length - 1}
                        onClick={() => moveDraftFile(file.id, 1)}
                        className="rounded-full border px-3 py-1.5 whitespace-nowrap text-xs font-black disabled:opacity-40"
                        style={{ borderColor: "var(--border)" }}
                      >
                        Move down
                      </button>
                      <button
                        type="button"
                        draggable={false}
                        disabled={working}
                        onClick={() => void removeFile(draft.id, file.id)}
                        className="ml-auto shrink-0 whitespace-nowrap px-1 py-1.5 text-xs font-black"
                        style={{ color: "var(--accent)" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-[1.2rem] border p-4 text-sm font-bold" style={{ background: "var(--surface-strong)", borderColor: "var(--border)", color: "var(--muted)" }}>
              Choose a PDF or menu images to complete this draft.
            </p>
          )}
        </section>
      )}

      {published && <div className="grid min-w-0 gap-3"><div className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-1"><div><h2 className="text-xl font-black">Current public menu</h2><p className="mt-1 text-sm font-semibold" style={{ color: "var(--muted)" }}>This is what customers can open now.</p></div><div className="flex flex-wrap gap-2"><a href={published.files[0]?.publicUrl} target="_blank" rel="noreferrer" className="rounded-full border px-4 py-2.5 whitespace-nowrap text-sm font-black" style={{ borderColor: "var(--border)" }}>View public menu</a><button type="button" disabled={working} onClick={() => void unpublish()} className="rounded-full border px-4 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-60" style={{ borderColor: "var(--border)" }}>Unpublish</button></div></div><MenuPreview menu={published} label="Published menu" /></div>}

      {!published && unpublished && <div className="grid min-w-0 gap-3"><div className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-1"><div><h2 className="text-xl font-black">Saved menu</h2><p className="mt-1 text-sm font-semibold" style={{ color: "var(--muted)" }}>This menu is retained but customers cannot see it.</p></div><button type="button" disabled={working} onClick={() => void publish(unpublished.id)} className="rounded-full px-4 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-60" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Publish again</button></div><MenuPreview menu={unpublished} label="Unpublished menu" /></div>}

      {!published && !draft && !unpublished && !error && (
        <section className="rounded-[1.5rem] border p-4 sm:p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-3 text-center">
            <h2 className="text-2xl font-black">No menu uploaded yet.</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>
              Use the menu your business already has. One PDF or a set of clear images is enough.
            </p>
          </div>
          <UploadDropZone
            active={isUploadDragActive}
            disabled={working}
            progress={uploadProgress}
            onActivate={() => fileInputRef.current?.click()}
            onDragEnter={handleUploadDragEnter}
            onDragOver={handleUploadDragOver}
            onDragLeave={handleUploadDragLeave}
            onDrop={handleUploadDrop}
          />
        </section>
      )}
    </div>
  );
}
