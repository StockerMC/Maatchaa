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
            <div className="mb-20 max-w-5xl mx-auto">
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl" style={{ position: 'relative' }}>
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

            {/* 4-Step Flow with Animated Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((step) => {
                    const progress = getStepProgress(step.number);

                    return (
                        <div key={step.number} className="space-y-4">
                            <div className="mb-4 relative">
                                {/* Gray outline background */}
                                <div className="w-full h-0.5 bg-white/20 rounded-full"></div>
                                {/* Green fill that animates smoothly */}
                                <div
                                    className="absolute top-0 left-0 h-0.5 bg-[#A8E64A] rounded-full"
                                    style={{
                                        width: `${progress}%`
                                    }}
                                ></div>
                            </div>
                            <Text size="2" weight="medium" className="block" style={{ color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Step {step.number}
                            </Text>
                            <Text size="5" weight="bold" className="block" style={{ color: '#FFFFFF' }}>
                                {step.title}
                            </Text>
                            <Text size="3" className="block" style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}>
                                {step.description}
                            </Text>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
