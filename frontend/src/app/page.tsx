import GradientBlinds from "@/components/GradientBlinds"

export default function Home() {
        return (
            <div className="flex items-center justify-center w-full h-full overflow-hidden">
            {/* Absolute positioned background */}
            <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
                <GradientBlinds
                    className="w-full h-full"
                    gradientColors={[
                        "#FFDC80", // Instagram yellow
                        "#FFAA40", // Instagram orange
                        "#FF6B9D", // Instagram pink
                        "#C44569", // Instagram deep pink
                        "#8B5FBF", // Instagram purple
                    ]}
                    blindCount={12}
                    noise={0.2}
                    spotlightRadius={0.6}
                    spotlightOpacity={0.4}
                    distortAmount={0.1}
                    mirrorGradient={false}
                    shineDirection="right"
                    angle={45}
                />
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-7xl w-full mx-auto z-10">        {/* Hero Text */}
    <div className="text-center lg:text-left lg:flex-1 w-full">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 drop-shadow-2xl text-balance leading-tight">
            Tie your next creator with your brand using{" "}
            <span className="text-yellow-400 font-semibold">Knotch</span>
        </h1>
        <p className="text-lg md:text-xl text-white drop-shadow-lg max-w-2xl mx-auto lg:mx-0 font-light">
            Connect authentic creators with brands through seamless collaboration and engagement
        </p>
    </div>

    <div className="lg:flex-1 flex justify-center items-center w-full">
        <div className="relative w-72 h-[580px] transform hover:scale-105 transition-transform duration-300">
            {/* iPhone frame */}
            <img
                src="/images/iphone.png"
                alt="iPhone mockup"
                className="absolute inset-0 w-full h-full object-contain z-20"
            />
            <div className="absolute top-[10px] left-[10px] right-[10px] bottom-[10px] rounded-[32px] overflow-hidden z-10">
                <img
                    src="/images/img.png"
                    alt="YouTube Shorts creator content"
                    className="w-[130%] h-[120%] object-cover -translate-y-[10%]"
                />
            </div>
        </div>
    </div>
</div>
</div>
    )
}
