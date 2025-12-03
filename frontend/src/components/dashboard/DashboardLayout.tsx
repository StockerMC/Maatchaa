"use client";

import React, { useState } from "react";
import { Box, Flex, Button } from "@radix-ui/themes";
import { sage } from "@radix-ui/colors";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  initialSidebarOpen?: boolean;
  allowSidebarToggle?: boolean;
  sidebarOpen?: boolean;
  onSidebarToggle?: (open: boolean) => void;
  hideHeader?: boolean;
}

export default function DashboardLayout({ children, initialSidebarOpen = true, allowSidebarToggle = false, sidebarOpen: controlledSidebarOpen, onSidebarToggle, hideHeader = false }: DashboardLayoutProps) {
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(initialSidebarOpen);

  const sidebarOpen = controlledSidebarOpen !== undefined ? controlledSidebarOpen : internalSidebarOpen;
  const setSidebarOpen = (open: boolean) => {
    if (onSidebarToggle) {
      onSidebarToggle(open);
    } else {
      setInternalSidebarOpen(open);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "white",
        width: "100%",
        position: "relative",
        fontFamily: "var(--font-satoshi), system-ui, sans-serif",
      }}
    >
      {/* Floating Menu Button - Only visible when allowSidebarToggle is true */}
      {allowSidebarToggle && (
        <Box
          style={{
            position: "fixed",
            top: "1rem",
            left: sidebarOpen ? "296px" : "1rem",
            zIndex: 2000,
            transition: "left 0.3s ease",
          }}
        >
          <Button
            variant="solid"
            color="gray"
            size="3"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              cursor: "pointer",
              borderRadius: "var(--radius-full)",
              width: "48px",
              height: "48px",
              padding: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </Button>
        </Box>
      )}


      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area */}
      <Flex
        direction="column"
        style={{
          marginLeft: sidebarOpen ? "280px" : "0px",
          minHeight: "100vh",
          transition: "margin-left 0.3s ease"
        }}
      >
        {/* Header */}
        {!hideHeader && <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}

        {/* Page Content */}
        <Box style={{ padding: hideHeader ? "0" : "2rem", flex: 1, paddingTop: hideHeader ? "0" : "calc(64px + 2rem)" }}>
          {children}
        </Box>
      </Flex>
    </Box>
  );
}
