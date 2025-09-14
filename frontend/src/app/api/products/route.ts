import { NextRequest, NextResponse } from "next/server";

const products = [
  { id: 1, title: "The Classic Tee", price: "29.99", image_url: "/images/img1.png" },
  { id: 2, title: "The Minimalist Hoodie", price: "79.99", image_url: "/images/img2.png" },
  { id: 3, title: "The Everyday Crewneck", price: "49.99", image_url: "/images/img3.png" },
  { id: 4, title: "The Adventure Backpack", price: "99.99", image_url: "/images/img4.png" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop_name = searchParams.get("shop_name");

  if (!shop_name) {
    return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
  }

  // In a real app, you'd fetch products for the given shop.
  // For this demo, we'll return the same list for any shop.
  return NextResponse.json({ products }, { status: 200 });
}
