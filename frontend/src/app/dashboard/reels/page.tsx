"use client";

import YouTubeReels from "@/components/YoutubeReels";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function ReelsPage() {
    type Reel = {
        id: string;
        company: string;
        yt_short_url: string;
        product_text?: string;
        product_imgs: string[];
        product_titles?: string[];
        short_id?: string;
        email: string;
        channel_id: string;
        company_id: string; // This will be set from company field
    };
    const [data, setData] = useState<Reel[] | null>(null);
    const [isIngesting, setIsIngesting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            // MOCK DATA FOR TESTING - just fake 5 reels
            const mockReels: Reel[] = [
                {
                    id: "1",
                    company: "matchamatcha.ca",
                    yt_short_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    product_imgs: ["https://picsum.photos/200/300"],
                    product_titles: ["Test Product 1"],
                    short_id: "dQw4w9WgXcQ",
                    email: "test@example.com",
                    channel_id: "test_channel",
                    company_id: "matchamatcha.ca"
                },
                {
                    id: "2",
                    company: "matchamatcha.ca",
                    yt_short_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    product_imgs: ["https://picsum.photos/200/301"],
                    product_titles: ["Test Product 2"],
                    short_id: "dQw4w9WgXcQ",
                    email: "test@example.com",
                    channel_id: "test_channel",
                    company_id: "matchamatcha.ca"
                },
                {
                    id: "3",
                    company: "matchamatcha.ca",
                    yt_short_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    product_imgs: ["https://picsum.photos/200/302"],
                    product_titles: ["Test Product 3"],
                    short_id: "dQw4w9WgXcQ",
                    email: "test@example.com",
                    channel_id: "test_channel",
                    company_id: "matchamatcha.ca"
                },
                {
                    id: "4",
                    company: "matchamatcha.ca",
                    yt_short_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    product_imgs: ["https://picsum.photos/200/303"],
                    product_titles: ["Test Product 4"],
                    short_id: "dQw4w9WgXcQ",
                    email: "test@example.com",
                    channel_id: "test_channel",
                    company_id: "matchamatcha.ca"
                },
                {
                    id: "5",
                    company: "matchamatcha.ca",
                    yt_short_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    product_imgs: ["https://picsum.photos/200/304"],
                    product_titles: ["Test Product 5"],
                    short_id: "dQw4w9WgXcQ",
                    email: "test@example.com",
                    channel_id: "test_channel",
                    company_id: "matchamatcha.ca"
                }
            ];

            console.log("Using MOCK data for testing:", mockReels);
            setData(mockReels);
        };

        const checkAndTriggerIngestion = async (shop_name: string | null) => {
            if (!shop_name || isIngesting) return;

            try {
                console.log("Checking ingestion for shop:", shop_name);

                // Get company data to check last ingestion attempt
                const { data: company, error: companyError } = await supabase
                    .from("companies")
                    .select("last_ingest_attempt, access_token")
                    .eq("shop_name", shop_name)
                    .single();

                if (companyError) {
                    console.error("Error fetching company data:", companyError);
                    console.log("Company lookup failed - this might mean the shop isn't registered yet");
                    return;
                }

                if (!company) {
                    console.log("No company found with shop_name:", shop_name);
                    return;
                }
                
                // Check cooldown (2 minutes = 120000 milliseconds)
                const now = new Date();
                const lastAttempt = company.last_ingest_attempt ? new Date(company.last_ingest_attempt) : null;
                const cooldownPeriod = 2 * 60 * 1000; // 2 minutes in milliseconds
                
                if (lastAttempt && (now.getTime() - lastAttempt.getTime()) < cooldownPeriod) {
                    console.log("Ingestion is on cooldown. Last attempt:", lastAttempt);
                    return;
                }
                
                // Trigger ingestion
                setIsIngesting(true);
                console.log("No shorts found, triggering ingestion for:", shop_name);
                
                // Update last_ingest_attempt timestamp
                await supabase
                    .from("companies")
                    .update({ last_ingest_attempt: now.toISOString() })
                    .eq("shop_name", shop_name);
                
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/ingest`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ shop_url: shop_name, access_token: company.access_token }),
                });
                
                if (response.ok) {
                    console.log("Ingestion triggered successfully");
                    // Optionally refetch data after a delay to see if new shorts were generated
                    setTimeout(() => {
                        fetchData();
                    }, 5000); // Wait 5 seconds then refetch
                } else {
                    console.error("Failed to trigger ingestion:", response.statusText);
                }
                
            } catch (error) {
                console.error("Error triggering ingestion:", error);
            } finally {
                setIsIngesting(false);
            }
        };
        
        fetchData();
    }, [isIngesting]);

    return (
        <DashboardLayout
            initialSidebarOpen={true}
            allowSidebarToggle={false}
            hideHeader={true}
        >
            <div className="fixed inset-0">
                {isIngesting && (
                    <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                        Generating new content...
                    </div>
                )}
                <YouTubeReels reelsData={data || []} />
            </div>
        </DashboardLayout>
    );
}