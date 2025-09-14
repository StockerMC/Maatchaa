"use client";

import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";

interface YouTubeReelsProps {
    videos: string[];
    productImages: string[][];
    className?: string;
}

export default function YouTubeReels({ videos, productImages, className }: YouTubeReelsProps) {
    return (
        <div className="overflow-hidden h-[1000px] w-[700px]">
            <Carousel className="w-full h-full max-w-xs" opts={{ loop: true }} orientation="vertical">
                <CarouselContent className="h-[800px] w-[700px]">
                    {videos.map((videoId, index) => (
                        <CarouselItem key={index}>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-2">
                                    {productImages[index] && productImages[index].map((imgSrc, imgIndex) => (
                                        <img
                                            key={imgIndex}
                                            src={imgSrc}
                                            alt={`Product ${imgIndex + 1}`}
                                            className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                                        />
                                    ))}
                                </div>
                                <iframe
                                    key={index}
                                    className="h-[800px] w-[500px]"
                                    src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&mute=1&playlist=${videoId}&controls=0`}
                                    title="Maatchaa Reels"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                />
                                <div className="cursor-pointer flex flex-col gap-4">
                                    <button
                                        className="cursor-pointer bg-[#e6e1c5] hover:bg-[#d9d4ba] text-gray-900 font-semibold w-12 h-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                                        ✓
                                    </button>
                                    <button
                                        className="cursor-pointer bg-[#e6e1c5] hover:bg-[#d9d4ba] text-gray-900 font-semibold w-12 h-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                                        X
                                    </button>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
