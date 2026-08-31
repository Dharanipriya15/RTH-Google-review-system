"use client";

import { useId, useState } from "react";
import type { FeedbackFieldErrors, Rating } from "@/lib/feedback/types";
import { submitFeedback } from "@/lib/feedback/submit-feedback";

interface FeedbackFormProps {
  businessSlug: string;
  rating: Rating;
  isLowRating: boolean;
  onSuccess: (result: {
    outcome: "thank_you" | "redirect_to_google";
    redirectUrl: string | null;
  }) => void;
}

const MESSAGE_MAX = 2000;
const NAME_MAX = 120;
const PHONE_MAX = 32;

export function FeedbackForm({
  businessSlug,
  rating,
  isLowRating,
  onSuccess,
}: FeedbackFormProps) {
  const fieldId = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FeedbackFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FeedbackFieldErrors {
    const next: FeedbackFieldErrors = {};
    if (message.trim().length > MESSAGE_MAX) next.message = "Please shorten your message.";
    if (name.trim().length > NAME_MAX) next.customerName = "Please shorten your name.";
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^[+()\-\s\d]{6,32}$/.test(trimmedPhone)) {
      next.customerPhone = "Please enter a valid phone number.";
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const companyWebsite = new FormData(event.currentTarget).get("company_website");

    setIsSubmitting(true);
    try {
      const result = await submitFeedback({
        businessSlug,
        rating,
        message: message.trim() || undefined,
        customerName: name.trim() || undefined,
        customerPhone: phone.trim() || undefined,
        companyWebsite: typeof companyWebsite === "string" ? companyWebsite : undefined,
      });
      onSuccess({ outcome: result.outcome, redirectUrl: result.redirectUrl });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not submit your feedback. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-7 space-y-5 text-left" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${fieldId}-name`} label="Name" error={errors.customerName}>
          <input
            className="field"
            id={`${fieldId}-name`}
            autoComplete="name"
            maxLength={NAME_MAX}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field id={`${fieldId}-phone`} label="Phone number" error={errors.customerPhone}>
          <input
            className="field"
            id={`${fieldId}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={PHONE_MAX}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
      </div>

      <Field id={`${fieldId}-message`} label="Feedback" error={errors.message}>
        <textarea
          className="field min-h-28 resize-y"
          id={`${fieldId}-message`}
          maxLength={MESSAGE_MAX}
          placeholder={
            isLowRating
              ? "Tell us what went wrong so we can put it right."
              : "Anything you'd like to share?"
          }
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </Field>

      {/* Honeypot — hidden from real users. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor={`${fieldId}-company`}>Company website</label>
        <input
          id={`${fieldId}-company`}
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {submitError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {submitError}
        </p>
      )}

      <button
        className="button button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Submitting…" : "Submit feedback"}
      </button>
      <p className="text-center text-xs leading-5 text-ink-muted">
        Name, phone and feedback are all optional. Please don&apos;t include sensitive
        personal information.
      </p>
    </form>
  );
}

function Field({
  children,
  error,
  id,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  id: string;
  label: string;
}) {
  return (
    <div>
      <label className="mb-2 flex text-sm font-bold text-ink" htmlFor={id}>
        {label}
        <span className="ml-1 font-normal text-ink-muted">(optional)</span>
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
