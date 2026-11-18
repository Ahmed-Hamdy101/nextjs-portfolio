import type { ApiErrorBody } from "@/types/content";

/** Error with the HTTP status attached, so UI can distinguish network and server failures. */
export class HttpError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}

const DEFAULT_ERROR = "Something went wrong. Please try again.";

/** POST JSON and normalise every failure mode into an `HttpError`. */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
    let response: Response;

    try {
        response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch {
        throw new HttpError("Could not reach the server. Please try again.", 0);
    }

    const payload = (await response.json().catch(() => ({}))) as T & ApiErrorBody;

    if (!response.ok) {
        throw new HttpError(payload?.error || DEFAULT_ERROR, response.status);
    }

    return payload;
}

export const errorMessage = (error: unknown): string =>
    error instanceof HttpError ? error.message : error instanceof Error ? error.message : DEFAULT_ERROR;
