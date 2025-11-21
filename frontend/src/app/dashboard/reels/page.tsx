"use client";

import YouTubeReels from "@/components/YoutubeReels";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCurrentUser, getApiUrl } from "@/lib/auth";

export default function ReelsPage() {
    const searchParams = useSearchParams();
    const productId = searchParams.get("product_id"); // Optional: filter by product
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
            try {
                const user = getCurrentUser();

                let url: string;
                if (productId) {
                    // Fetch creators for specific product
                    url = getApiUrl(`/products/${productId}/creators`);
                    console.log("Fetching creators for product:", productId);
                } else {
                    // Fetch all creator videos (TODO: add endpoint for this)
                    // For now, fetch from Supabase directly
                    const { data: videos, error } = await supabase
                        .from("creator_videos")
                        .select("*")
                        .order("indexed_at", { ascending: false })
                        .limit(50);

                    if (error) {
                        console.error("Error fetching creator videos:", error);
                        setData([]);
                        return;
                    }

                    // Transform to Reel format
                    const reels: Reel[] = videos?.map((video: any) => ({
                        id: video.id,
                        company: video.shop_domain || user.companyId,
                        yt_short_url: video.url,
                        product_imgs: video.thumbnail ? [video.thumbnail] : [],
                        product_titles: [video.title],
                        short_id: video.video_id,
                        email: video.email || "",
                        channel_id: video.channel_id,
                        company_id: user.companyId
                    })) || [];

                    console.log(`Loaded ${reels.length} creator videos from database`);
                    setData(reels);
                    return;
                }

                // Fetch from API for product-specific creators
                const response = await fetch(url);
                if (!response.ok) {
                    console.error("Failed to fetch creators");
                    setData([]);
                    return;
                }

                const result = await response.json();
                const creators = result.matches || [];

                // Transform API response to Reel format
                const reels: Reel[] = creators.map((match: any) => {
                    const video = match.creator_videos;
                    return {
                        id: video.id,
                        company: video.shop_domain || user.companyId,
                        yt_short_url: video.url,
                        product_imgs: video.thumbnail ? [video.thumbnail] : [],
                        product_titles: [video.title],
                        short_id: video.video_id,
                        email: video.email || "",
                        channel_id: video.channel_id,
                        company_id: user.companyId
                    };
                });

                console.log(`Loaded ${reels.length} creators for product ${productId}`);
                setData(reels);

            } catch (error) {
                console.error("Error fetching creator data:", error);
                setData([]);
            }
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
    }, [productId]); // Refetch when product filter changes

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