import YouTubeReels from "@/components/YoutubeReels";
import { supabase } from "@/lib/supabase";

export default async function ReelsPage() {

    const { data: yt_shorts_pending, error } = await supabase
        .from("yt_shorts_pending")
        .select("*")
        .eq("company", "https://matchamatcha.ca");

    if (error) {
        console.error("Error fetching reels:", error);
        return <div className="text-8xl font-semibold">500 internal error :3</div>;
    }

    console.log(yt_shorts_pending);

    return (
        <div className="relative">
            <YouTubeReels reelsData={yt_shorts_pending || []}/>
        </div>
    );
}