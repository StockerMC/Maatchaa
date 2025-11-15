    "use client";

import { useState } from "react";
import Image from "next/image";

export function ProductImages({ data }: { data: { main_image_url: string, showcase_images: string[] } }) {
    const [currentImage, setCurrentImage] = useState(data.main_image_url);

    return <>
        <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative">
            <Image
                src={currentImage}
                alt="Matcha"
                fill
                className="object-cover"
            />
        </div>

        <div className="flex gap-3">
            <div
                className="w-20 h-20 bg-muted rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent transition-all relative"
            >
                <Image
                    onClick={() => setCurrentImage(data.main_image_url)}
                    src={data.main_image_url}
                    alt={`Maatchaa`}
                    fill
                    className="rounded-lg object-cover"
                />
            </div>
            {data.showcase_images.map((url: string, index: number) => (
                <div
                    key={index}
                    className="w-20 h-20 bg-muted rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent transition-all relative"
                >
                    <Image
                        onClick={() => setCurrentImage(url)}
                        src={url}
                        alt={`Maatchaa ${index + 1}`}
                        fill
                        className="rounded-lg object-cover"
                    />
                </div>
            ))}

        </div>
    </>;
}