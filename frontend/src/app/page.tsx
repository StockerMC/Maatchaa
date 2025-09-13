import Gradient from "@/components/Gradient";
import PhoneComponent from "@/components/Phone";
import SquigglyUnderlineText from "@/components/SquigglyUnderlineText";

export default function Home() {
    return (
        <div className="flex items-center justify-center w-full h-full overflow-hidden">
            {/* Absolute positioned background */}
            <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
                <Gradient
                    className="w-full h-full"
                    gradientColors={[
                        "#8FAF6F", // Light matcha green
                        "#9AAF85", // Matcha green
                        "#A8B894", // Green-beige transition
                        "#C4C0A8", // Warm beige-green
                        "#C4C0A8", // Soft beige
                    ]}
                    noise={0.1}
                    spotlightRadius={0.6}
                    spotlightOpacity={0}
                    distortAmount={0.1}
                    mirrorGradient={false}
                    angle={0}
                    paused={true}
                />
            </div>

            <div
                className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-7xl w-full mx-auto z-10">
                {/* Hero Text */}
                <div className="text-center lg:text-left lg:flex-1 w-full">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 drop-shadow-2xl text-balance leading-tight">
                        Tie your content to the right sponsors with{" "}
                        <SquigglyUnderlineText>Maatchaa</SquigglyUnderlineText>
                    </h1>
                    <p className="text-lg md:text-xl text-white drop-shadow-lg max-w-2xl mx-auto lg:mx-0 font-light mb-8">
                        Connect authentic creators with brands through seamless collaboration and engagement
                    </p>
                    <button
                        className="bg-[#e6e1c5] hover:bg-[#d9d4ba] text-gray-900 font-semibold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                        Get Started
                    </button>
                </div>

                <div className="lg:flex-1 flex justify-center items-center w-full">
                    <PhoneComponent
                        image="/images/img.png"
                        alt="YouTube Shorts creator content"
                    />
                </div>
            </div>
        </div>
    );
}
