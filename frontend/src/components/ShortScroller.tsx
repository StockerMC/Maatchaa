"use client";

import * as React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const baseImages = ["images/img1.png", "images/img2.png", "images/img3.png", "images/img4.png"];
// Duplicate the images multiple times to create enough slides for seamless looping
const images = [...baseImages, ...baseImages, ...baseImages];

export function ShortScroller() {
    const plugin = React.useRef(
        Autoplay({ delay: 2000, stopOnInteraction: false })
    );

    return (
        <Carousel
            className="w-full h-full max-w-xs"
            opts={{
                loop: true,
                align: 'start',
                skipSnaps: false,
            }}
            orientation="vertical"
            plugins={[plugin.current]}
        >
            <CarouselContent className="h-[450px] mt-12">
                {images.map((image, index) => (
                    <CarouselItem key={index} className="relative">
                        <Image
                            src={image}
                            alt={`Image ${(index % baseImages.length) + 1}`}
                            fill
                            className="object-cover rounded-lg"
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}
