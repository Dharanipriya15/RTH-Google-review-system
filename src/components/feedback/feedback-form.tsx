"use client";

import { useRef, useState } from "react";
import type { FeedbackFieldErrors, Rating } from "@/lib/feedback/types";
import { submitFeedback } from "@/lib/feedback/submit-feedback";
import { Button } from "@/components/ui/button";
import { TextField, TextArea } from "@/components/ui/field";

interface FeedbackFormProps {
  businessSlug: string;
  rating: Rating;
  isLowRating: boolean;
  onSuccess: (result: { duplicate: boolean }) => void;
}

const MESSAGE_MAX = 2000;
const NAME_MAX = 120;
const PHONE_MAX = 32;
const EMAIL_MAX = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FeedbackForm({
  businessSlug,
  rating,
  isLowRating,
  onSuccess,
}: FeedbackFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FeedbackFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous guard against a double submit (double-click, Enter + click):
  // React state updates are async, so `isSubmitting` alone can still let a
  // second submit event through before the first render disables the button.
  const submitLockRef = useRef(false);

  function validate(): FeedbackFieldErrors {
    const next: FeedbackFieldErrors = {};
    if (message.trim().length > MESSAGE_MAX) next.message = "Please shorten your message.";

    const trimmedName = name.trim();
    if (isLowRating && !trimmedName) {
      next.customerName = "Please enter your name.";
    } else if (trimmedName.length > NAME_MAX) {
      next.customerName = "Please shorten your name.";
    }

    const trimmedPhone = phone.trim();
    if (isLowRating && !trimmedPhone) {
      next.customerPhone = "Please enter your phone number.";
    } else if (trimmedPhone && !/^[+()\-\s\d]{6,32}$/.test(trimmedPhone)) {
      next.customerPhone = "Please enter a valid phone number.";
    }

    const trimmedEmail = email.trim();
    if (isLowRating && !trimmedEmail) {
      next.customerEmail = "Please enter your email address.";
    } else if (trimmedEmail && (trimmedEmail.length > EMAIL_MAX || !EMAIL_PATTERN.test(trimmedEmail))) {
      next.customerEmail = "Please enter a valid email address.";
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLockRef.current || isSubmitting) return;
    submitLockRef.current = true;

    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) {
      submitLockRef.current = false;
      return;
    }

    const companyWebsite = new FormData(event.currentTarget).get("company_website");

    setIsSubmitting(true);
    try {
      const result = await submitFeedback({
        businessSlug,
        rating,
        message: message.trim() || undefined,
        customerName: name.trim() || undefined,
        customerPhone: phone.trim() || undefined,
        customerEmail: email.trim() || undefined,
        companyWebsite: typeof companyWebsite === "string" ? companyWebsite : undefined,
      });
      // Success — keep the button locked; the parent swaps this form out.
      onSuccess({ duplicate: result.duplicate });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn't submit your feedback. Please try again.",
      );
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  }

  return (
    <form className="mt-6 space-y-4 text-left" noValidate onSubmit={handleSubmit}>
      <TextArea
        label={isLowRating ? "What went wrong?" : "Anything to add?"}
        optional
        maxLength={MESSAGE_MAX}
        placeholder={
          isLowRating
            ? "Tell us what happened so we can put it right."
            : "Share what made your visit memorable."
        }
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        error={errors.message}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Name"
          optional={!isLowRating}
          required={isLowRating}
          autoComplete="name"
          maxLength={NAME_MAX}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.customerName}
        />
        <TextField
          label="Phone"
          optional={!isLowRating}
          required={isLowRating}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={PHONE_MAX}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={errors.customerPhone}
        />
      </div>

      <TextField
        label="Email"
        optional={!isLowRating}
        required={isLowRating}
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={EMAIL_MAX}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.customerEmail}
      />

      {/* Honeypot — hidden from real users. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {submitError && (
        <p
          role="alert"
          className="rounded-md border border-danger-tint bg-danger-tint px-4 py-3 text-sm font-medium text-danger"
        >
          {submitError}
        </p>
      )}

      <Button type="submit" fullWidth loading={isSubmitting}>
        {isSubmitting ? "Sending…" : "Submit Your Concern"}
      </Button>
      <p className="text-center text-caption">
        If you don&apos;t like your food, just ask our staff to replace it. We&apos;d be
        happy to serve you again.
      </p>
    </form>
  );
}
