"use client";

import { redirect } from "next/navigation";

// Redirect to overview page
export default function DashboardPage() {
  redirect("/dashboard/overview");
}
