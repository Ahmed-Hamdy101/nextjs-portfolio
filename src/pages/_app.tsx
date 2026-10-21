import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { Bricolage_Grotesque } from "next/font/google";

const grotesk = Bricolage_Grotesque({
    subsets: ["latin"],
    axes: ["opsz"],
    variable: "--font-grotesk",
    display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();

    return (
        <div className={`${grotesk.variable} font-sans`}>
            <Layout>
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={router.route}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12, ease: "linear" }}
                    >
                        <Component {...pageProps} />
                    </motion.div>
                </AnimatePresence>
            </Layout>
        </div>
    );
}
