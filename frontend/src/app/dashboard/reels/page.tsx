"use client";

import YouTubeReels from "@/components/YoutubeReels";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

function ReelsPageContent() {
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

    type VideoInteraction = {
        video_id: string;
        interaction_type: string;
        created_at: string;
    };

    type CreatorVideo = {
        id: string;
        video_id: string;
        url: string;
        thumbnail: string;
        title: string;
        email: string;
        channel_id: string;
        shop_domain: string;
        indexed_at: string;
    };

    type CreatorMatch = {
        creator_videos: CreatorVideo;
    };

    const [data, setData] = useState<Reel[] | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = getCurrentUser();

                // Fetch reel interactions (dismissed/partnered) for this company
                const interactionsResponse = await fetch(`/api/reels/interactions?company_id=${user.companyId}`);
                const interactionsData = await interactionsResponse.json();
                const interactedVideoIds = new Set(
                    (interactionsData.interactions || []).map((i: VideoInteraction) => i.video_id)
                );

                console.log(`Found ${interactedVideoIds.size} interacted videos to filter out`);

                let url: string;
                if (productId) {
                    // Fetch creators for specific product
                    url = `/api/products/${productId}/creators`;
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

                    // Filter out videos that have been interacted with
                    const filteredVideos = videos?.filter((video: CreatorVideo) =>
                        !interactedVideoIds.has(video.video_id)
                    ) || [];

                    // Transform to Reel format
                    const reels: Reel[] = filteredVideos.map((video: CreatorVideo) => ({
                        id: video.id,
                        company: video.shop_domain || user.companyId,
                        yt_short_url: video.url,
                        product_imgs: video.thumbnail ? [video.thumbnail] : [],
                        product_titles: [video.title],
                        short_id: video.video_id,
                        email: video.email || "",
                        channel_id: video.channel_id,
                        company_id: user.companyId
                    }));

                    console.log(`Loaded ${reels.length} creator videos (${videos.length - reels.length} filtered out)`);
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

                // Filter out creators that have been interacted with
                const filteredCreators = creators.filter((match: CreatorMatch) => {
                    const video = match.creator_videos;
                    return !interactedVideoIds.has(video.video_id);
                });

                // Transform API response to Reel format
                const reels: Reel[] = filteredCreators.map((match: CreatorMatch) => {
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

                console.log(`Loaded ${reels.length} creators for product ${productId} (${creators.length - reels.length} filtered out)`);
                setData(reels);

            } catch (error) {
                console.error("Error fetching creator data:", error);
                setData([]);
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
                {/* Back to dashboard — on mobile the sidebar/header are hidden, so this is
                    the only way out of the full-screen reels view. */}
                <a
                    href="/dashboard/overview"
                    aria-label="Back to dashboard"
                    className="fixed top-4 left-4 lg:hidden bg-white text-gray-700 p-2 rounded-lg shadow-lg z-50 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                </a>

                {/* Archive button */}
                <a
                    href="/dashboard/reels/archive"
                    className="fixed top-4 right-4 lg:top-6 lg:left-[320px] lg:right-auto bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg z-50 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="5" x="2" y="3" rx="1"/>
                        <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/>
                        <path d="M10 12h4"/>
                    </svg>
                    Archive
                </a>

                <YouTubeReels reelsData={data || []} />
            </div>
        </DashboardLayout>
    );
}

export default function ReelsPage() {
    return (
        <Suspense fallback={
            <DashboardLayout initialSidebarOpen={true} allowSidebarToggle={false} hideHeader={true}>
                <div className="fixed inset-0 flex items-center justify-center">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </DashboardLayout>
        }>
            <ReelsPageContent />
        </Suspense>
    );
}
