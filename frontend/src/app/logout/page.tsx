"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Flex, Text } from "@radix-ui/themes";

export default function LogoutPage() {
  useEffect(() => {
    // Clear any locally-stored demo/session state, then end the NextAuth session.
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("youtube_channel_id");
    } catch {
      // ignore storage access errors (SSR / privacy mode)
    }
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
      <Text size="3" color="gray">
        Signing you out…
      </Text>
    </Flex>
  );
}
