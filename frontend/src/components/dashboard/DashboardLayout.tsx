"use client";

import React from "react";
import { Box, Flex } from "@radix-ui/themes";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Box style={{ minHeight: "100vh", background: "#F5F5F5", width: "100%" }}>
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <Flex direction="column" style={{ marginLeft: "280px", minHeight: "100vh" }}>
        {/* Header */}
        <DashboardHeader />

        {/* Page Content */}
        <Box style={{ padding: "2rem", flex: 1 }}>
          {children}
        </Box>
      </Flex>
    </Box>
  );
}