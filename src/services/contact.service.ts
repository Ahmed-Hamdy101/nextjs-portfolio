import { postJson } from "@/lib/http";
import type { ApiSuccess, ContactPayload } from "@/types/content";

/** Contact transport. Validation stays on the API route. */
export const contactService = {
    send: (payload: ContactPayload): Promise<ApiSuccess> => postJson<ApiSuccess>("/api/contact", payload),
};
