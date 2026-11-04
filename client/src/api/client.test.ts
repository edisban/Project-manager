import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { toApiError } from "./client";

const response = (status: number, data: unknown): AxiosResponse =>
  ({
    status,
    data,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  }) as AxiosResponse;

describe("toApiError", () => {
  it("uses the server's message and field errors", () => {
    const error = toApiError(
      new AxiosError(
        "Request failed",
        "ERR_BAD_REQUEST",
        undefined,
        undefined,
        response(400, {
          message: "Please correct the highlighted fields",
          validationErrors: { name: "Required" },
        }),
      ),
    );
    expect(error.status).toBe(400);
    expect(error.message).toBe("Please correct the highlighted fields");
    expect(error.fieldErrors).toEqual({ name: "Required" });
  });

  it("falls back to a friendly message when the body has none", () => {
    expect(
      toApiError(new AxiosError("x", "ERR", undefined, undefined, response(503, "<html>"))).message,
    ).toMatch(/something went wrong/i);
  });

  it("reports network failures with status 0", () => {
    const error = toApiError(new AxiosError("Network Error", "ERR_NETWORK"));
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/can't reach the server/i);
  });
});
