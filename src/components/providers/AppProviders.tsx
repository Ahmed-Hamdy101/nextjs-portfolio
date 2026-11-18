import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createQueryClient } from "@/config/query";

interface AppProvidersProps {
    children: ReactNode;
}

/** Client-side provider shell mounted once in `pages/_app.tsx`. */
export default function AppProviders({ children }: AppProvidersProps) {
    const [queryClient] = useState(createQueryClient);

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
