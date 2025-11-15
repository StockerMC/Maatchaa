"use client"
import React from "react";
import PhoneComponent from "@/components/Phone";
import SquigglyUnderlineText from "@/components/SquigglyUnderlineText";
import { Button } from "@/components/ui/button";
import { Box, Text } from "@radix-ui/themes";
import { gray, lime } from "@radix-ui/colors";
import { ArrowTopRightIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import Footer from "@/components/Footer";
import WaitlistScrollHandler from "@/components/WaitlistScrollHandler";
import Link from "next/link";
import Image from "next/image";
import Iridescence from "@/components/Iridescence";
import VideoStepSync from "@/components/VideoStepSync";
import { StaticRadialGradient } from '@paper-design/shaders-react';
import { MeshGradient } from '@mesh-gradient/react';
import CardSwap, { Card } from "@/components/CardSwap";

export default function HomePage() {
    return (
        <div className="flex flex-col w-full">
            <WaitlistScrollHandler />
            {/* Hero Section */}
            <section className="flex items-center justify-center w-full min-h-screen relative overflow-hidden">
                {/* Gradient background - contained within hero section */}
                <div className="absolute inset-0 w-full h-full -z-10">
                    <Iridescence
                        mouseReact={false}
                        amplitude={0.1}
                        speed={0.1}
                    />
                </div>
                <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-7xl w-full mx-auto z-10 px-6 mt-12">
                    {/* Hero Text */}
                    <div className="text-center lg:text-left w-full lg:w-[60%]">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 drop-shadow-2xl text-balance leading-tight">
                            Sponsorships that match, made easy with{" "}
                            <SquigglyUnderlineText>Maatchaa</SquigglyUnderlineText>
                        </h1>
                        <p className="text-lg md:text-xl text-white drop-shadow-lg max-w-2xl mx-auto lg:mx-0 font-semibold mb-8">
                            Connect your brand with relevant creators in minutes, struggle free.
                        </p>
                        <Button variant="classic" color="lime" size="4" asChild
                                style={{ backgroundColor: 'var(--lime-10)', borderRadius:'30px'}}>
                            <Link href="/onboarding" className="flex items-center gap-2">
                                Try Our Demo
                                <ArrowTopRightIcon width="18" height="18" />
                            </Link>
                        </Button>
                    </div>

                    <div className="flex justify-center items-center w-full lg:w-[40%]">
                        <PhoneComponent/>
                    </div>
                </div>
            </section>

            {/* Manifesto / Quote Section */}
            <section className="px-6 pt-32 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative">
                    {/* Clean minimal layout - no card wrapper */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        {/* Left: Quote text */}
                        <div>
                            {/* Large decorative quote mark - keep green */}
                            <div className="mb-6">
                                <svg width="64" height="64" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M23.5 50C23.5 41.4 28.9 33.8 36.5 30.2V20C22.8 23.6 13.5 35.8 13.5 50C13.5 58.3 20.2 65 28.5 65C36.8 65 43.5 58.3 43.5 50C43.5 41.7 36.8 35 28.5 35C27.2 35 26 35.2 24.8 35.5C24.3 40 23.5 44.9 23.5 50ZM50 50C50 41.4 55.4 33.8 63 30.2V20C49.3 23.6 40 35.8 40 50C40 58.3 46.7 65 55 65C63.3 65 70 58.3 70 50C70 41.7 63.3 35 55 35C53.7 35 52.5 35.2 51.3 35.5C50.8 40 50 44.9 50 50Z" fill="#A8E64A"/>
                                </svg>
                            </div>

                            {/* Main quote - black text */}
                            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold mb-6 leading-[1.1]" style={{ color: gray.gray12 }}>
                                Finding sponsorships shouldn&apos;t be <span style={{ backgroundColor: lime.lime4, color: gray.gray12, padding: '0.05em 0.1em', borderRadius: '8px', fontWeight: 'bold', display: 'inline' }}>this hard.</span>
                            </h2>

                            {/* Subline - black text */}
                            <Text size="5" className="block" style={{ color: gray.gray11}}>
                                That&apos;s what we think at Maatchaa — connecting creators and brands should feel effortless.
                            </Text>
                        </div>

                        {/* Right: Image */}
                        <div className="flex items-center justify-center">
                            <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-200">
                                <Image
                                    src="/images/homepage.jpeg"
                                    alt="Creator and brand collaboration"
                                    width={800}
                                    height={600}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider line */}
                    <div className="w-full h-px mt-32" style={{ backgroundColor: gray.gray7 }}></div>
                </div>
            </section>

            {/* What We Solve - Card Swap Section */}
            <section className="px-6 py-20 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative">
                    <div className="relative rounded-3xl overflow-hidden bg-white" style={{ minHeight: '400px' }}>
                        {/* Mesh Gradient Background - coral/lime/lavender/mint gradient */}
                        <div className="absolute inset-0 opacity-65">
                            <MeshGradient
                                className="w-full h-full"
                                options={{
                                    colors: ['#FFB5A7', '#B4FF9F', '#C7B3FF', '#8FFFD7'],
                                    isStatic: true,
                                    seed: 99
                                }}
                            />
                        </div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12 lg:p-14">
                            {/* Left: Text Content */}
                            <div className="flex items-center">
                                <div>
                                    <Text size="2" weight="medium" className="block mb-4" style={{ color: "#6a9a23", letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '700' }}>
                                        What We Solve
                                    </Text>
                                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6" style={{ color: "#26302c", lineHeight: 1.2 }}>
                                        Maatchaa solves your biggest sponsorship headaches
                                    </h3>
                                    <Text size="5" className="block" style={{ color: "rgba(33,43,43,0.69)", lineHeight: 1.7, fontWeight: '500' }}>
                                        From discovery to campaign management, we automate the entire workflow so you can focus on building great partnerships.
                                    </Text>
                                </div>
                            </div>

                            {/* Right: Rotating Cards */}
                            <div className="flex items-center justify-center" style={{ height: '480px', position: 'relative', paddingTop: '55px'}}>
                                <CardSwap
                                    width={450}
                                    height={450}
                                    cardDistance={40}
                                    verticalDistance={50}
                                    delay={2800}
                                    pauseOnHover={false}
                                    easing="smooth"
                                >
                                    <Card style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                        <Text size="2" weight="medium" className="block mb-6" style={{ color: lime.lime11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                            Finding Creators
                                        </Text>
                                        <Text size="4" className="block mb-5" style={{ color: gray.gray12, lineHeight: 1.6 }}>
                                            Stop finding creators for hours. Get matched with creators whose audiences actually want your product.
                                        </Text>
                                        <div className="mt-auto overflow-hidden rounded-lg" style={{ height: '250px' }}>
                                            <Image
                                                src="/images/img3.png"
                                                alt="Finding creators"
                                                width={400}
                                                height={265}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </Card>

                                    <Card style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                        <Text size="2" weight="medium" className="block mb-6" style={{ color: lime.lime11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                            Busywork
                                        </Text>
                                        <Text size="4" className="block mb-5" style={{ color: gray.gray12, lineHeight: 1.6 }}>
                                            Stop copying engagement rates into spreadsheets. Maatchaa does the research, outreach, and vetting automatically.
                                        </Text>
                                        <div className="mt-auto overflow-hidden rounded-lg" style={{ height: '250px' }}>
                                            <Image
                                                src="/images/img2.png"
                                                alt="Automated busywork"
                                                width={400}
                                                height={265}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </Card>

                                    <Card style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                        <Text size="2" weight="medium" className="block mb-6" style={{ color: lime.lime11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                            Campaign Automation
                                        </Text>
                                        <Text size="4" className="block mb-5" style={{ color: gray.gray12, lineHeight: 1.6 }}>
                                            Contracts, approvals, tracking, payments — all automated. Manage 50 creators as easily as one.
                                        </Text>
                                        <div className="mt-auto overflow-hidden rounded-lg" style={{ height: '250px' }}>
                                            <Image
                                                src="/images/img2.png"
                                                alt="Campaign automation"
                                                width={400}
                                                height={265}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </Card>
                                </CardSwap>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How Maatchaa Helps You Section */}
            <section className="px-6 py-32 pb-16 relative overflow-hidden" style={{ backgroundColor: '#1A1A1A', minHeight: '100vh' }}>

                {/* Paper Design Static Radial Gradient Background */}
                <div className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                    <StaticRadialGradient
                        width="100%"
                        height="100%"
                        colors={['#b1fa8b', '#B4D88B']}
                        radius={2.5}
                        colorBack={"#1A1A1A"}
                        focalDistance={3}
                        focalAngle={180}
                        falloff={0.6}
                        mixing={0.5}
                        grainMixer={0.7}
                        offsetY={-1}
                    />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <Text size="2" weight="medium" className="block mb-4" style={{ color: '#b1fa8b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            How It Works
                        </Text>
                        <Text size="9" weight="bold" className="block" style={{ color: '#FFFFFF' }}>
                            How Maatchaa Automates Sponsorships
                        </Text>
                    </div>

                    {/* Video and Steps with Progress Sync */}
                    <VideoStepSync />

                    {/* Tech Blog Call-to-Action */}
                    <Box className="text-center max-w-4xl mx-auto mt-12">
                        <Text size="5" weight="bold" className="block" style={{ color: '#FFFFFF', marginBottom: '1.5rem' }}>
                            Still want to learn more?
                        </Text>
                        <Button variant="solid" color="lime" size="3" radius="full" asChild>
                            <Link href="/blog" className="flex items-center gap-2">
                                Read Our Tech Blog
                                <ArrowRightIcon width="16" height="16" />
                            </Link>
                        </Button>
                    </Box>
                </div>
            </section>

            {/* Waitlist Section */}
            <section id="waitlist" className="px-6 py-32 relative overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="absolute inset-0 w-full h-full pointer-events-none opacity-70">
                    <MeshGradient
                        className="w-full h-full"
                        options={{
                            colors: ['#b7ef9a', '#7DD3C0', '#B4D88B', '#98E6C8'],
                            isStatic: true,
                            seed: 130
                        }}
                    />
                </div>

                <div className="max-w-4xl mx-auto mt-5 mb-5 relative z-10 text-center">
                    {/* Super heading */}
                    <Text size="2" weight="medium" className="block mb-4" style={{ color: lime.lime11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Get Early Access
                    </Text>

                    {/* Main heading */}
                    <Text size="9" weight="bold" className="block mb-4" style={{ color: gray.gray12 }}>
                        Join the waitlist
                    </Text>

                    {/* Subheading */}
                    <Text size="5" className="block pb-4" style={{ color: gray.gray11, lineHeight: 1.7 }}>
                        Be among the first to experience Maatchaa when we launch.
                    </Text>

                    {/* Waitlist Form */}
                    <WaitlistForm />
                </div>
            </section>

            <Footer />
        </div>
    );
}
