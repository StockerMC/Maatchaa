"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { IconButton, Card, Text, Theme } from "@radix-ui/themes";
import { sage, lime } from "@radix-ui/colors";
import { supabase } from "@/lib/supabase";
import toast from 'react-hot-toast';
import { X, Check, ExternalLink, Info, ChevronUp, ChevronDown } from "lucide-react";

interface ReelData {
    id: string;
    yt_short_url: string;
    product_imgs: string[];
    product_titles?: string[];
    company: string;
    channel_id: string;
    email: string;
    company_id: string;
}

interface YouTubeReelsProps {
    reelsData: ReelData[];
    className?: string;
}

interface MatchedProduct {
    id: string;
    title: string;
    image: string;
    price: number;
}

export default function YouTubeReels({ reelsData, className }: YouTubeReelsProps) {
    const [reelsList, setReelsList] = useState(reelsData);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showInfo, setShowInfo] = useState(false);
    const [swipeStart, setSwipeStart] = useState<number | null>(null);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [matchedProducts, setMatchedProducts] = useState<MatchedProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setReelsList(reelsData);
    }, [reelsData]);

    useEffect(() => {
        // Fetch matched products when current reel changes
        if (reelsList.length > 0 && currentIndex < reelsList.length) {
            fetchMatchedProducts(reelsList[currentIndex]);
        }
    }, [currentIndex, reelsList]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const windowHeight = window.innerHeight;
            const newIndex = Math.round(scrollTop / windowHeight);

            if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reelsList.length) {
                setCurrentIndex(newIndex);
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [currentIndex, reelsList.length]);

    const scrollToReel = (index: number) => {
        if (!containerRef.current) return;
        const windowHeight = window.innerHeight;
        containerRef.current.scrollTo({
            top: index * windowHeight,
            behavior: 'smooth'
        });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setSwipeStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (swipeStart === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - swipeStart;
        setSwipeOffset(diff);
    };

    const handleTouchEnd = () => {
        if (swipeStart === null) return;

        const threshold = 100;
        const currentReel = reelsList[currentIndex];

        if (swipeOffset > threshold) {
            handleInitiatePartnership(currentReel, currentIndex);
        } else if (swipeOffset < -threshold) {
            handleDelete(currentIndex, currentReel.id);
        }

        setSwipeStart(null);
        setSwipeOffset(0);
    };

    const fetchMatchedProducts = async (reel: ReelData) => {
        setLoadingProducts(true);
        try {
            // Get video details to find the video_id
            const { data: videoData, error: videoError } = await supabase
                .from("creator_videos")
                .select("video_id")
                .eq("id", reel.id)
                .single();

            if (videoError || !videoData) {
                console.error("Error fetching video details:", videoError);
                setMatchedProducts([]);
                return;
            }

            // Get matched products for this video
            const { data: matchData, error: matchError } = await supabase
                .from("product_creator_matches")
                .select(`
                    *,
                    company_products (
                        id,
                        title,
                        image,
                        price
                    )
                `)
                .eq("video_id", videoData.video_id)
                .limit(10);

            if (matchError) {
                console.error("Error fetching matched products:", matchError);
                setMatchedProducts([]);
                return;
            }

            const products = matchData?.map((match: any) => ({
                id: match.company_products?.id || '',
                title: match.company_products?.title || 'Unknown Product',
                image: match.company_products?.image || '',
                price: match.company_products?.price || 0,
            })) || [];

            setMatchedProducts(products);
        } catch (error) {
            console.error("Error fetching matched products:", error);
            setMatchedProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleInfoClick = () => {
        if (!showInfo) {
            // Fetch matched products when opening the info popup
            fetchMatchedProducts(reelsList[currentIndex]);
        }
        setShowInfo(!showInfo);
    };

    const handleDelete = async (index: number, reelId: string) => {
        try {
            const currentReel = reelsList[index];

            // Record dismissal interaction
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/reels/interactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    company_id: currentReel.company_id,
                    video_id: currentReel.short_id,
                    interaction_type: "dismissed"
                }),
            });

            if (!response.ok) {
                console.error("Error recording dismissal:", await response.text());
                toast.error("Failed to dismiss reel");
                return;
            }

            // Remove from local list
            const newReelsList = reelsList.filter((_, i) => i !== index);
            setReelsList(newReelsList);

            if (newReelsList.length > 0) {
                setCurrentIndex(Math.min(index, newReelsList.length - 1));
            }

            toast.success("Reel dismissed", {
                duration: 2000,
                position: 'top-center',
            });
        } catch (error) {
            console.error("Error dismissing reel:", error);
            toast.error("Failed to dismiss reel");
        }
    };

    const handleInitiatePartnership = async (reel: ReelData, index: number) => {
        try {
            // Get video details from database
            const { data: videoData, error: videoError } = await supabase
                .from("creator_videos")
                .select("*")
                .eq("id", reel.id)
                .single();

            if (videoError) {
                console.error("Error fetching video details:", videoError);
                toast.error("Failed to fetch video details");
                return;
            }

            // Get matched products for this video
            const { data: matchData, error: matchError } = await supabase
                .from("product_creator_matches")
                .select(`
                    *,
                    company_products (
                        id,
                        title,
                        image,
                        price
                    )
                `)
                .eq("video_id", videoData.video_id)
                .limit(5);

            const matchedProducts = matchData?.map((match: any) => ({
                id: match.company_products?.id,
                title: match.company_products?.title,
                name: match.company_products?.title,
                image: match.company_products?.image,
                price: match.company_products?.price,
            })) || [];

            // Create partnership via API
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/partnerships`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    company_id: reel.company_id,
                    video_id: videoData.video_id,
                    creator_name: videoData.channel_name || "Creator",
                    creator_handle: videoData.channel_name ? `@${videoData.channel_name}` : undefined,
                    creator_email: reel.email,
                    creator_channel_id: reel.channel_id,
                    creator_channel_url: `https://youtube.com/channel/${reel.channel_id}`,
                    video_title: videoData.title,
                    video_url: reel.yt_short_url,
                    video_thumbnail: videoData.thumbnail,
                    video_description: videoData.description,
                    matched_products: matchedProducts,
                    views: videoData.views || 0,
                    likes: videoData.likes || 0,
                    comments: videoData.comments || 0,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                // Check if partnership already exists
                if (response.status === 409) {
                    toast.success("Partnership already exists for this creator!", {
                        duration: 3000,
                        position: 'top-center',
                    });
                } else {
                    throw new Error(error.error || "Failed to create partnership");
                }
            } else {
                toast.success(
                    `✓ Partnership created! Check the Partnerships page.`,
                    {
                        duration: 4000,
                        position: 'top-center',
                    }
                );
            }

            // Record partnered interaction
            const interactionResponse = await fetch(`${apiUrl}/reels/interactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    company_id: reel.company_id,
                    video_id: videoData.video_id,
                    interaction_type: "partnered"
                }),
            });

            if (!interactionResponse.ok) {
                console.error("Error recording partnership interaction:", await interactionResponse.text());
                // Don't fail the whole operation if interaction tracking fails
            }

            // Remove reel from list
            const newReelsList = reelsList.filter((_, i) => i !== index);
            setReelsList(newReelsList);

            if (newReelsList.length > 0) {
                setCurrentIndex(Math.min(index, newReelsList.length - 1));
            }

        } catch (error) {
            console.error("Error initiating partnership:", error);
            toast.error("Failed to create partnership. Please try again.");
        }
    };

    if (reelsList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full text-center">
                <div className="relative w-64 h-64 mb-8">
                    <Image
                        src="https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyMmc0Y2U3cHJ5dW5kdjc0cmtvNzR4cnZ1dXNrM2FlY2lhOXBjeHg2ZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/SS40oFiyppsHhvClo2/200.gif"
                        alt="Labubu"
                        fill
                        className="object-contain"
                    />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    That&apos;s all for now, working hard to find more content...
                </h1>
            </div>
        );
    }

    return (
        <Theme appearance="dark" accentColor="gray">
        <div className="w-full h-screen bg-black" style={{ marginLeft: "190px" }}>
            {/* Scrolling Reels Container */}
            <div
                ref={containerRef}
                className="h-screen overflow-y-auto"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollSnapType: 'y mandatory',
                    scrollSnapStop: 'always',
                }}
            >
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {reelsList.map((reel, index) => {
                    const videoId = reel.yt_short_url.split("=")[1]?.split("&")[0];
                    const isActive = index === currentIndex;

                    return (
                        <div
                            key={reel.id}
                            className="w-full bg-black relative"
                            onTouchStart={isActive ? handleTouchStart : undefined}
                            onTouchMove={isActive ? handleTouchMove : undefined}
                            onTouchEnd={isActive ? handleTouchEnd : undefined}
                            style={{
                                transform: isActive ? `translateX(${swipeOffset}px)` : 'none',
                                transition: swipeStart === null ? 'transform 0.3s ease' : 'none',
                                height: '100vh',
                                scrollSnapAlign: 'start',
                                scrollSnapStop: 'always',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {/* Swipe Overlays */}
                            {isActive && swipeOffset !== 0 && (
                                <>
                                    {swipeOffset > 0 && (
                                        <div
                                            className="absolute inset-0 bg-green-500/30 flex items-center justify-start pl-12 z-5"
                                            style={{ opacity: Math.min(Math.abs(swipeOffset) / 100, 0.8) }}
                                        >
                                            <div className="bg-white rounded-full p-4">
                                                <Check size={48} className="text-green-500" strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}
                                    {swipeOffset < 0 && (
                                        <div
                                            className="absolute inset-0 bg-red-500/30 flex items-center justify-end pr-12 z-5"
                                            style={{ opacity: Math.min(Math.abs(swipeOffset) / 100, 0.8) }}
                                        >
                                            <div className="bg-white rounded-full p-4">
                                                <X size={48} className="text-red-500" strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Video - Centered */}
                            <div style={{ position: "relative", marginLeft: "-200px" }}>
                                <iframe
                                    style={{ width: "500px", height: "calc(100vh - 80px)" }}
                                    src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${isActive ? 1 : 0}&loop=1&mute=1&playlist=${videoId}&controls=0&modestbranding=1`}
                                    title="Reel"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />

                                {/* Matched Products - Left of video */}
                                {isActive && (
                                    <div style={{
                                        position: "absolute",
                                        bottom: "1.5rem",
                                        left: "-270px",
                                        zIndex: 5,
                                        width: "240px",
                                    }}>
                                        <Card
                                            style={{
                                                padding: "1.25rem",
                                                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                                                background: "#FFFFFF",
                                                maxHeight: "calc(100vh - 200px)",
                                                overflowY: "auto",
                                            }}
                                        >
                                            <Text size="3" weight="medium" style={{ marginBottom: "1rem", display: "block", color: "#1F2611" }}>
                                                Matched Products
                                            </Text>

                                            {loadingProducts ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                                </div>
                                            ) : matchedProducts.length > 0 ? (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                    {matchedProducts.map((product) => (
                                                        <div
                                                            key={product.id}
                                                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                                                                {product.image && (
                                                                    <Image
                                                                        src={product.image}
                                                                        alt={product.title}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-gray-900 line-clamp-2">
                                                                    {product.title}
                                                                </p>
                                                                {product.price > 0 && (
                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                        ${product.price.toFixed(2)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-xs text-gray-500">No products matched</p>
                                                </div>
                                            )}
                                        </Card>
                                    </div>
                                )}
                            </div>

                            {/* Info Overlay */}
                            {showInfo && isActive && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center p-8">
                                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto">
                                        <div className="flex justify-between items-start mb-4">
                                            <h2 className="text-2xl font-bold text-gray-900">Your Matched Products</h2>
                                            <button
                                                onClick={() => setShowInfo(false)}
                                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {loadingProducts ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                                </div>
                                            ) : matchedProducts.length > 0 ? (
                                                matchedProducts.map((product) => (
                                                    <div key={product.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                                                            {product.image && (
                                                                <Image
                                                                    src={product.image}
                                                                    alt={product.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {product.title}
                                                            </p>
                                                            {product.price > 0 && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    ${product.price.toFixed(2)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-gray-50 rounded-lg p-6 text-center">
                                                    <p className="text-gray-500 text-sm">No products matched yet</p>
                                                    <p className="text-gray-400 text-xs mt-1">Products will appear after matching</p>
                                                </div>
                                            )}
                                        </div>
                                        <a
                                            href={reel.yt_short_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 w-full bg-lime-9 hover:bg-lime-10 text-white px-4 py-3 rounded-lg font-medium transition-colors inline-block text-center shadow-md"
                                        >
                                            Open on YouTube
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Button Column - Snug to right of video */}
                            <div style={{
                                position: "absolute",
                                top: "50%",
                                right: "520px",
                                transform: "translateY(-50%)",
                                display: isActive ? "flex" : "none",
                                flexDirection: "column",
                                gap: "0.75rem",
                                zIndex: 10,
                            }}>
                    <IconButton
                        variant="solid"
                        size="3"
                        radius="full"
                        color="gray"
                        onClick={() => {
                            if (currentIndex > 0) {
                                scrollToReel(currentIndex - 1);
                            }
                        }}
                        style={{ cursor: "pointer", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)", background: "rgba(255, 255, 255, 0.95)" }}
                    >
                        <ChevronUp size={20} color="#1F2611" />
                    </IconButton>

                    <IconButton
                        variant="solid"
                        size="3"
                        radius="full"
                        color="gray"
                        onClick={() => {
                            if (currentIndex < reelsList.length - 1) {
                                scrollToReel(currentIndex + 1);
                            }
                        }}
                        style={{ cursor: "pointer", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)", background: "rgba(255, 255, 255, 0.95)" }}
                    >
                        <ChevronDown size={20} color="#1F2611" />
                    </IconButton>

                    <IconButton
                        variant="solid"
                        size="3"
                        radius="large"
                        color="lime"
                        onClick={() => {
                            if (reelsList[currentIndex]) {
                                handleInitiatePartnership(reelsList[currentIndex], currentIndex);
                            }
                        }}
                        style={{
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        }}
                    >
                        <Check size={18} strokeWidth={2} color="#000" />
                    </IconButton>

                    <IconButton
                        variant="soft"
                        size="3"
                        radius="large"
                        onClick={() => {
                            if (reelsList[currentIndex]) {
                                handleDelete(currentIndex, reelsList[currentIndex].id);
                            }
                        }}
                        style={{
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                            background: "rgba(248, 31, 31, 0.9)",
                            border: "1px solid rgba(248, 31, 31, 1)",
                            backdropFilter: "blur(8px)"
                        }}
                    >
                        <X size={18} strokeWidth={2} color="#FFFFFF" />
                    </IconButton>

                    <IconButton
                        variant="solid"
                        size="3"
                        radius="full"
                        color="gray"
                        onClick={handleInfoClick}
                        style={{ cursor: "pointer", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)", background: "rgba(255, 255, 255, 0.95)" }}
                    >
                        <Info size={20} color="#1F2611" />
                    </IconButton>

                    <IconButton
                        variant="solid"
                        size="3"
                        radius="full"
                        color="gray"
                        asChild
                        style={{ cursor: "pointer", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)", background: "rgba(255, 255, 255, 0.95)" }}
                    >
                        <a
                            href={reelsList[currentIndex]?.yt_short_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink size={20} color="#1F2611" />
                        </a>
                    </IconButton>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        </Theme>
    );
}
