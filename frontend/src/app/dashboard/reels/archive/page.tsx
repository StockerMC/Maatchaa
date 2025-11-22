"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { getCurrentUser, getApiUrl } from "@/lib/auth";
import { Card, Text, Button, Flex } from "@radix-ui/themes";
import Image from "next/image";
import { ExternalLink, Trash2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

interface ArchivedReel {
    id: string;
    video_id: string;
    interaction_type: string;
    created_at: string;
    video?: {
        title: string;
        thumbnail: string;
        url: string;
        channel_name: string;
        views: number;
    };
}

export default function ReelsArchivePage() {
    const [archivedReels, setArchivedReels] = useState<ArchivedReel[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchArchivedReels = async () => {
        try {
            setLoading(true);
            const user = getCurrentUser();

            console.log("Fetching interactions for company:", user.companyId);

            // Fetch interactions
            const interactionsUrl = getApiUrl(`/reels/interactions?company_id=${user.companyId}`);
            const response = await fetch(interactionsUrl);
            const data = await response.json();

            console.log("Interactions response:", data);

            if (!response.ok) {
                console.error("Error fetching interactions:", data);
                toast.error("Failed to load archived reels");
                setArchivedReels([]);
                return;
            }

            const interactions = data.interactions || [];
            console.log(`Found ${interactions.length} interactions`);

            if (interactions.length === 0) {
                console.log("No interactions found - check if:");
                console.log("1. Database migration was run");
                console.log("2. You've dismissed or partnered with any reels");
                console.log("3. The API endpoint is working correctly");
            }

            // Fetch video details for each interaction
            const reelsWithDetails = await Promise.all(
                interactions.map(async (interaction: any) => {
                    const { data: video, error } = await supabase
                        .from("creator_videos")
                        .select("*")
                        .eq("video_id", interaction.video_id)
                        .single();

                    if (error) {
                        console.error("Error fetching video details for", interaction.video_id, ":", error);
                        return {
                            ...interaction,
                            video: null
                        };
                    }

                    return {
                        ...interaction,
                        video: video ? {
                            title: video.title,
                            thumbnail: video.thumbnail,
                            url: video.url,
                            channel_name: video.channel_name,
                            views: video.views || 0
                        } : null
                    };
                })
            );

            console.log("Archived reels with details:", reelsWithDetails);
            setArchivedReels(reelsWithDetails);
        } catch (error) {
            console.error("Error fetching archived reels:", error);
            toast.error("Failed to load archived reels");
            setArchivedReels([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArchivedReels();
    }, []);

    const handleUnarchive = async (videoId: string) => {
        try {
            const user = getCurrentUser();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            // Delete the interaction to "unarchive"
            const { error } = await supabase
                .from("reel_interactions")
                .delete()
                .eq("company_id", user.companyId)
                .eq("video_id", videoId);

            if (error) {
                console.error("Error unarchiving reel:", error);
                toast.error("Failed to unarchive reel");
                return;
            }

            toast.success("Reel unarchived! It will appear in your feed again.", {
                duration: 3000,
                position: 'top-center',
            });

            // Refresh the list
            fetchArchivedReels();
        } catch (error) {
            console.error("Error unarchiving reel:", error);
            toast.error("Failed to unarchive reel");
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Reel Archive</h1>
                    <p className="text-gray-600">
                        View and manage previously dismissed or partnered reels
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                ) : archivedReels.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="flex flex-col gap-2">
                            <Text size="5" className="text-gray-500">
                                No archived reels yet
                            </Text>
                            <Text size="2" className="text-gray-400">
                                Dismissed and partnered reels will appear here
                            </Text>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {archivedReels.map((reel) => (
                            <Card key={reel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                {reel.video?.thumbnail && (
                                    <div className="relative w-full h-48 bg-gray-100">
                                        <Image
                                            src={reel.video.thumbnail}
                                            alt={reel.video.title || "Video thumbnail"}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    reel.interaction_type === "dismissed"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-green-100 text-green-700"
                                                }`}
                                            >
                                                {reel.interaction_type === "dismissed" ? "Dismissed" : "Partnered"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4">
                                    <Text size="3" weight="bold" className="mb-2 line-clamp-2">
                                        {reel.video?.title || "Unknown Video"}
                                    </Text>

                                    {reel.video?.channel_name && (
                                        <Text size="2" className="text-gray-500 mb-2">
                                            {reel.video.channel_name}
                                        </Text>
                                    )}

                                    {reel.video?.views !== undefined && (
                                        <Text size="1" className="text-gray-400 mb-3">
                                            {reel.video.views.toLocaleString()} views
                                        </Text>
                                    )}

                                    <Text size="1" className="text-gray-400 mb-4">
                                        {new Date(reel.created_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric"
                                        })}
                                    </Text>

                                    <Flex gap="2" className="mt-4">
                                        {reel.interaction_type === "dismissed" && (
                                            <Button
                                                size="2"
                                                variant="soft"
                                                onClick={() => handleUnarchive(reel.video_id)}
                                                className="flex-1"
                                            >
                                                <RotateCcw size={14} />
                                                Unarchive
                                            </Button>
                                        )}

                                        {reel.video?.url && (
                                            <Button
                                                size="2"
                                                variant="outline"
                                                asChild
                                                className="flex-1"
                                            >
                                                <a
                                                    href={reel.video.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink size={14} />
                                                    View
                                                </a>
                                            </Button>
                                        )}
                                    </Flex>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
