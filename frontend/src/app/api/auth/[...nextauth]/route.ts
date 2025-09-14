import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { upsertCreatorTokens } from "@/lib/supabaseAdmin";

async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        if (!token.refreshToken) {
            console.error("[Token Refresh] No refresh token available");
            throw new Error("No refresh token available");
        }

        console.log("[Token Refresh] Attempting with:", {
            clientId: process.env.GOOGLE_CLIENT_ID?.slice(0, 5) + "...",
            refreshToken: (token.refreshToken as string).slice(0, 5) + "..."
        });

        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
            }),
        });

        const refreshedTokens = await response.json();
        if (!response.ok) {
            throw refreshedTokens;
        }

        await upsertCreatorTokens({
            channelId: token.channelId as string,
            email: token.email as string,
            accessToken: refreshedTokens.access_token,
            refreshToken: token.refreshToken as string,
            expiresAt: new Date(Date.now() + refreshedTokens.expires_in * 1000),
        });

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
        };
    } catch (error) {
        console.error("[Token Refresh] Error:", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        } as JWT;
    }
}

// Constants for cookie settings
const COOKIES_LIFE_TIME = 24 * 60 * 60; // 24 hours in seconds
const COOKIE_PREFIX = process.env.NODE_ENV === 'production' ? '__Secure-' : '';

const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/youtube.force-ssl",
                    access_type: "offline",
                    response_type: "code",
                    prompt: "consent select_account",
                    include_granted_scopes: "true",
                },
            },
            client: {
                authorization_signed_response_alg: "RS256",
                id_token_signed_response_alg: "RS256",
            },
            checks: ["state", "pkce"],
        }),
    ],
    debug: true,
    callbacks: {
        async jwt({ token, user, account, trigger }) {
            console.log("[JWT Callback] account:", account ? "present" : "missing");
            console.log(user)
            console.log(account)

            // Initial sign in
            if (account && user) {
                // Access cookies from the request
                // const cookies = request?.cookies as { get: (name: string) => { value: string } | undefined };
                console.log("[JWT Callback] Initial sign in:", {
                    hasAccess: !!account.access_token,
                    hasRefresh: !!account.refresh_token,
                });

                if (!account.access_token || !account.refresh_token) {
                    console.error("[JWT Callback] Missing tokens in account");
                    return { ...token, error: "MissingTokens" };
                }

                // Get and decode the state parameter
                const stateParam = account.state as string;
                let channelId: string | undefined;
                
                try {
                    const stateData = JSON.parse(atob(stateParam));
                    channelId = stateData.channelId;
                    console.log("[JWT Callback] Decoded state data:", stateData);
                } catch (error) {
                    console.error("[JWT Callback] Error decoding state:", error);
                }

                if (!channelId) {
                    console.error("[JWT Callback] No channelId in state");
                    throw new Error("No channelId found in state");
                }

                // --- Token expiry ---
                const tokenExpiry = account.expires_at
                    ? account.expires_at * 1000
                    : Date.now() + 3600 * 1000;

                // --- Save to Supabase with the channelId ---
                await upsertCreatorTokens({
                    channelId,
                    email: user.email!,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: new Date(tokenExpiry),
                });

                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    channelId,
                    expiresAt: tokenExpiry,
                } as JWT;
            }

            // Refresh if expired
            if (token.expiresAt && Date.now() < token.expiresAt - 60000) {
                return token;
            }
            if (token.accessToken && token.refreshToken) {
                console.log("[JWT Callback] Access token expired, attempting refresh");
                return refreshAccessToken(token);
            }

            console.warn("[JWT Callback] Missing tokens, returning unchanged token");
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.channelId = token.channelId as string;
                session.accessToken = token.accessToken as string;
                session.error = token.error;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            console.log("[Redirect Callback]", {
                url,
                baseUrl,
                fullUrl: new URL(url, baseUrl).toString()
            });

            // Always allow OAuth callback URLs
            if (url.startsWith('/api/auth/callback')) {
                console.log("[Redirect Callback] Allowing callback URL:", url);
                return url;
            }

            // Preserve state parameter for callbacks
            if (url.includes('/auth/callback/google')) {
                console.log("[Redirect Callback] Preserving state in callback");
                return url;
            }

            // For all other URLs, redirect to dashboard
            const finalUrl = `${baseUrl}/dashboard`;
            console.log("[Redirect Callback] Redirecting to dashboard:", finalUrl);
            return finalUrl;
        },
    },
    pages: {
        signIn: "/creators",
    },
    cookies: {
        sessionToken: {
            name: `${COOKIE_PREFIX}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        callbackUrl: {
            name: `${COOKIE_PREFIX}next-auth.callback-url`,
            options: {
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        csrfToken: {
            name: `${COOKIE_PREFIX}next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        pkceCodeVerifier: {
            name: `${COOKIE_PREFIX}next-auth.pkce.code_verifier`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: COOKIES_LIFE_TIME,
            },
        },
        state: {
            name: `${COOKIE_PREFIX}next-auth.state`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: COOKIES_LIFE_TIME, // Extended state cookie lifetime
            },
        },
        nonce: {
            name: `${COOKIE_PREFIX}next-auth.nonce`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
};

// Create handler with request logging
async function logRequest(req: Request) {
    try {
        console.log('[NextAuth] Incoming request:', {
            method: req.method,
            url: req.url,
            headers: Object.fromEntries(req.headers.entries())
        });

        const clonedReq = req.clone();
        const body = await clonedReq.text();
        if (body) {
            console.log('[NextAuth] Request body:', body);
            try {
                const jsonBody = JSON.parse(body);
                console.log('[NextAuth] Parsed JSON body:', jsonBody);
            } catch (e) {
                console.log('[NextAuth] Body is not JSON');
            }
        }
    } catch (error) {
        console.error('[NextAuth] Error reading request:', error);
    }
}

const handler = async (req: Request, context: unknown ) => {
    await logRequest(req);
    
    // Get channelId from cookie
    const cookieHeader = req.headers.get('cookie');
    const channelId = cookieHeader?.split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('youtube_channel_id='))
        ?.split('=')[1];
        
    console.log("[NextAuth Handler] ChannelId from cookie:", channelId);

    return NextAuth({
        ...authOptions,
        callbacks: {
            ...authOptions.callbacks,
            async jwt({ token, user, account }) {
                console.log("[JWT Callback] account:", account ? "present" : "missing");
                console.log(user);
                console.log(account);

                // Initial sign in
                if (account && user) {
                    console.log("[JWT Callback] Initial sign in:", {
                        hasAccess: !!account.access_token,
                        hasRefresh: !!account.refresh_token,
                    });

                    if (!account.access_token || !account.refresh_token) {
                        console.error("[JWT Callback] Missing tokens in account");
                        return { ...token, error: "MissingTokens" };
                    }

                    if (!channelId) {
                        console.error("[JWT Callback] No channelId in cookie");
                        throw new Error("No channelId found in cookie");
                    }

                    // --- Token expiry ---
                    const tokenExpiry = account.expires_at
                        ? account.expires_at * 1000
                        : Date.now() + 3600 * 1000;

                    // --- Save to Supabase with the channelId ---
                    await upsertCreatorTokens({
                        channelId,
                        email: user.email!,
                        accessToken: account.access_token,
                        refreshToken: account.refresh_token,
                        expiresAt: new Date(tokenExpiry),
                    });

                    return {
                        ...token,
                        accessToken: account.access_token,
                        refreshToken: account.refresh_token,
                        channelId,
                        expiresAt: tokenExpiry,
                    } as JWT;
                }

                // Refresh if expired
                if (token.expiresAt && Date.now() < token.expiresAt - 60000) {
                    return token;
                }
                if (token.accessToken && token.refreshToken) {
                    console.log("[JWT Callback] Access token expired, attempting refresh");
                    return refreshAccessToken(token);
                }

                console.warn("[JWT Callback] Missing tokens, returning unchanged token");
                return token;
            },
            async session(params) {
                return authOptions.callbacks!.session!(params);
            },
            async redirect(params) {
                return authOptions.callbacks!.redirect!(params);
            }
        }
    })(req, context);
};

export { handler as GET, handler as POST };