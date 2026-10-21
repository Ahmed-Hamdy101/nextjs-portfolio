import Head from "next/head";

export const SITE_ORIGIN = "https://ahmedhamdy101.is-a.dev";

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

interface SEOHeadProps {
    title: string;
    description: string;
    path: string;
    image?: string;
    type?: "website" | "article";
    noIndex?: boolean;
    structuredData?: JsonLd;
}

export default function SEOHead({
    title,
    description,
    path,
    image = "/og-image-portfolio.jpg",
    type = "website",
    noIndex = false,
    structuredData,
}: SEOHeadProps) {
    const pageUrl = new URL(path, SITE_ORIGIN).toString();
    const imageUrl = new URL(image, SITE_ORIGIN).toString();
    const structuredMarkup = structuredData
        ? JSON.stringify(structuredData).replace(/</g, "\\u003c")
        : undefined;

    return (
        <Head>
            <title>{title}</title>
            <meta name="description" content={description} key="description" />
            <link rel="canonical" href={pageUrl} key="canonical" />
            {noIndex && <meta name="robots" content="noindex,follow" key="robots" />}

            <meta property="og:type" content={type} key="og:type" />
            <meta property="og:site_name" content="Ahmed Hamdy" key="og:site_name" />
            <meta property="og:locale" content="en_US" key="og:locale" />
            <meta property="og:url" content={pageUrl} key="og:url" />
            <meta property="og:title" content={title} key="og:title" />
            <meta property="og:description" content={description} key="og:description" />
            <meta property="og:image" content={imageUrl} key="og:image" />
            <meta property="og:image:alt" content={`${title} — Ahmed Hamdy`} key="og:image:alt" />

            <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
            <meta name="twitter:url" content={pageUrl} key="twitter:url" />
            <meta name="twitter:title" content={title} key="twitter:title" />
            <meta name="twitter:description" content={description} key="twitter:description" />
            <meta name="twitter:image" content={imageUrl} key="twitter:image" />

            {structuredMarkup && (
                <script
                    type="application/ld+json"
                    key="structured-data"
                    dangerouslySetInnerHTML={{ __html: structuredMarkup }}
                />
            )}
        </Head>
    );
}
