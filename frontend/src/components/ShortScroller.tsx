"use client";

import * as React from "react";

import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext } from "@/components/ui/carousel";
import { useState } from "react";

let images = ["images/img1.png", "images/img2.png", "images/img3.png", "images/img4.png"];

export function ShortScroller() {
    const [api, setApi] = useState<CarouselApi>();
    React.useEffect(() => {
        if (!api) return;
        const interval = setInterval(() => {
            api.scrollNext();
        }, 2000);
        return () => clearInterval(interval);
    }, [api]);

    return (
        <Carousel setApi={setApi} className="w-full h-full max-w-xs" opts={{ loop: true }} orientation="vertical">
            <CarouselContent className="h-[450px]">
                {Array.from({ length: 4 }).map((_, index) => (
                    <CarouselItem key={index}>
                        <img
                            src={images[index % images.length]}
                            alt={`Image ${index + 1}`}
                            className="pt-32 w-full h-full object-cover rounded-lg"
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}
