"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ShortScroller } from "./ShortScroller";

interface PhoneComponentProps {
    className?: string;
}

export default function PhoneComponent({ className = "" }: PhoneComponentProps) {
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            );
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`relative ${className}`}>
            {/* iPhone Mockup using provided image */}
            <div className="relative w-[300px] h-[650px]">
                {/* iPhone Frame Image */}
                <Image
                    src="/images/iphone.png"
                    alt="iPhone Frame"
                    fill
                    className="object-contain z-10 pointer-events-none"
                />

                {/* Content Area */}
                <div
                    className="absolute top-[28px] left-[14px] right-[14px] bottom-[28px] rounded-[40px] overflow-hidden z-0 flex flex-col bg-black">
                    {/* Status Bar */}
                    <div
                        className="flex justify-between items-center px-6 text-white text-sm font-medium pt-4 z-10 shrink-0">
                        <span className="font-semibold">{currentTime}</span>
                        <div className="flex items-center gap-1">
                            <div className="flex gap-1">
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                            </div>
                            <svg className="w-5 h-3 ml-1" viewBox="0 0 24 16" fill="none">
                                <rect x="1" y="4" width="18" height="8" rx="2" stroke="white" strokeWidth="1"
                                      fill="white"/>
                                <rect x="20" y="6" width="2" height="4" rx="1" fill="white"/>
                            </svg>
                        </div>
                    </div>

                    <div>
                        <ShortScroller/>
                    </div>
                </div>
            </div>
        </div>
    );
}