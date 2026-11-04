import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/api/client";

/**
 * Copies server-side validation errors onto matching form fields.
 * Returns the message to show for errors that don't belong to a field (or null if all were mapped).
 */
export const applyServerErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null => {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }
  const known = new Set<string>(fields);
  let mapped = 0;
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    if (known.has(field)) {
      setError(field as Path<T>, { type: "server", message }, { shouldFocus: mapped === 0 });
      mapped += 1;
    }
  }
  return mapped > 0 && mapped === Object.keys(error.fieldErrors).length ? null : error.message;
};

/** Letters from any alphabet (e.g. Greek), spaces, apostrophes and hyphens — mirrors the backend. */
export const NAME_PATTERN = /^\p{L}[\p{L} '-]*$/u;
