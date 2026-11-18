import { createServer } from "http";
import { google } from "googleapis";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    console.error("Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI first.");
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);
console.log("\nWaiting for Google to redirect back...\n");

const callbackUrl = new URL(GOOGLE_REDIRECT_URI);
const server = createServer(async (req, res) => {
    if (req.url === "/favicon.ico") {
        res.writeHead(204);
        res.end();
        return;
    }

    if (!req.url?.startsWith(callbackUrl.pathname)) return;

    try {
        const url = new URL(req.url, GOOGLE_REDIRECT_URI);
        const code = url.searchParams.get("code");

        if (!code) {
            res.writeHead(400);
            res.end("No authorization code found.");
            return;
        }

        const { tokens } = await oauth2Client.getToken(code);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Done. Check your terminal for the refresh token.</h1>");
        console.log("\nAdd this to your .env.local:\n");
        console.log(`GOOGLE_REFRESH_TOKEN=\"${tokens.refresh_token}\"\n`);
        server.close();
    } catch (error) {
        console.error("Error exchanging code for token:", error);
        res.writeHead(500);
        res.end("Authentication failed.");
    }
});

server.listen(Number(callbackUrl.port) || 80, callbackUrl.hostname, () => {
    console.log(`Listening for the OAuth callback at ${GOOGLE_REDIRECT_URI}`);
});
