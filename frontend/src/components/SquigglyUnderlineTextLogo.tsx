"use client";

import { ReactNode } from "react";

interface SquigglyUnderlineTextLogoProps {
    children: ReactNode;
}

export default function SquigglyUnderlineTextLogo({ children }: SquigglyUnderlineTextLogoProps) {
    return (
        <span className="relative inline-block">
            <span className="text-[#8ebd55] font-bold relative z-10 text-xl">{children}</span>
            <svg
                className="absolute pt-1 left-0 bottom-[-13px] w-full h-[40px] z-0"
                viewBox="0 0 300 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ pointerEvents: "none" }}
            >
                <path
                    d="M5 15 Q40 5, 80 15 Q120 25, 155 10"
                    stroke="#8a9a6b"
                    strokeWidth="4"
                    fill="none"
                    transform="scale(2,1)"
                />
            </svg>
        </span>
    );
}