"use client"
import React, { useRef, useEffect, useState } from 'react';
import { Text } from "@radix-ui/themes";
import { ChevronRight } from 'lucide-react';

interface Step {
    number: number;
    title: string;
    description: string;
}

const steps: Step[] = [
    {
        number: 1,
        title: "AI Matching",
        description: "We match your store's products to trending YouTube creators."
    },
    {
        number: 2,
        title: "Approval Flow",
        description: "Swipe through your top creator pairings, Tinder-style."
    },
    {
        number: 3,
        title: "Outreach",
        description: "Maatchaa drafts outreach emails and sponsorship contracts."
    },
    {
        number: 4,
        title: "Track Performance",
        description: "Our affiliate links help quantify your campaign's effectiveness."
    }
];

export default function VideoStepSync() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(10);
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

    // Calculate progress based on video time divided equally among steps
    const getStepProgress = (stepNumber: number) => {
        const totalSteps = steps.length;
        const stepDuration = duration / totalSteps;
        const stepStart = (stepNumber - 1) * stepDuration;
        const stepEnd = stepNumber * stepDuration;

        if (currentTime < stepStart) return 0;
        if (currentTime >= stepEnd) return 100;

        const progress = ((currentTime - stepStart) / stepDuration) * 100;
        return Math.min(Math.max(progress, 0), 100);
    };

    return (
        <>
            {/* Video */}
            <div className="mb-12 max-w-4xl mx-auto">
                <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ position: 'relative', height: '500px' }}>
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
                                    ? 'rgba(177, 250, 139, 0.05)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                border: isActive
                                    ? '1px solid rgba(177, 250, 139, 0.15)'
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: isActive
                                    ? '0 4px 16px rgba(177, 250, 139, 0.06)'
                                    : '0 4px 16px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            {/* Progress Bar at Top */}
                            <div className="relative h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#b1fa8b] to-[#d4ff9a] rounded-full transition-all duration-300"
                                    style={{
                                        width: `${progress}%`,
                                        boxShadow: isActive ? '0 0 6px rgba(177, 250, 139, 0.3)' : 'none'
                                    }}
                                ></div>
                            </div>

                            {/* Title */}
                            <Text
                                size="5"
                                weight="bold"
                                className="block transition-colors duration-300"
                                style={{
                                    color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                                    lineHeight: 1.3,
                                    marginBottom: '0.75rem'
                                }}
                            >
                                {step.title}
                            </Text>

                            {/* Description with inline ChevronRight icon */}
                            <div className="flex items-start gap-2">
                                <ChevronRight
                                    size={20}
                                    className="flex-shrink-0 mt-0.5 transition-all duration-300"
                                    style={{
                                        color: isActive ? '#b1fa8b' : 'rgba(255, 255, 255, 0.5)',
                                        opacity: isActive ? 1 : 0.6
                                    }}
                                />
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
                        </div>
                    );
                })}
            </div>
        </>
    );
}
