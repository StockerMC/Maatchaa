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
    const [progressTime, setProgressTime] = useState(0);
    const startTimeRef = useRef<number>(Date.now());
    const pausedAtEndRef = useRef(false);

    useEffect(() => {
        // Independent 60fps timer that loops every 10 seconds (9.9s progress + 0.1s pause)
        let animationFrameId: number;

        const updateProgress = () => {
            const elapsed = (Date.now() - startTimeRef.current) / 1000; // Convert to seconds
            const loopedTime = elapsed % 10; // Loop every 10 seconds total

            // Hold at 9.9 seconds for 0.1 seconds before resetting
            if (loopedTime >= 9.9) {
                setProgressTime(9.9);
                pausedAtEndRef.current = true;
            } else {
                setProgressTime(loopedTime);
                pausedAtEndRef.current = false;
            }

            animationFrameId = requestAnimationFrame(updateProgress);
        };

        animationFrameId = requestAnimationFrame(updateProgress);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Calculate which step is active based on independent progress time
    const getStepProgress = (stepNumber: number) => {
        const stepDuration = 2.475; // Each step is 2.475 seconds (9.9 / 4)
        const stepStart = (stepNumber - 1) * stepDuration;
        const stepEnd = stepNumber * stepDuration;

        if (progressTime < stepStart) return 0;
        if (progressTime >= stepEnd) return 100;

        const progress = ((progressTime - stepStart) / stepDuration) * 100;
        return Math.min(progress, 100);
    };

    return (
        <>
            {/* Video */}
            <div className="mb-12 max-w-4xl mx-auto">
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
                            <div className="relative h-1 bg-white/10 rounded-full overflow-hidden mb-3.5">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#b1fa8b] to-[#d4ff9a] rounded-full"
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
