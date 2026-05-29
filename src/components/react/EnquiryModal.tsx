import React, { useState, useEffect, useRef, useCallback } from "react";

interface EnquiryModalProps {
  apiEndpoint?: string;
}

export default function EnquiryModal({
  apiEndpoint = "/api/leads",
}: EnquiryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setIsOpen(true);
    setStatus("idle");
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    previousFocusRef.current?.focus();
  }, []);

  // Focus trap & keyboard handling
  useEffect(() => {
    if (!isOpen) return;
    firstInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  // Listen for custom event from Astro components
  useEffect(() => {
    const handler = () => open();
    document.addEventListener("open-enquiry-modal", handler);
    return () => document.removeEventListener("open-enquiry-modal", handler);
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "specialist_enquiry",
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          clinicName: formData.get("clinic"),
          message: formData.get("message"),
          sourceUrl: window.location.href,
          metadata: {
            location: formData.get("location"),
            role: formData.get("role"),
            formPage: window.location.pathname,
          },
        }),
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Enquiry form error:', errData);
        setStatus("error");
      }
    } catch (err) {
      console.error('Enquiry form error:', err);
      setStatus("error");
    }
  }

  return (
    <>
      {/* Floating CTA Button */}
      <button
        onClick={open}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-4 bg-[var(--ink)] text-white font-semibold rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-[var(--ink2)] hover:scale-105 transition-all"
        aria-label="Talk to a TMS Specialist"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="hidden sm:inline">Talk to a Specialist</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enquiry-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[rgba(10,22,40,0.60)] backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <div
            ref={modalRef}
            className="relative bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-lg animate-fade-in-up"
          >
            {/* Header */}
            <div className="bg-[var(--ink)] px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3
                className="text-lg font-semibold text-white"
                id="enquiry-modal-title"
              >
                Get Free TMS Guidance
              </h3>
              <button
                onClick={close}
                className="text-[rgba(10,22,40,0.2)] hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {status === "success" ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <p className="font-medium">
                    Thank you! A specialist will contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {status === "error" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                      Something went wrong. Please try again.
                    </div>
                  )}

                  <p className="text-sm text-[var(--muted)]">
                    Tell us about your situation. We'll connect you with a
                    verified TMS specialist.
                  </p>

                  <div>
                    <label
                      htmlFor="eq-name"
                      className="block text-sm font-medium text-[var(--ink2)]"
                    >
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      ref={firstInputRef}
                      type="text"
                      name="name"
                      id="eq-name"
                      required
                      aria-required="true"
                      className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-2 text-sm focus:border-[var(--ink2)] focus:ring-2 focus:ring-[rgba(10,22,40,0.15)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="eq-email"
                        className="block text-sm font-medium text-[var(--ink2)]"
                      >
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="eq-email"
                        required
                        aria-required="true"
                        className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-2 text-sm focus:border-[var(--ink2)] focus:ring-2 focus:ring-[rgba(10,22,40,0.15)]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="eq-phone"
                        className="block text-sm font-medium text-[var(--ink2)]"
                      >
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="eq-phone"
                        className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-2 text-sm focus:border-[var(--ink2)] focus:ring-[rgba(10,22,40,0.15)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="eq-location"
                        className="block text-sm font-medium text-[var(--ink2)]"
                      >
                        Location <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="location"
                        id="eq-location"
                        required
                        aria-required="true"
                        placeholder="City, State or ZIP"
                        className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-2 text-sm focus:border-[var(--ink2)] focus:ring-2 focus:ring-[rgba(10,22,40,0.15)]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="eq-clinic"
                        className="block text-sm font-medium text-[var(--ink2)]"
                      >
                        Clinic (optional)
                      </label>
                      <input
                        type="text"
                        name="clinic"
                        id="eq-clinic"
                        className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-2 text-sm focus:border-[var(--ink2)] focus:ring-[rgba(10,22,40,0.15)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="eq-role"
                      className="block text-sm font-medium text-[var(--ink2)]"
                    >
                      I am a... <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="role"
                      id="eq-role"
                      required
                      aria-required="true"
                      className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-2 text-sm focus:border-[var(--ink2)] focus:ring-2 focus:ring-[rgba(10,22,40,0.15)]"
                    >
                      <option value="">Select a role...</option>
                      <option>Patient looking for treatment</option>
                      <option>Caregiver / Family Member</option>
                      <option>Referring Doctor</option>
                      <option>Clinic Owner</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="eq-message"
                      className="block text-sm font-medium text-[var(--ink2)]"
                    >
                      How can we help?
                    </label>
                    <textarea
                      name="message"
                      id="eq-message"
                      rows={3}
                      required
                      className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-2 text-sm focus:border-[var(--ink2)] focus:ring-[rgba(10,22,40,0.15)]"
                      placeholder="I'm interested in TMS for depression..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--ink2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "submitting"
                      ? "Sending..."
                      : "Request Free Consultation"}
                  </button>
                  <p className="text-xs text-center text-[var(--muted)]">
                    Your information is secure and HIPAA compliant.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
