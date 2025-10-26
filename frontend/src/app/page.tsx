"use client"
import React from "react";
import PhoneComponent from "@/components/Phone";
import SquigglyUnderlineText from "@/components/SquigglyUnderlineText";
import { Button } from "@/components/ui/button";
import { Box, Text } from "@radix-ui/themes";
import { gray, lime, teal, jade } from "@radix-ui/colors";
import { ArrowTopRightIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import Footer from "@/components/Footer";
import WaitlistScrollHandler from "@/components/WaitlistScrollHandler";
import Link from "next/link";
import Gradient from "@/components/Gradient";
import VideoStepSync from "@/components/VideoStepSync";
import { StaticRadialGradient, ColorPanels } from '@paper-design/shaders-react';
import { MeshGradient } from '@mesh-gradient/react';

export default function HomePage() {
    return (
        <div className="flex flex-col w-full">
            <WaitlistScrollHandler />
            {/* Hero Section */}
            <section className="flex items-center justify-center w-full min-h-screen relative overflow-hidden">
                {/* Gradient background - contained within hero section */}
                <div className="absolute inset-0 w-full h-full -z-10">
                    <Gradient
                        className="w-full h-full"
                        gradientColors={[
                            "#A8BF9C", // Mid-tone matcha
                            "#98B88C", // Soft matcha
                            "#9CB894", // Warm matcha
                            "#A5C39A", // Light matcha
                            "#8FB080", // Muted green
                            "#9DBE91", // Balanced matcha
                            "#A2BB96", // Subtle green
                            "#96B58A", // Natural matcha
                        ]}
                        noise={0.08}
                        spotlightRadius={0.6}
                        spotlightOpacity={0}
                        distortAmount={2.5}
                        mirrorGradient={true}
                        angle={45}
                        paused={false}
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
                                style={{ backgroundColor: 'var(--lime-10)' }}>
                            <Link href="/stores" className="flex items-center gap-2">
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

            {/* Manifesto / Quote Section + Problem/Solution */}
            <section className="px-6 py-20 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative">
                    {/* Card with mesh gradient background */}
                    <div className="relative rounded-3xl overflow-hidden bg-white" style={{ minHeight: '400px' }}>
                        {/* Mesh Gradient Background - cyan to grass gradient */}
                        <div className="absolute inset-0 opacity-30">
                            <MeshGradient
                                className="w-full h-full"
                                options={{
                                    colors: ['#9AE6F5', '#7DD3C0', '#B4D88B', '#C2E59C'],
                                    isStatic: true,
                                    seed: 42
                                }}
                            />
                        </div>

                        {/* Content - Grid layout with text and image */}
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[400px] p-8 md:p-12 lg:p-14">
                            {/* Left: Quote text */}
                            <div>
                                {/* Large decorative quote mark - keep green */}
                                <div className="mb-6">
                                    <svg width="64" height="64" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M23.5 50C23.5 41.4 28.9 33.8 36.5 30.2V20C22.8 23.6 13.5 35.8 13.5 50C13.5 58.3 20.2 65 28.5 65C36.8 65 43.5 58.3 43.5 50C43.5 41.7 36.8 35 28.5 35C27.2 35 26 35.2 24.8 35.5C24.3 40 23.5 44.9 23.5 50ZM50 50C50 41.4 55.4 33.8 63 30.2V20C49.3 23.6 40 35.8 40 50C40 58.3 46.7 65 55 65C63.3 65 70 58.3 70 50C70 41.7 63.3 35 55 35C53.7 35 52.5 35.2 51.3 35.5C50.8 40 50 44.9 50 50Z" fill="#A8E64A"/>
                                    </svg>
                                </div>

                                {/* Main quote - black text */}
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1]" style={{ color: gray.gray12 }}>
                                    Finding sponsorships shouldn&apos;t be this hard.
                                </h2>

                                {/* Subline - black text */}
                                <Text size="5" className="block" style={{ color: gray.gray11, lineHeight: 1.7, fontSize: '1.125rem' }}>
                                    That&apos;s what we think at Maatchaa — connecting creators and brands should feel effortless.
                                </Text>
                            </div>

                            {/* Right: Image */}
                            <div className="flex items-center justify-center">
                                <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-200">
                                    <img
                                        src="/images/homepage.jpeg"
                                        alt="Creator and brand collaboration"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Problem + Solution - Figma Style */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
                        {/* Left: The Problem */}
                        <div>
                            {/* Image */}
                            <div className="w-full overflow-hidden mb-6" style={{ height: '450px' }}>
                                <img
                                    src="/images/img3.png"
                                    alt="The problem with current sponsorships"
                                    className="w-[90%] h-full object-cover"
                                />
                            </div>

                            <Text size="2" weight="medium" className="block mb-4" style={{ color: lime.lime11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                The Problem
                            </Text>
                            <Text size="6" weight="bold" className="block mb-3" style={{ color: gray.gray12, lineHeight: 1.5 }}>
                                Creators waste countless hours chasing deals, only to face radio silence.
                            </Text>
                            <Text size="6" className="block" style={{ color: gray.gray12, lineHeight: 1.5 }}>
                                Brands struggle to find authentic creators who truly align with their products.
                            </Text>
                        </div>

                        {/* Right: Our Solution */}
                        <div>
                            {/* Image */}
                            <div className="w-full overflow-hidden mb-6" style={{ height: '450px' }}>
                                <img
                                    src="/images/img2.png"
                                    alt="Maatchaa's automated solution"
                                    className="w-[90%] h-full object-cover"
                                />
                            </div>

                            <Text size="2" weight="medium" className="block mb-4" style={{ color: lime.lime11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Our Solution
                            </Text>
                            <Text size="6" weight="bold" className="block mb-3" style={{ color: gray.gray12, lineHeight: 1.5 }}>
                                Maatchaa automates the entire workflow.
                            </Text>
                            <Text size="6" className="block" style={{ color: gray.gray12, lineHeight: 1.5 }}>
                                From AI-powered creator matching to personalized outreach, contracts, and performance tracking — all in one seamless platform.
                            </Text>
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
                        colors={['#90f3c0', '#B4D88B']}
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
                    <div className="text-center mb-20">
                        <Text size="2" weight="medium" className="block mb-4" style={{ color: '#97ffc6', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            How It Works
                        </Text>
                        <Text size="9" weight="bold" className="block" style={{ color: '#FFFFFF' }}>
                            How Maatchaa Automates Sponsorships
                        </Text>
                    </div>

                    {/* Video and Steps with Progress Sync */}
                    <VideoStepSync />

                    {/* Tech Blog Call-to-Action */}
                    <Box className="text-center max-w-4xl mx-auto mt-16">
                        <Text size="5" weight="bold" className="block" style={{ color: '#FFFFFF', marginBottom: '1.5rem' }}>
                            Still want to learn more?
                        </Text>
                        <Button variant="solid" color="lime" size="3" asChild>
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
                {/* Static Mesh Gradient background - more visible and sophisticated */}
                <div className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                    <MeshGradient
                        className="w-full h-full"
                        options={{
                            colors: ['#A8BF9C', '#7DD3C0', '#B4D88B', '#98E6C8'],
                            isStatic: true,
                            seed: 123
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
