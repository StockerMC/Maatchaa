"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";

interface PhoneImageScrollerProps {
    images: string[];
    duration?: number; // ms for one full scroll
}

export default function PhoneImageScroller({ images, duration = 4000 }: PhoneImageScrollerProps) {
    const scrollerRef = useRef<HTMLDivElement>(null);

    // Duplicate images for seamless looping
    const allImages = [...images, ...images];

    useEffect(() => {
        if (!scrollerRef.current || images.length < 2) return;

        let frame: number;
        let start: number | null = null;
        const imageHeight = scrollerRef.current.scrollHeight / allImages.length;
        const maxOffset = imageHeight * images.length + 250;

        function animateScroll(ts: number) {
            if (start === null) start = ts;
            const elapsed = (ts - start) % duration;
            const progress = elapsed / duration;
            let offset = progress * maxOffset;

            // Reset to start when reaching the end of the original images
            if (offset >= maxOffset) {
                offset = 0;
                start = ts;
            }

            scrollerRef.current!.style.transform = `translateY(-${offset}px)`;
            frame = requestAnimationFrame(animateScroll);
        }

        frame = requestAnimationFrame(animateScroll);
        return () => cancelAnimationFrame(frame);
    }, [images, duration, allImages.length]);

    return (
        <div className="relative overflow-hidden">
            <div ref={scrollerRef} className="flex flex-col transition-none">
                {allImages.map((src, i) => (
                    <div key={i} className="relative w-full h-full min-h-[200px]">
                        <Image
                            src={src}
                            alt={`phone-img-${i}`}
                            fill
                            className="object-contain"
                            draggable={false}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}