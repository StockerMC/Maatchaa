"use client"
import React, { useRef, useEffect, useState } from 'react';
import { Text } from "@radix-ui/themes";

interface Step {
    number: number;
    title: string;
    description: string;
    barWidth: string;
}

const steps: Step[] = [
    {
        number: 1,
        title: "AI Matching",
        description: "Our algorithm matches your store's products to trending YouTube creators.",
        barWidth: "32"
    },
    {
        number: 2,
        title: "Approval Flow",
        description: "Swipe through your top creator pairings, Tinder-style.",
        barWidth: "40"
    },
    {
        number: 3,
        title: "Outreach",
        description: "Maatchaa drafts outreach emails and sponsorship contracts.",
        barWidth: "48"
    },
    {
        number: 4,
        title: "Track Performance",
        description: "Our affiliate links help quantify your campaign's effectiveness.",
        barWidth: "56"
    }
];

export default function VideoStepSync() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [, setDuration] = useState(10); // Default 10 seconds
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            setDuration(video.duration || 10);
        };

        // Use requestAnimationFrame for 60fps smooth updates
        const updateProgress = () => {
            if (video && !video.paused) {
                setCurrentTime(video.currentTime);
            }
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        animationFrameRef.current = requestAnimationFrame(updateProgress);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Calculate which step is active based on video progress
    const getStepProgress = (stepNumber: number) => {
        const stepDuration = 2.5; // Each step is 2.5 seconds
        const stepStart = (stepNumber - 1) * stepDuration;
        const stepEnd = stepNumber * stepDuration;

        if (currentTime < stepStart) return 0;
        if (currentTime >= stepEnd) return 100;

        const progress = ((currentTime - stepStart) / stepDuration) * 100;
        return Math.min(progress, 100);
    };

    return (
        <>
            {/* Video */}
            <div className="-mt-6 mb-12 max-w-4xl mx-auto">
                <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ position: 'relative' }}>
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                    >
                        <source src="/images/video.mp4" type="video/mp4" />
                    </video>
                </div>
            </div>

            {/* 4-Step Flow with Modern Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((step) => {
                    const progress = getStepProgress(step.number);
                    const isActive = progress > 0 && progress < 100;

                    return (
                        <div
                            key={step.number}
                            className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
                            style={{
                                background: isActive
                                    ? 'rgba(177, 250, 139, 0.08)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                border: isActive
                                    ? '1px solid rgba(177, 250, 139, 0.25)'
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: isActive
                                    ? '0 4px 20px rgba(177, 250, 139, 0.1)'
                                    : '0 4px 16px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            {/* Progress Bar at Top */}
                            <div className="mb-6 relative h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#b1fa8b] to-[#d4ff9a] rounded-full transition-all duration-300"
                                    style={{
                                        width: `${progress}%`,
                                        boxShadow: isActive ? '0 0 8px rgba(177, 250, 139, 0.4)' : 'none'
                                    }}
                                ></div>
                            </div>

                            {/* Step Number */}
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-base transition-all duration-300"
                                    style={{
                                        background: isActive
                                            ? 'linear-gradient(135deg, #b1fa8b 0%, #d4ff9a 100%)'
                                            : 'rgba(255, 255, 255, 0.1)',
                                        color: isActive ? '#1A1A1A' : 'rgba(255, 255, 255, 0.6)',
                                        boxShadow: isActive ? '0 2px 12px rgba(177, 250, 139, 0.25)' : 'none'
                                    }}
                                >
                                    {step.number}
                                </div>
                                <Text
                                    size="1"
                                    weight="medium"
                                    className="block"
                                    style={{
                                        color: isActive ? '#b1fa8b' : 'rgba(255, 255, 255, 0.5)',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        fontSize: '11px'
                                    }}
                                >
                                    Step {step.number}
                                </Text>
                            </div>

                            {/* Title */}
                            <Text
                                size="5"
                                weight="bold"
                                className="block mb-3 transition-colors duration-300"
                                style={{
                                    color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                                    lineHeight: 1.3
                                }}
                            >
                                {step.title}
                            </Text>

                            {/* Description */}
                            <Text
                                size="2"
                                className="block"
                                style={{
                                    color: 'rgba(255, 255, 255, 0.65)',
                                    lineHeight: 1.6
                                }}
                            >
                                {step.description}
                            </Text>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
