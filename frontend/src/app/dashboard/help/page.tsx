"use client";

import { Card, Flex, Text, Box, Heading, Link as RadixLink } from "@radix-ui/themes";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const faqs = [
  {
    q: "How does matching work?",
    a: "We generate vector embeddings of your product catalog and of creator videos, then rank creators by similarity so you see the best-fit matches first in Discover Shorts.",
  },
  {
    q: "How do I connect my Shopify store?",
    a: "Head to Get Started and enter your store URL to begin the secure Shopify OAuth flow. Your products sync automatically once connected.",
  },
  {
    q: "How do partnerships progress?",
    a: "Swipe right on a creator to create a partnership, then move it through To Contact → Contacted → In Discussion → Active on the Partnerships board.",
  },
];

export default function HelpPage() {
  return (
    <DashboardLayout>
      <Flex direction="column" gap="6" style={{ maxWidth: "760px" }}>
        <Box>
          <Heading size="8" weight="bold">Help & Support</Heading>
          <Text size="3" color="gray" style={{ display: "block", marginTop: "0.5rem" }}>
            Answers to common questions, and how to reach us.
          </Text>
        </Box>

        <Flex direction="column" gap="3">
          {faqs.map((f) => (
            <Card key={f.q} style={{ padding: "1.25rem" }}>
              <Text size="3" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
                {f.q}
              </Text>
              <Text size="2" color="gray">{f.a}</Text>
            </Card>
          ))}
        </Flex>

        <Card style={{ padding: "1.25rem" }}>
          <Text size="3" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
            Still need help?
          </Text>
          <Text size="2" color="gray">
            Email us at{" "}
            <RadixLink href="mailto:support@maatchaa.co">support@maatchaa.co</RadixLink>{" "}
            and we&apos;ll get back to you.
          </Text>
        </Card>
      </Flex>
    </DashboardLayout>
  );
}
