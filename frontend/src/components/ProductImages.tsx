"use client";

import { useState } from "react";

export function ProductImages({ data }: { data: any }) {
    const [currentImage, setCurrentImage] = useState(data.main_image_url);

    return <>
        <div className="aspect-square bg-muted rounded-2xl overflow-hidden">
            <img
                src={currentImage}
                alt="Matcha"
                className="w-full h-full object-cover"
            />
        </div>

        <div className="flex gap-3">
            <div
                className="w-20 h-20 bg-muted rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent transition-all"
            >
                <img
                    onClick={() => setCurrentImage(data.main_image_url)}
                    src={data.main_image_url}
                    alt={`Maatchaa`}
                    className="w-full h-full rounded-lg object-cover"
                />
            </div>
            {data.showcase_images.map((url: string, index: number) => (
                <div
                    key={index}
                    className="w-20 h-20 bg-muted rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent transition-all"
                >
                    <img
                        onClick={() => setCurrentImage(url)}
                        src={url}
                        alt={`Maatchaa ${index + 1}`}
                        className="w-full h-full rounded-lg object-cover"
                    />
                </div>
            ))}

        </div>
    </>;
}