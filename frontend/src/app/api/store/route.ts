import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { shop_name } = await req.json();

    if (!shop_name) {
      return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
    }

    const access_token = uuidv4();

    const { data, error } = await supabaseAdmin
      .from("companies")
      .insert([{ shop_name, access_token }])
      .select();

    if (error) {
      console.error("Error inserting into Supabase:", error);
      return NextResponse.json({ error: "Failed to connect store." }, { status: 500 });
    }

    const response = await fetch(`${process.env.BACKEND_URL}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shop_url: shop_name, access_token }),
    });

    if (!response.ok) {
      console.error("Error connecting to backend:", response.statusText);
      return NextResponse.json({ error: "Failed to connect store." }, { status: 500 });
    }

    return NextResponse.json({ message: "Store connected successfully", data }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/store:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
