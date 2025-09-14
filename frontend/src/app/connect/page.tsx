"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { setCookie, getCookie } from "@/lib/cookies";

const CHANNEL_ID_COOKIE = "youtube_channel_id";

export default function ConnectPage() {
    const searchParams = useSearchParams();
    const [channelId, setChannelId] = useState<string | null>(null);
    const authError = searchParams.get("error");
    const state = searchParams.get("state");
    const urlChannelId = searchParams.get("channelId");

    // Initialize channelId from URL or cookie
    useEffect(() => {
        const cookieChannelId = getCookie(CHANNEL_ID_COOKIE);
        const finalChannelId = urlChannelId || cookieChannelId;
        
        if (finalChannelId) {
            // Always store the channelId in cookie when available
            setCookie(CHANNEL_ID_COOKIE, finalChannelId, 30); // Store for 30 days
            setChannelId(finalChannelId);
        }
    }, [urlChannelId]);

    const error = searchParams.get("error");
    const callbackUrl = searchParams.get("callbackUrl");

    if (!channelId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-red-50 rounded-lg">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error: Channel ID Required</h1>
                    <p className="text-gray-700 mb-4">
                        Please make sure you're visiting this page with a valid YouTube channel ID.
                    </p>
                    {error && (
                        <div className="text-red-600 mt-4 p-4 bg-red-100 rounded">
                            Error: {error}
                        </div>
                    )}
                    {callbackUrl && (
                        <div className="text-sm text-gray-500 mt-4">
                            Redirect URL: {callbackUrl}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const handleLogin = async () => {
        if (!channelId) return;
        
        console.log('Starting login with channelId:', channelId);
        try {
            // Store the channelId in a cookie
            setCookie(CHANNEL_ID_COOKIE, channelId, 30); // Store for 30 days
            
            // Start the sign in process with a simple redirect
            const result = await signIn("google", {
                callbackUrl: "/dashboard",
                redirect: true,
            });

            console.log('Sign in result:', result);
        } catch (error) {
            console.error('Sign in error:', error);
            alert('Failed to sign in: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };



    // console.log('Sign in result:', result);

//     if (result?.error) {
//         throw new Error(result.error);
//     }

//     // If successful and we have a url, redirect
//     if (result?.url) {
//         window.location.href = `/connect?channelId=${channelId}`;
//     }
// } catch (error) {
//     console.error("Error during sign in:", error);
//     // Show error to user (you might want to add an error state to your UI)
//     alert(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
// }
//   };

return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <h1 className="text-3xl font-bold mb-8">Connect Your YouTube Channel</h1>
            <button
                onClick={handleLogin}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
                Login with Google
            </button>
        </div>
    </div>
);
}