import { BlogContent } from "@/components/blog/blog-content";
import Link from "next/link";
import { Text, Button, Box } from "@radix-ui/themes";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Footer from "@/components/Footer";
import { MeshGradient } from '@mesh-gradient/react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import fs from 'fs';
import path from 'path';

export default async function BlogPage() {
  // Read the MDX file from public/blogs
  const mdxPath = path.join(process.cwd(), 'public', 'blogs', 'blog.mdx');
  const mdxContent = fs.readFileSync(mdxPath, 'utf8');
  return (
    <div className="w-full min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden min-h-screen flex items-center" style={{ backgroundColor: '#0f172a' }}>
        {/* Vibrant Mesh Gradient Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
          <MeshGradient
            className="w-full h-full"
            options={{
              colors: ['#d2d3ff', '#7ff1c5', '#24fbfb', '#60a5fa'],
              isStatic: true,
              seed: 456
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 md:py-32">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors font-semibold"
            style={{ color: '#FFF' }}
          >
            <ArrowLeftIcon width="16" height="16" />
            Back to home
          </Link>

          {/* Meta */}
          <div className="mb-6">
            <div className="flex items-center gap-3 text-sm mb-6 font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <time dateTime="2025-09-15">September 15, 2025</time>
              <span>•</span>
              <span>8 min read</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                Hackathon
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                Product
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#FFFFFF', textShadow: '0 2px 20px rgba(0, 0, 0, 0.3)' }}>
              Building an Algorithm to Automate Business-to-Video Sponsorships
            </h1>
            <Text size="6" className="block font-medium" style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
              How did a goofy matcha project end up winning Canada's biggest hackathon? Well, here's a technical blog for what this project is all about!
            </Text>
          </div>
        </div>
      </section>

      {/* Article Content Section */}
      <section className="relative py-16" style={{ backgroundColor: '#FFFFFF' }}>
        <article className="max-w-6xl mx-auto px-6">

          <div className="max-w-3xl mx-auto">
            {/* Content */}
            <BlogContent>
              <MDXRemote source={mdxContent} />
            </BlogContent>
              <div className="w-full mb-6">
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                      <Image
                          src="/images/homepage.jpeg"
                          alt="How we built Maatchaa"
                          width={1920}
                          height={1080}
                          className="w-full h-full object-cover"
                          priority
                      />
                  </div>
                  <Text size="2" className="block pt-3 text-center" style={{ color: '#737373', fontStyle: 'italic' }}>
                      Our team presenting Maatchaa at the closing ceremony of Hack the North 2025!
                  </Text>
              </div>

          </div>
        </article>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-20 overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
        {/* Green Gradient Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <MeshGradient
            className="w-full h-full"
            options={{
                colors: ['#d2d3ff', '#7ff1c5', '#24fbfb', '#60a5fa'],
              isStatic: true,
              seed: 321
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Text size="2" weight="medium" style={{ color: '#286352', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Get Early Access
          </Text>
          <Text size="8" weight="bold" style={{ color: '#1A1A1A', lineHeight: 1.2 }}>
            Ready to automate your sponsorships?
          </Text>
          <Text size="5" weight="medium" style={{ color: '#475569', lineHeight: 1.7, maxWidth: '600px' }}>
            Join creators and brands using Maatchaa to build authentic partnerships.
          </Text>
          <Box style={{ marginTop: '0.5rem' }}>
            <Button variant="solid" color="lime" size="4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link href="/#waitlist" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
                Join the waitlist
                <ArrowRightIcon width="18" height="18" />
              </Link>
            </Button>
          </Box>
        </div>
      </section>

      <Footer />
    </div>
  );
}
