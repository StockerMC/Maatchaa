import YouTubeReels from "@/components/YoutubeReels";
import { supabase } from "@/lib/supabase";

export default async function ReelsPage() {

    let { data: yt_shorts_pending, error } = await supabase
        .from("yt_shorts_pending")
        .select("*")
        .eq("company", "https://matchamatcha.ca");

    if (error) {
        console.error("Error fetching reels:", error);
        return <div className="text-8xl font-semibold">500 internal error :3</div>;
    }

    const urlIds = yt_shorts_pending?.map((item) => {
        const split = item.yt_short_url.split("=");
        return split[1];
    }) || [];

    const productImages = yt_shorts_pending?.map((item) => item.product_imgs!) || [];

    console.log(urlIds);


    return (
        <div className="relative">
            <YouTubeReels videos={urlIds} productImages={productImages}/>
        </div>
    );
}