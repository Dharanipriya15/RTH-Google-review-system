"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

interface FieldShellProps {
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  counter?: string;
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode;
}

function FieldShell({ label, optional, hint, error, counter, children }: FieldShellProps) {
  const base = useId();
  const inputId = `${base}-input`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="label">
          {label}
          {optional && (
            <span className="font-normal text-ink-muted">optional</span>
          )}
        </label>
        {counter && (
          <span className="text-[0.7rem] tabular-nums text-ink-muted">{counter}</span>
        )}
      </div>
      {children({ inputId, describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[0.8rem] font-semibold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-[0.8rem] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = {
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
} & Omit<ComponentProps<"input">, "id" | "className">;

export function TextField({ label, optional, hint, error, ...input }: TextFieldProps) {
  return (
    <FieldShell label={label} optional={optional} hint={hint} error={error}>
      {({ inputId, describedBy }) => (
        <input
          id={inputId}
          className="field"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...input}
        />
      )}
    </FieldShell>
  );
}

type TextAreaProps = {
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  value: string;
  maxLength?: number;
} & Omit<ComponentProps<"textarea">, "id" | "className" | "value">;

export function TextArea({
  label,
  optional,
  hint,
  error,
  value,
  maxLength,
  ...textarea
}: TextAreaProps) {
  const counter = maxLength ? `${value.length} / ${maxLength}` : undefined;
  return (
    <FieldShell
      label={label}
      optional={optional}
      hint={hint}
      error={error}
      counter={counter}
    >
      {({ inputId, describedBy }) => (
        <textarea
          id={inputId}
          className="field min-h-32 resize-y"
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...textarea}
        />
      )}
    </FieldShell>
  );
}
