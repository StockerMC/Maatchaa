import { BlogContent } from "@/components/blog/blog-content";
import Link from "next/link";
import { Text, Button, Box } from "@radix-ui/themes";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Footer from "@/components/Footer";
import { MeshGradient } from '@mesh-gradient/react';

export default function BlogPage() {
  return (
    <div className="w-full min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
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
              How We Built Maatchaa
            </h1>
            <Text size="6" className="block font-medium" style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
              How we built a Tinder-like experience for brand partnerships in 36 hours at Hack the North 2025.
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
          <h2>The Problem</h2>
          <p>
            As first-year Software Engineering and CS students at the University
            of Waterloo, we noticed a glaring inefficiency in how creators and
            brands discover partnership opportunities. The traditional process is
            slow, opaque, and heavily reliant on middlemen.
          </p>
          <p>
            YouTube creators with engaged audiences struggle to find brands that
            align with their content. Meanwhile, Shopify merchants looking to
            expand their reach through influencer marketing don&apos;t have an easy
            way to discover authentic creators in their niche.
          </p>

          <h2>The Idea: Tinder for Brand Deals</h2>
          <p>
            During Hack the North 2025, we asked ourselves: <strong>What if
            discovering brand partnerships was as easy as swiping on a dating
            app?</strong>
          </p>
          <p>
            Maatchaa was born from this simple insight. We built a dual-sided
            matching platform where:
          </p>
          <ul>
            <li>
              <strong>Creators</strong> can swipe through curated Shopify brands
              that match their content niche
            </li>
            <li>
              <strong>Brands</strong> can discover YouTube creators whose
              audiences align with their products
            </li>
            <li>
              When both parties swipe right, a <strong>match</strong> is created,
              opening a direct line of communication
            </li>
          </ul>

          <h2>Building in 36 Hours</h2>
          <p>
            With limited time and ambitious goals, we focused on three core
            technical challenges:
          </p>

          <h3>1. Seamless OAuth Integration</h3>
          <p>
            We integrated both Shopify and YouTube OAuth flows to pull real-time
            data. This allowed us to show creators actual store metrics and brands
            to see authentic creator analytics—no manual data entry required.
          </p>

          <h3>2. Smart Matching Algorithm</h3>
          <p>
            We built a recommendation engine that considers content categories,
            audience demographics, engagement rates, and brand values. The goal
            was to show each user only the most relevant potential partners.
          </p>

          <h3>3. Mobile-First Swipe UI</h3>
          <p>
            Using React and Framer Motion, we created a buttery-smooth card-swipe
            interface that works seamlessly on mobile devices. The interaction
            needed to feel native and intuitive.
          </p>

          <h2>The Results</h2>
          <p>
            After 36 hours of coding, debugging, and iterating, we presented
            Maatchaa to the judges. Our demo showcased:
          </p>
          <ul>
            <li>Live Shopify store integration</li>
            <li>Real YouTube channel data via the YouTube API</li>
            <li>A working match system with in-app messaging</li>
            <li>Mobile-responsive design</li>
          </ul>

          <h2>What&apos;s Next</h2>
          <p>
            Hack the North was just the beginning. We&apos;re now refining the product
            based on feedback from creators and brands. Our roadmap includes:
          </p>
          <ul>
            <li>Enhanced matching algorithm with ML-based recommendations</li>
            <li>Contract templates and payment escrow for secure transactions</li>
            <li>Analytics dashboard for tracking partnership performance</li>
            <li>Expanding to TikTok and Instagram creators</li>
          </ul>
          <p>
            If you&apos;re a creator or brand interested in trying Maatchaa, join our
            waitlist. We&apos;re rolling out early access soon.
          </p>

          <blockquote>
            &ldquo;Building Maatchaa taught us that the best products solve real
            problems for real people. We can&apos;t wait to see where this journey
            takes us.&rdquo; — The Maatchaa Team
          </blockquote>
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
                      The Maatchaa team building the platform at Hack the North 2025
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
