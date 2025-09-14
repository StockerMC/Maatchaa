"use client";

import { useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Product {
  id: number;
  title: string;
  price: string;
  image_url: string;
}

function StoreDashboard() {
  const [shopName, setShopName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const name = localStorage.getItem("shop_name");
    setShopName(name);

    if (name) {
      fetch(`/api/products?shop_name=${name}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.products) {
            setProducts(data.products);
          } else {
            setError("Could not fetch products.");
          }
        })
        .catch(() => setError("Failed to fetch products."))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
      setError("Shop name not found.");
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Store...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-xl text-gray-600 mb-8">
        Connected to: <span className="font-semibold">{shopName}</span>
      </p>

      <h2 className="text-2xl font-bold mb-4">Your Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 flex flex-col">
            <div className="relative w-full h-48 mb-4">
              <Image
                src={product.image_url}
                alt={product.title}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>
            <h3 className="text-lg font-semibold">{product.title}</h3>
            <p className="text-gray-500 mb-4">${product.price}</p>
            <Button className="mt-auto w-full">Sponsor this Product</Button>
          </div>
        ))}
      </div>
    </div>
  );
}


function CreatorDashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/creator");
  }

  if (session?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Connection Error</h1>
          <p className="text-gray-600">There was an error with your YouTube connection.</p>
          <p className="text-sm text-gray-500 mt-2">Error: {session.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 text-green-600">Connected Successfully!</h1>
        <p className="text-gray-600 mb-2">Your YouTube channel is now connected.</p>
        <p className="text-sm text-gray-500">Channel ID: {session?.user?.channelId}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const isStoreConnected = searchParams.get("store_connected") === "true";

  if (isStoreConnected) {
    return <StoreDashboard />;
  }

  return <CreatorDashboard />;
}
