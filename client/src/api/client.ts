import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

/** Envelope returned by every backend endpoint. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  validationErrors?: Record<string, string>;
  timestamp: string;
}

/** Normalised error for every failed request (network errors use status 0). */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const CSRF_COOKIE = "XSRF-TOKEN";
const SAFE_METHODS = new Set(["get", "head", "options"]);

/**
 * The JWT lives in an HttpOnly cookie, so JavaScript never sees it. CSRF protection uses the
 * double-submit pattern: Axios copies the XSRF-TOKEN cookie into the X-XSRF-TOKEN header.
 */
export const http = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  withCredentials: true,
  xsrfCookieName: CSRF_COOKIE,
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: { Accept: "application/json" },
});

const hasCsrfCookie = () =>
  document.cookie.split(";").some((part) => part.trim().startsWith(`${CSRF_COOKIE}=`));

let csrfRequest: Promise<unknown> | null = null;
const ensureCsrfCookie = () => {
  csrfRequest ??= http.get("/auth/csrf").finally(() => {
    csrfRequest = null;
  });
  return csrfRequest;
};

http.interceptors.request.use(async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (!SAFE_METHODS.has(method) && !hasCsrfCookie()) {
    await ensureCsrfCookie();
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

/** Registers the callback run when an authenticated request is rejected with 401 (session expired). */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

const defaultMessage = (status: number) => {
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 401) return "Please sign in to continue.";
  return "The request could not be completed.";
};

export const toApiError = (error: AxiosError<Partial<ApiEnvelope<unknown>>>): ApiError => {
  if (!error.response) {
    return new ApiError(
      error.code === "ECONNABORTED"
        ? "The server took too long to respond. Please try again."
        : "Can't reach the server. Check your connection and try again.",
      0,
    );
  }
  const { status, data } = error.response;
  const message =
    data && typeof data === "object" && typeof data.message === "string" && data.message
      ? data.message
      : defaultMessage(status);
  const fieldErrors = data && typeof data === "object" ? (data.validationErrors ?? {}) : {};
  return new ApiError(message, status, fieldErrors);
};

type RetriableConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean };

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<Partial<ApiEnvelope<unknown>>>) => {
    const config = error.config as RetriableConfig | undefined;

    // A stale CSRF cookie (e.g. after a server restart): refresh it once and retry.
    if (
      config &&
      !config._csrfRetried &&
      error.response?.status === 403 &&
      error.response.data?.message === "Invalid or missing CSRF token"
    ) {
      config._csrfRetried = true;
      await http.get("/auth/csrf");
      return http.request(config);
    }

    const apiError = toApiError(error);
    const url = config?.url ?? "";
    if (apiError.status === 401 && !url.startsWith("/auth/")) {
      onUnauthorized?.();
    }
    return Promise.reject(apiError);
  },
);

/** Unwraps the `data` field of the response envelope. */
export const unwrap = async <T>(request: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> =>
  (await request).data.data;
