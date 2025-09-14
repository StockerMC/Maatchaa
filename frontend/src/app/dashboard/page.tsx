"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function DashboardPage() {
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
    redirect("/connect");
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
