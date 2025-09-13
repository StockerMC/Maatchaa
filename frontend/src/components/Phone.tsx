"use client"
import { useState, useEffect } from "react"

interface PhoneComponentProps {
    image: string
    alt?: string
    className?: string
}

export default function PhoneComponent({ image, alt = "Phone content", className = "" }: PhoneComponentProps) {
    const [currentTime, setCurrentTime] = useState("")

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            setCurrentTime(
                now.toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            )
        }

        updateTime()
        const interval = setInterval(updateTime, 1000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className={`relative ${className}`}>
            {/* iPhone Mockup using provided image */}
            <div className="relative w-[375px] h-[812px]">
                {/* iPhone Frame Image */}
                <img
                    src="/images/iphone-mockup.png"
                    alt="iPhone Frame"
                    className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none"
                />

                <div className="absolute top-[28px] left-[18px] right-[18px] bottom-[28px] bg-white rounded-[36px] overflow-hidden z-0">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-6 pb-2 text-black text-sm font-medium pt-7">
                        <span className="font-semibold">{currentTime}</span>
                        <div className="flex items-center gap-1">
                            <div className="flex gap-1">
                                <div className="w-1 h-1 bg-black rounded-full"></div>
                                <div className="w-1 h-1 bg-black rounded-full"></div>
                                <div className="w-1 h-1 bg-black rounded-full"></div>
                                <div className="w-1 h-1 bg-black/50 rounded-full"></div>
                            </div>
                            <svg className="w-5 h-3 ml-1" viewBox="0 0 24 16" fill="none">
                                <rect x="1" y="4" width="18" height="8" rx="2" stroke="black" strokeWidth="1" fill="black" />
                                <rect x="20" y="6" width="2" height="4" rx="1" fill="black" />
                            </svg>
                        </div>
                    </div>

                    {/* Content Area - Display the provided image */}
                    <div className="flex-1 p-4 flex items-center justify-center">
                        <img
                            src={image || "/placeholder.svg"}
                            alt={alt}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    </div>

                    {/* Home Indicator */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <div className="flex justify-center flex-row pb-3">
                            <div className="w-24 bg-black rounded-full py-0 h-1 my-1.5"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
