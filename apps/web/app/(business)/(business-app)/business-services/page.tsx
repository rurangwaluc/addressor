"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { AccessContext } from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";
import { getStoredAccessContext } from "@/lib/authSession";
import { chooseActiveBusiness, getBusinessId } from "@/lib/businessSession";

type ServiceStatus = "active" | "inactive";
type PriceType = "fixed" | "starting_from" | "on_request";

type BusinessService = {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  priceType: PriceType;
  priceAmount: number | null;
  currency: "RWF";
  durationMinutes: number | null;
  imageUrl: string | null;
  status: ServiceStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type ServiceForm = {
  name: string;
  description: string;
  priceType: PriceType;
  priceAmount: string;
  durationValue: string;
  durationUnit: "minutes" | "hours";
  status: ServiceStatus;
};

type ApiResponse<T> = { ok: true; data: T };
type UploadResponse = ApiResponse<{
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
}>;

const servicesPerPage = 10;
const emptyForm: ServiceForm = {
  name: "",
  description: "",
  priceType: "fixed",
  priceAmount: "",
  durationValue: "",
  durationUnit: "minutes",
  status: "active",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error && typeof error === "object" && "error" in error && error.error &&
    typeof error.error === "object" && "message" in error.error &&
    typeof error.error.message === "string"
  ) return error.error.message;
  return fallback;
}

function formatPrice(service: BusinessService) {
  if (service.priceType === "on_request") return "Price on request";
  const amount = new Intl.NumberFormat("en").format(service.priceAmount ?? 0);
  return `${service.priceType === "starting_from" ? "From " : ""}RWF ${amount}`;
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} ${hours === 1 ? "hr" : "hrs"}${remainder ? ` ${remainder} min` : ""}`;
}

function serviceToForm(service: BusinessService): ServiceForm {
  const useHours = Boolean(service.durationMinutes && service.durationMinutes % 60 === 0);
  return {
    name: service.name,
    description: service.description ?? "",
    priceType: service.priceType,
    priceAmount: service.priceAmount === null ? "" : String(service.priceAmount),
    durationValue: service.durationMinutes
      ? String(useHours ? service.durationMinutes / 60 : service.durationMinutes)
      : "",
    durationUnit: useHours ? "hours" : "minutes",
    status: service.status,
  };
}

export default function BusinessServicesPage() {
  const [access] = useState<AccessContext | null>(() => getStoredAccessContext());
  const business = chooseActiveBusiness(access?.businesses);
  const businessId = getBusinessId(business);
  const capabilityKnown = Boolean(business?.capabilities);
  const enabled = business?.capabilities?.services ?? true;
  const [status, setStatus] = useState<ServiceStatus>("active");
  const [page, setPage] = useState(1);
  const [services, setServices] = useState<BusinessService[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState("");
  const [selectedService, setSelectedService] = useState<BusinessService | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [working, setWorking] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const requestId = useRef(0);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function loadServices(requestedStatus = status, requestedPage = page) {
    if (!businessId || !enabled) {
      setLoading(false);
      return;
    }
    const currentRequest = ++requestId.current;
    if (pagination) setRefreshing(true);
    else setLoading(true);
    setListError("");
    try {
      const response = await apiRequest<ApiResponse<{ services: BusinessService[]; pagination: Pagination }>>(
        `/businesses/${businessId}/services?status=${requestedStatus}&page=${requestedPage}&limit=${servicesPerPage}`,
      );
      if (currentRequest !== requestId.current) return;
      const validPage = Math.max(1, response.data.pagination.totalPages);
      if (requestedPage > validPage) {
        setPage(validPage);
        return;
      }
      setServices(response.data.services);
      setPagination(response.data.pagination);
    } catch (error) {
      if (currentRequest === requestId.current) {
        setListError(getErrorMessage(error, "We could not load your services."));
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    void loadServices(status, page);
    // Business, filter, and page define the current list request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, enabled, status, page]);

  useEffect(() => () => {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function openAdd() {
    setSelectedService(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    setConfirmDelete(false);
    setFormError("");
    setNotice("");
    setDrawerOpen(true);
  }

  function openEdit(service: BusinessService) {
    setSelectedService(service);
    setForm(serviceToForm(service));
    setImageFile(null);
    setImagePreview(service.imageUrl ?? "");
    setRemoveImage(false);
    setConfirmDelete(false);
    setFormError("");
    setNotice("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (working) return;
    setDrawerOpen(false);
    setConfirmDelete(false);
  }

  function chooseImage(file: File | null) {
    setFormError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setFormError("Service image must be 8 MB or smaller.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  function getPayload() {
    const amount = form.priceAmount.trim();
    if (!form.name.trim()) throw new Error("Enter a service name.");
    if (form.priceType !== "on_request" && (!amount || !Number.isInteger(Number(amount)) || Number(amount) <= 0)) {
      throw new Error("Enter a positive whole RWF price.");
    }
    const duration = form.durationValue.trim();
    if (duration && (!Number.isInteger(Number(duration)) || Number(duration) <= 0)) {
      throw new Error("Enter a positive whole duration.");
    }
    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      priceType: form.priceType,
      priceAmount: form.priceType === "on_request" ? null : Number(amount),
      currency: "RWF" as const,
      durationMinutes: duration
        ? Number(duration) * (form.durationUnit === "hours" ? 60 : 1)
        : null,
      status: form.status,
    };
  }

  async function uploadImage(serviceId: string, file: File) {
    const prepared = await apiRequest<UploadResponse>(
      `/businesses/${businessId}/services/${serviceId}/image-upload`,
      { method: "POST", body: JSON.stringify({ contentType: file.type, size: file.size }) },
    );
    const upload = await fetch(prepared.data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!upload.ok) throw new Error("The service was saved, but its image could not be uploaded.");
    const confirmed = await apiRequest<ApiResponse<{ service: BusinessService }>>(
      `/businesses/${businessId}/services/${serviceId}/image-confirm`,
      {
        method: "POST",
        body: JSON.stringify({ key: prepared.data.key, contentType: file.type, size: file.size }),
      },
    );
    return confirmed.data.service;
  }

  async function saveService() {
    setFormError("");
    setNotice("");
    let payload: ReturnType<typeof getPayload>;
    try {
      payload = getPayload();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Check the service details.");
      return;
    }
    setWorking(true);
    try {
      const response = await apiRequest<ApiResponse<{ service: BusinessService }>>(
        selectedService
          ? `/businesses/${businessId}/services/${selectedService.id}`
          : `/businesses/${businessId}/services`,
        { method: selectedService ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      let saved = response.data.service;
      if (removeImage && selectedService?.imageUrl) {
        const removed = await apiRequest<ApiResponse<{ service: BusinessService }>>(
          `/businesses/${businessId}/services/${saved.id}/image`,
          { method: "DELETE" },
        );
        saved = removed.data.service;
      }
      if (imageFile) saved = await uploadImage(saved.id, imageFile);
      setSelectedService(saved);
      await loadServices(status, page);
      setDrawerOpen(false);
    } catch (error) {
      setFormError(getErrorMessage(error, error instanceof Error ? error.message : "The service could not be saved."));
      if (!selectedService) {
        setNotice("If the service details were saved before the image failed, it remains available in your services list.");
        await loadServices(status, page);
      }
    } finally {
      setWorking(false);
    }
  }

  async function deleteService() {
    if (!selectedService) return;
    setWorking(true);
    setFormError("");
    try {
      await apiRequest(`/businesses/${businessId}/services/${selectedService.id}`, { method: "DELETE" });
      setDrawerOpen(false);
      await loadServices(status, page);
    } catch (error) {
      setFormError(getErrorMessage(error, "The service could not be deleted."));
    } finally {
      setWorking(false);
    }
  }

  function handleRowKey(event: KeyboardEvent<HTMLElement>, service: BusinessService) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEdit(service);
    }
  }

  const inputClass = "mt-2 w-full min-w-0 rounded-[0.9rem] border px-3.5 py-3 text-base font-bold outline-none focus:border-[var(--accent)]";

  return (
    <div className="grid w-full min-w-0 gap-4 sm:gap-5">
      <section className="min-w-0 rounded-[1.5rem] border p-4 sm:rounded-[1.75rem] sm:p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>Services</p><h1 className="mt-1 text-2xl font-black tracking-[-0.05em] sm:text-3xl">Manage what customers can ask for or book.</h1></div>
          <button type="button" onClick={openAdd} disabled={!businessId || !enabled} className="shrink-0 rounded-full px-3.5 py-2.5 whitespace-nowrap text-xs font-black disabled:opacity-50 sm:px-5 sm:py-3 sm:text-sm" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Add service</button>
        </div>
      </section>

      {!businessId ? <Message title="Choose a business first." text="Services need an active business." />
        : capabilityKnown && !enabled ? <Message title="Services are not enabled." text="This business does not currently use the Services feature." />
        : loading ? <Message title="Loading services…" text="Your business navigation remains available." loading />
        : listError ? <Message title="Services unavailable" text={listError} action={() => void loadServices()} />
        : <>
          <nav className="grid grid-cols-2 gap-1.5 rounded-[1.25rem] border p-1.5" aria-label="Service status" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {(["active", "inactive"] as ServiceStatus[]).map((nextStatus) => <button key={nextStatus} type="button" onClick={() => { setPage(1); setStatus(nextStatus); }} disabled={refreshing && status === nextStatus} className="rounded-[0.9rem] px-3 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-60" style={{ background: status === nextStatus ? "var(--accent)" : "transparent", color: status === nextStatus ? "var(--accent-contrast)" : "var(--text)" }}>{nextStatus === "active" ? "Active" : "Inactive"}</button>)}
          </nav>

          <section className="min-w-0 overflow-hidden rounded-[1.5rem] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="border-b px-4 py-3 sm:px-5" style={{ borderColor: "var(--border)" }}><h2 className="text-xl font-black">{status === "active" ? "Active services" : "Inactive services"}</h2><p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--muted)" }}>{pagination?.total ?? 0} {(pagination?.total ?? 0) === 1 ? "service" : "services"}</p></div>
            {services.length === 0 ? <div className="p-5 sm:p-6"><h3 className="text-lg font-black">{status === "active" ? "No active services yet." : "No inactive services."}</h3><p className="mt-1 text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>{status === "active" ? "Add the services customers can currently ask about or book." : "Services you hide from customers will appear here."}</p></div>
              : <div className="divide-y transition-opacity" aria-busy={refreshing} style={{ borderColor: "var(--border)", opacity: refreshing ? 0.68 : 1 }}>
                {services.map((service) => <article key={service.id} role="button" tabIndex={0} aria-label={`Edit ${service.name}`} onClick={() => openEdit(service)} onKeyDown={(event) => handleRowKey(event, service)} className="grid min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2.5 p-3.5 outline-none transition-colors hover:bg-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] sm:grid-cols-[3.5rem_minmax(0,1.4fr)_minmax(9rem,0.7fr)_auto] sm:items-center sm:p-4 lg:grid-cols-[4rem_minmax(0,1.5fr)_minmax(10rem,0.7fr)_minmax(7rem,0.45fr)_auto]">
                  {service.imageUrl ? <img src={service.imageUrl} alt="" className="col-start-2 row-span-2 h-12 w-12 rounded-[0.75rem] object-cover sm:col-start-1 sm:row-span-1 sm:h-14 sm:w-14" /> : <div className="hidden h-14 w-14 rounded-[0.75rem] sm:block" style={{ background: "var(--surface-strong)" }} />}
                  <div className="min-w-0"><div className="flex min-w-0 items-start gap-2"><h3 className="min-w-0 break-words text-base font-black leading-5 sm:text-lg">{service.name}</h3><span className="shrink-0 rounded-full px-2.5 py-1 whitespace-nowrap text-[0.68rem] font-black sm:hidden" style={{ background: service.status === "active" ? "color-mix(in srgb, var(--success) 14%, transparent)" : "var(--surface-strong)", color: service.status === "active" ? "var(--success)" : "var(--muted)" }}>{service.status === "active" ? "Active" : "Inactive"}</span></div><p className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-5" style={{ color: "var(--muted)" }}>{service.description || "No description added."}</p></div>
                  <div className="col-span-2 grid min-w-0 grid-cols-2 gap-3 sm:contents"><div className="min-w-0"><p className="text-[0.65rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Price</p><p className="mt-0.5 break-words text-sm font-black">{formatPrice(service)}</p></div>
                  {service.durationMinutes ? <div className="min-w-0"><p className="text-[0.65rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Duration</p><p className="mt-0.5 whitespace-nowrap text-sm font-black">{formatDuration(service.durationMinutes)}</p></div> : <div className="hidden lg:block" />}</div>
                  <span className="hidden shrink-0 rounded-full px-3 py-1.5 whitespace-nowrap text-xs font-black sm:block" style={{ background: service.status === "active" ? "color-mix(in srgb, var(--success) 14%, transparent)" : "var(--surface-strong)", color: service.status === "active" ? "var(--success)" : "var(--muted)" }}>{service.status === "active" ? "Active" : "Inactive"}</span>
                </article>)}
              </div>}
            {pagination && pagination.total > servicesPerPage ? <div className="flex min-w-0 flex-col gap-2 border-t px-4 py-3 min-[375px]:flex-row min-[375px]:items-center min-[375px]:justify-between sm:px-5" style={{ borderColor: "var(--border)" }}><p className="text-sm font-bold" style={{ color: "var(--muted)" }}>{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p><div className="grid grid-cols-2 gap-2"><button type="button" disabled={!pagination.hasPreviousPage || refreshing} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-full border px-3.5 py-2 whitespace-nowrap text-sm font-black disabled:opacity-45" style={{ borderColor: "var(--border)" }}>Previous</button><button type="button" disabled={!pagination.hasNextPage || refreshing} onClick={() => setPage((value) => value + 1)} className="rounded-full border px-3.5 py-2 whitespace-nowrap text-sm font-black disabled:opacity-45" style={{ borderColor: "var(--border)" }}>Next</button></div></div> : null}
          </section>
        </>}

      {drawerOpen ? <div className="fixed inset-0 z-50 flex min-w-0 justify-end" role="dialog" aria-modal="true" aria-label={selectedService ? "Edit service" : "Add service"}>
        <button type="button" className="absolute inset-0 bg-black/55" onClick={closeDrawer} aria-label="Close service drawer" />
        <section className="relative grid h-[100dvh] w-full min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border-l sm:max-w-[32rem]" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
          <header className="flex items-start justify-between gap-3 border-b p-4 sm:p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><div><p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>Services</p><h2 className="mt-1 text-2xl font-black">{selectedService ? "Edit service" : "Add service"}</h2></div><button type="button" onClick={closeDrawer} disabled={working} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xl font-black disabled:opacity-50" style={{ borderColor: "var(--border)" }} aria-label="Close">×</button></header>
          <div className="min-w-0 overflow-y-auto overscroll-contain p-4 pb-7 sm:p-5 sm:pb-8"><div className="grid min-w-0 gap-4">
            <label className="text-sm font-black">Service name<input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} maxLength={120} className={inputClass} style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} /></label>
            <label className="text-sm font-black">Description<textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} maxLength={1000} rows={4} className={`${inputClass} resize-y`} style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} /><span className="mt-1.5 block text-xs font-semibold leading-5" style={{ color: "var(--muted)" }}>Explain what customers receive in simple terms.</span></label>
            <fieldset><legend className="text-sm font-black">Price type</legend><div className="mt-2 grid gap-2 min-[400px]:grid-cols-3">{([ ["fixed", "Fixed price"], ["starting_from", "Starting from"], ["on_request", "Price on request"] ] as Array<[PriceType, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setForm((current) => ({ ...current, priceType: value, priceAmount: value === "on_request" ? "" : current.priceAmount }))} className="rounded-[0.9rem] border px-2.5 py-2.5 text-sm font-black" style={{ borderColor: form.priceType === value ? "var(--accent)" : "var(--border)", background: form.priceType === value ? "var(--accent-soft)" : "var(--surface)" }}>{label}</button>)}</div></fieldset>
            {form.priceType !== "on_request" ? <label className="text-sm font-black">Price in RWF<input type="number" min="1" step="1" inputMode="numeric" value={form.priceAmount} onChange={(event) => setForm((value) => ({ ...value, priceAmount: event.target.value }))} placeholder="15000" className={inputClass} style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} /><span className="mt-1.5 block text-xs font-semibold leading-5" style={{ color: "var(--muted)" }}>Enter a whole amount in Rwandan francs.</span></label> : null}
            <fieldset><legend className="text-sm font-black">Duration, optional</legend><div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(7.5rem,0.7fr)] gap-2"><input type="number" min="1" step="1" inputMode="numeric" value={form.durationValue} onChange={(event) => setForm((value) => ({ ...value, durationValue: event.target.value }))} placeholder="No duration" className="min-w-0 rounded-[0.9rem] border px-3.5 py-3 text-base font-bold outline-none" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} /><select value={form.durationUnit} onChange={(event) => setForm((value) => ({ ...value, durationUnit: event.target.value as ServiceForm["durationUnit"] }))} className="min-w-0 rounded-[0.9rem] border px-3 py-3 text-sm font-black" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}><option value="minutes">Minutes</option><option value="hours">Hours</option></select></div></fieldset>
            <div className="rounded-[1.2rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p className="text-sm font-black">Service image, optional</p><p className="mt-1 text-xs font-semibold leading-5" style={{ color: "var(--muted)" }}>JPG, PNG or WebP · up to 8 MB</p>{imagePreview && !removeImage ? <img src={imagePreview} alt="Service preview" className="mt-3 h-36 w-full rounded-[0.9rem] object-contain" style={{ background: "var(--surface-strong)" }} /> : null}<input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0] ?? null)} /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => imageInputRef.current?.click()} className="rounded-full border px-4 py-2.5 whitespace-nowrap text-sm font-black" style={{ borderColor: "var(--border)" }}>{imagePreview && !removeImage ? "Replace image" : "Choose image"}</button>{imagePreview && !removeImage ? <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); setRemoveImage(Boolean(selectedService?.imageUrl)); }} className="rounded-full px-3 py-2.5 whitespace-nowrap text-sm font-black" style={{ color: "var(--muted)" }}>Remove image</button> : null}</div></div>
            <label className="flex min-w-0 items-center justify-between gap-4 rounded-[1.2rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><span><span className="block text-sm font-black">Active service</span><span className="mt-1 block text-xs font-semibold leading-5" style={{ color: "var(--muted)" }}>{form.status === "active" ? "Visible to customers" : "Hidden from customers"}</span></span><input type="checkbox" checked={form.status === "active"} onChange={(event) => setForm((value) => ({ ...value, status: event.target.checked ? "active" : "inactive" }))} className="h-6 w-6 shrink-0 accent-[var(--accent)]" /></label>
            {formError ? <p role="alert" className="rounded-[1rem] border p-3 text-sm font-bold" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>{formError}</p> : null}{notice ? <p className="text-sm font-semibold leading-5" style={{ color: "var(--muted)" }}>{notice}</p> : null}
            {selectedService ? <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>{confirmDelete ? <div className="rounded-[1rem] border p-3" style={{ borderColor: "var(--danger)" }}><p className="text-sm font-black">Delete this service permanently?</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={working} onClick={() => setConfirmDelete(false)} className="rounded-full border px-3 py-2.5 whitespace-nowrap text-sm font-black" style={{ borderColor: "var(--border)" }}>Keep service</button><button type="button" disabled={working} onClick={() => void deleteService()} className="rounded-full px-3 py-2.5 whitespace-nowrap text-sm font-black text-white" style={{ background: "var(--danger)" }}>{working ? "Deleting…" : "Delete service"}</button></div></div> : <button type="button" onClick={() => setConfirmDelete(true)} className="px-1 py-2 text-sm font-black" style={{ color: "var(--danger)" }}>Delete service</button>}</div> : null}
          </div></div>
          <footer className="grid grid-cols-2 gap-2 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><button type="button" disabled={working} onClick={closeDrawer} className="rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black disabled:opacity-50" style={{ borderColor: "var(--border)" }}>Cancel</button><button type="button" disabled={working} onClick={() => void saveService()} className="rounded-full px-4 py-3 whitespace-nowrap text-sm font-black disabled:opacity-50" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>{working ? "Saving…" : selectedService ? "Save changes" : "Save service"}</button></footer>
        </section>
      </div> : null}
    </div>
  );
}

function Message({ title, text, loading = false, action }: { title: string; text: string; loading?: boolean; action?: () => void }) {
  return <section className="rounded-[1.5rem] border p-4 sm:p-5" aria-busy={loading || undefined} style={{ background: "var(--surface)", borderColor: "var(--border)" }}><h2 className="text-2xl font-black">{title}</h2><p className="mt-2 text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>{text}</p>{action ? <button type="button" onClick={action} className="mt-4 rounded-full px-4 py-2.5 whitespace-nowrap text-sm font-black" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Try again</button> : null}</section>;
}
