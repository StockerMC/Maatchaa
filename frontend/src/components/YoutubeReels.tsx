"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { IconButton, Card, Text, Theme } from "@radix-ui/themes";
import { sage, lime, sand } from "@radix-ui/colors";
import { supabase } from "@/lib/supabase";
import toast from 'react-hot-toast';
import { X, Check, MessageCircle, Info, ChevronUp, ChevronDown } from "lucide-react";

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

export default function YouTubeReels({ reelsData, className }: YouTubeReelsProps) {
    const [reelsList, setReelsList] = useState(reelsData);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showInfo, setShowInfo] = useState(false);
    const [swipeStart, setSwipeStart] = useState<number | null>(null);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setReelsList(reelsData);
    }, [reelsData]);

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

    const handleDelete = async (index: number, reelId: string) => {
        try {
            const { error } = await supabase
                .from("yt_shorts_pending")
                .delete()
                .eq("id", reelId);

            if (error) {
                console.error("Error deleting reel:", error);
                return;
            }

            const newReelsList = reelsList.filter((_, i) => i !== index);
            setReelsList(newReelsList);

            if (newReelsList.length > 0) {
                setCurrentIndex(Math.min(index, newReelsList.length - 1));
            }
        } catch (error) {
            console.error("Error deleting reel:", error);
        }
    };

    const handleInitiatePartnership = async (reel: ReelData, index: number) => {
        toast.success(
            `📧 Partnership email sent to the creator!`,
            {
                duration: 4000,
                position: 'top-center',
            }
        );

        const newReelsList = reelsList.filter((_, i) => i !== index);
        setReelsList(newReelsList);

        if (newReelsList.length > 0) {
            setCurrentIndex(Math.min(index, newReelsList.length - 1));
        }

        try {
            await fetch("/api/initiate-partnership", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    companyId: reel.company,
                    shortId: reel.id,
                    channelId: reel.channel_id,
                    email: reel.email,
                }),
            });
        } catch (error) {
            console.error("Error initiating partnership:", error);
            toast.error("Failed to send partnership email. Please try again.");
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

                                {/* Matched Products - Snug to left of video */}
                                {reel.product_imgs && reel.product_imgs.length > 0 && (
                                    <div style={{
                                        position: "absolute",
                                        bottom: "1.5rem",
                                        left: "-250px",
                                        zIndex: 5,
                                    }}>
                                        <Card
                                            style={{
                                                padding: "1.25rem",
                                                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                                                width: "220px",
                                                background: "#FFFFFF",
                                           }}
                                        >
                                            <Text size="3" weight="medium" style={{ marginBottom: "1rem", display: "block", color: "#1F2611" }}>
                                                Matched Products
                                            </Text>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                                {reel.product_imgs.slice(0, 6).map((imgSrc, imgIndex) => {
                                                    const productTitle = reel.product_titles?.[imgIndex] || `Product ${imgIndex + 1}`;
                                                    return (
                                                        <div
                                                            key={imgIndex}
                                                            className="rounded-lg overflow-hidden relative group cursor-pointer"
                                                            style={{
                                                                width: "90px",
                                                                height: "90px",
                                                                border: `1px solid ${sand.sand5}`
                                                            }}
                                                        >
                                                            {imgSrc && (
                                                                <>
                                                                    <Image
                                                                        src={imgSrc}
                                                                        alt={productTitle}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                                                                        <span className="text-white text-[11px] font-medium leading-tight">
                                                                            {productTitle}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </div>

                            {/* Info Overlay */}
                            {showInfo && isActive && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center p-8">
                                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <h2 className="text-2xl font-bold text-gray-900">Creator Details</h2>
                                            <button
                                                onClick={() => setShowInfo(false)}
                                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>
                                        <div className="space-y-3 text-sm">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <span className="font-semibold text-gray-700 block mb-1">Channel</span>
                                                <p className="text-gray-600">{reel.channel_id}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <span className="font-semibold text-gray-700 block mb-1">Email</span>
                                                <p className="text-gray-600">{reel.email}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <span className="font-semibold text-gray-700 block mb-1">Products Matched</span>
                                                <p className="text-gray-600">{reel.product_imgs?.length || 0} products</p>
                                            </div>
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
                        onClick={() => setShowInfo(!showInfo)}
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
                            <MessageCircle size={20} color="#1F2611" />
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
