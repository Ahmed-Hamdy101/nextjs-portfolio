import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta name="theme-color" content="#05070b" />
                <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                <link rel="shortcut icon" href="/icon.svg" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <meta name="apple-mobile-web-app-title" content="Ahmed Hamdy" />
                <link rel="manifest" href="/site.webmanifest" />
                <script src="https://platform.linkedin.com/badges/js/profile.js" async defer type="text/javascript"></script>
            </Head>
            <body className="antialiased bg-paper text-ink">
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
