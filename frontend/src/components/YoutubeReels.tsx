"use client";

import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";

interface YouTubeReelsProps {
    reelsData: ReelData[];
    className?: string;
}

export default function YouTubeReels({ reelsData, className }: YouTubeReelsProps) {
    const [reelsList, setReelsList] = useState(reelsData);

    const handleDelete = async (index: number, reelId: string) => {
        try {
            // Delete from Supabase
            const { error } = await supabase
                .from("yt_shorts_pending")
                .delete()
                .eq("id", reelId);

            if (error) {
                console.error("Error deleting reel:", error);
                return;
            }

            // Remove from local state if deletion was successful
            const newReelsList = reelsList.filter((_, i) => i !== index);
            setReelsList(newReelsList);
        } catch (error) {
            console.error("Error deleting reel:", error);
        }
    };

    return (
        <div className="overflow-hidden h-[1000px] w-[700px]">
            <Carousel className="w-full h-full max-w-xs" opts={{ loop: true }} orientation="vertical">
                <CarouselContent className="h-[800px] w-[700px]">
                    {reelsList.map((reel, index) => {
                        const videoId = reel.yt_short_url.split("=")[1];
                        return (
                            <CarouselItem key={reel.id}>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-2">
                                        {reel.product_imgs && reel.product_imgs.map((imgSrc, imgIndex) => (
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
                                            onClick={() => handleDelete(index, reel.id)}
                                            className="cursor-pointer bg-[#e6e1c5] hover:bg-[#d9d4ba] text-gray-900 font-semibold w-12 h-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                                            X
                                        </button>
                                    </div>
                                </div>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
