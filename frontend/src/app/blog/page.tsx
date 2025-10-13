import { BlogContent } from "@/components/blog/blog-content";
import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="w-full min-h-screen py-16 px-6">
      <article className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 md:p-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to home
        </Link>

        {/* Meta */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <time dateTime="2025-09-15">September 15, 2025</time>
            <span>•</span>
            <span>8 min read</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            How We Built Maatchaa
          </h1>
          <p className="text-xl text-gray-600">
            How we built a Tinder-like experience for brand partnerships in 36
            hours at Hack the North 2025.
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
            Hackathon
          </span>
          <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
            Product
          </span>
        </div>

        {/* Featured image */}
        <div className="aspect-video w-full rounded-xl bg-gray-100 mb-12 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            [Hero Image Placeholder]
          </div>
        </div>

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

          <p>
            <Link href="/#waitlist" className="text-primary font-semibold">
              Join the waitlist →
            </Link>
          </p>
        </BlogContent>
      </article>
    </div>
  );
}
