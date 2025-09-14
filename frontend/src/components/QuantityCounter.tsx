"use client";

import { useState } from "react";

export function QuantityCounter() {
    const [quantity, setQuantity] = useState(1);
    return <>
        <h1 className="mb-1 font-medium">Quantity</h1>
        <div className="border-gray-50 border w-36 flex justify-between text-xl font-bold">
            <div className="flex justify-center w-full cursor-pointer" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                -
            </div>
            <div className="flex justify-center w-full text-lg">
                {quantity}
            </div>
            <div className="flex justify-center w-full cursor-pointer" onClick={() => setQuantity(quantity + 1)}>
                +
            </div>
        </div>
    </>;
}