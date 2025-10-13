// lets just say the margin/padding conflicts are cooked
// someone should fix them (or dont touch it because it works rn)
"use client"
import React from "react";
import PhoneComponent from "@/components/Phone";
import SquigglyUnderlineText from "@/components/SquigglyUnderlineText";
import { Button } from "@/components/ui/button";
import { Box, Text, Card, Flex } from "@radix-ui/themes";
import { sage, gray, lime } from "@radix-ui/colors";
import { ArrowTopRightIcon, ArrowDownIcon, ArrowRightIcon, TargetIcon, EyeOpenIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import Footer from "@/components/Footer";
import WaitlistScrollHandler from "@/components/WaitlistScrollHandler";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
    // fixed, deterministic decorative matcha positions (non-overlapping)
    // chosen to sit lower in the waitlist section and spaced to avoid clipping
    const whiskPositions = [
        { left: 15, top: 58, size: 8.5, rotate: -12 },
        { left: 30, top: 62, size: 9.2, rotate: 6 },
        { left: 45, top: 70, size: 7.8, rotate: -6 },
        { left: 60, top: 74, size: 8.7, rotate: 12 },
        { left: 75, top: 59, size: 9.5, rotate: -20 },
        { left: 90, top: 68, size: 8.0, rotate: 3 }
    ];

    return (
        <div className="flex flex-col w-full">
            <WaitlistScrollHandler />
            {/* Hero Section */}
            <section className="flex items-center justify-center w-full min-h-screen relative">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-7xl w-full mx-auto z-10 px-6 mt-12">
                    {/* Hero Text */}
                    <div className="text-center lg:text-left w-full lg:w-[60%]">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 drop-shadow-2xl text-balance leading-tight">
                            Sponsorships that match, automatically with{" "}
                            <SquigglyUnderlineText>Maatchaa</SquigglyUnderlineText>
                        </h1>
                        <p className="text-lg md:text-xl text-white drop-shadow-lg max-w-2xl mx-auto lg:mx-0 font-semibold mb-8">
                            AI-powered matching that connects creators and brands in minutes, struggle free.
                        </p>
                        <Button variant="classic" color="lime" size="4" asChild
                                style={{ backgroundColor: 'var(--lime-10)' }}>
                            <Link href="/#waitlist" className="flex items-center gap-2">
                                Join our Waitlist
                                <ArrowTopRightIcon width="18" height="18" />
                            </Link>
                        </Button>
                    </div>

                    <div className="flex justify-center items-center w-full lg:w-[40%]">
                        <PhoneComponent/>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            {/* add extra bottom padding to give breathing room before the waitlist */}
            <section className="pt-10 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <Box className="mb-14 mt-12">
                        <Text size="9" weight="bold" className="block" style={{ color: gray.gray12, marginBottom: '1rem' }}>
                            Find sponsorships that fit your brand
                        </Text>
                        <Text size="4" className="block max-w-2xl" style={{ color: gray.gray11 }}>
                            From matching to confirmation, Maatchaa handles the entire workflow
                        </Text>
                    </Box>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
                        {/* Left side - Cards */}
                        <div className="grid grid-cols-1 gap-2 max-w-lg">
                            {/* Card 1 */}
                            <div
                                className="cursor-pointer transition-all"
                                onMouseEnter={(e) => {
                                    const card = e.currentTarget.querySelector('[data-card]') as HTMLElement;
                                    const iconBox = e.currentTarget.querySelector('[data-icon-box]') as HTMLElement;
                                    const icon = e.currentTarget.querySelector('[data-icon]') as SVGElement;
                                    if (card) card.style.backgroundColor = lime.lime2;
                                    if (iconBox) iconBox.style.backgroundColor = lime.lime3;
                                    if (icon) icon.style.color = lime.lime11;
                                }}
                                onMouseLeave={(e) => {
                                    const card = e.currentTarget.querySelector('[data-card]') as HTMLElement;
                                    const iconBox = e.currentTarget.querySelector('[data-icon-box]') as HTMLElement;
                                    const icon = e.currentTarget.querySelector('[data-icon]') as SVGElement;
                                    if (card) card.style.backgroundColor = '';
                                    if (iconBox) iconBox.style.backgroundColor = gray.gray3;
                                    if (icon) icon.style.color = gray.gray12;
                                }}
                            >
                                <Card size="2" data-card style={{ transition: 'background-color 0.2s' }}>
                                    <Flex gap="4" align="center">
                                        <div
                                            data-icon-box
                                            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                backgroundColor: gray.gray3,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <TargetIcon
                                                data-icon
                                                width="24"
                                                height="24"
                                                style={{ color: gray.gray12, transition: 'color 0.2s' }}
                                            />
                                        </div>
                                        <Box className="flex-1">
                                            <Text size="2" className="block" style={{ color: gray.gray11, marginBottom: '0.25rem' }}>
                                                AI Matching
                                            </Text>
                                            <Text size="3" weight="bold" className="block" style={{ color: gray.gray12 }}>
                                                Our algorithm matches your store’s products to relevant, trending Youtube creators
                                            </Text>
                                        </Box>
                                    </Flex>
                                </Card>
                            </div>

                            {/* Arrow between cards */}
                            <div className="flex items-center justify-center" style={{ marginTop: '-10px', marginBottom: '-10px', pointerEvents: 'none' }}>
                                <ArrowDownIcon width={28} height={28} className="text-gray-300" />
                            </div>

                            {/* Card 2 */}
                            <div
                                className="cursor-pointer transition-all"
                                onMouseEnter={(e) => {
                                    const card = e.currentTarget.querySelector('[data-card]') as HTMLElement;
                                    const iconBox = e.currentTarget.querySelector('[data-icon-box]') as HTMLElement;
                                    const icon = e.currentTarget.querySelector('[data-icon]') as SVGElement;
                                    if (card) card.style.backgroundColor = lime.lime2;
                                    if (iconBox) iconBox.style.backgroundColor = lime.lime3;
                                    if (icon) icon.style.color = lime.lime11;
                                }}
                                onMouseLeave={(e) => {
                                    const card = e.currentTarget.querySelector('[data-card]') as HTMLElement;
                                    const iconBox = e.currentTarget.querySelector('[data-icon-box]') as HTMLElement;
                                    const icon = e.currentTarget.querySelector('[data-icon]') as SVGElement;
                                    if (card) card.style.backgroundColor = '';
                                    if (iconBox) iconBox.style.backgroundColor = gray.gray3;
                                    if (icon) icon.style.color = gray.gray12;
                                }}
                            >
                                <Card size="2" data-card style={{ transition: 'background-color 0.2s' }}>
                                    <Flex gap="4" align="center">
                                        <div
                                            data-icon-box
                                            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                backgroundColor: gray.gray3,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <EyeOpenIcon
                                                data-icon
                                                width="24"
                                                height="24"
                                                style={{ color: gray.gray12, transition: 'color 0.2s' }}
                                            />
                                        </div>
                                        <Box className="flex-1">
                                            <Text size="2" className="block" style={{ color: gray.gray11, marginBottom: '0.25rem' }}>
                                                Approval Flow
                                            </Text>
                                            <Text size="3" weight="bold" className="block" style={{ color: gray.gray12 }}>
                                                Swipe through your top creator pairings, Tinder style
                                            </Text>
                                        </Box>
                                    </Flex>
                                </Card>
                            </div>

                            {/* Arrow between cards */}
                            <div className="flex items-center justify-center" style={{ marginTop: '-10px', marginBottom: '-10px', pointerEvents: 'none' }}>
                                <ArrowDownIcon width={28} height={28} className="text-gray-300" />
                            </div>

                            {/* Card 3 */}
                            <div
                                className="cursor-pointer transition-all"
                                onMouseEnter={(e) => {
                                    const card = e.currentTarget.querySelector('[data-card]') as HTMLElement;
                                    const iconBox = e.currentTarget.querySelector('[data-icon-box]') as HTMLElement;
                                    const icon = e.currentTarget.querySelector('[data-icon]') as SVGElement;
                                    if (card) card.style.backgroundColor = lime.lime2;
                                    if (iconBox) iconBox.style.backgroundColor = lime.lime3;
                                    if (icon) icon.style.color = lime.lime11;
                                }}
                                onMouseLeave={(e) => {
                                    const card = e.currentTarget.querySelector('[data-card]') as HTMLElement;
                                    const iconBox = e.currentTarget.querySelector('[data-icon-box]') as HTMLElement;
                                    const icon = e.currentTarget.querySelector('[data-icon]') as SVGElement;
                                    if (card) card.style.backgroundColor = '';
                                    if (iconBox) iconBox.style.backgroundColor = gray.gray3;
                                    if (icon) icon.style.color = gray.gray12;
                                }}
                            >
                                <Card size="2" data-card style={{ transition: 'background-color 0.2s' }}>
                                    <Flex gap="4" align="center">
                                        <div
                                            data-icon-box
                                            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                backgroundColor: gray.gray3,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <EnvelopeClosedIcon
                                                data-icon
                                                width="24"
                                                height="24"
                                                style={{ color: gray.gray12, transition: 'color 0.2s' }}
                                            />
                                        </div>
                                        <Box className="flex-1">
                                            <Text size="2" className="block" style={{ color: gray.gray11, marginBottom: '0.25rem' }}>
                                                Outreach
                                            </Text>
                                            <Text size="3" weight="bold" className="block" style={{ color: gray.gray12 }}>
                                                Maatchaa drafts outreach emails and sponsorship contracts for you
                                            </Text>
                                        </Box>
                                    </Flex>
                                </Card>
                            </div>

                            {/* Arrow between cards */}
                            <div className="flex items-center justify-center" style={{ marginTop: '-10px', marginBottom: '-10px', pointerEvents: 'none' }}>
                                <ArrowDownIcon width={28} height={28} className="text-gray-300" />
                            </div>

                            {/* Card 4 */}
                            <div
                                className="cursor-pointer transition-all"
                                onMouseEnter={(e) => {
                                    const card = e.currentTarget.querySelector('[data-card]') as HTMLElement;
                                    const iconBox = e.currentTarget.querySelector('[data-icon-box]') as HTMLElement;
                                    const icon = e.currentTarget.querySelector('[data-icon]') as SVGSVGElement;
                                    if (card) card.style.backgroundColor = lime.lime2;
                                    if (iconBox) iconBox.style.backgroundColor = lime.lime3;
                                    if (icon) icon.style.color = lime.lime11;
                                }}
                                onMouseLeave={(e) => {
                                    const card = e.currentTarget.querySelector('[data-card]') as HTMLElement;
                                    const iconBox = e.currentTarget.querySelector('[data-icon-box]') as HTMLElement;
                                    const icon = e.currentTarget.querySelector('[data-icon]') as SVGSVGElement;
                                    if (card) card.style.backgroundColor = '';
                                    if (iconBox) iconBox.style.backgroundColor = gray.gray3;
                                    if (icon) icon.style.color = gray.gray12;
                                }}
                            >
                                <Card size="2" data-card style={{ transition: 'background-color 0.2s' }}>
                                    <Flex gap="4" align="center">
                                        <div
                                            data-icon-box
                                            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                backgroundColor: gray.gray3,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <svg
                                                data-icon
                                                width="24"
                                                height="24"
                                                viewBox="0 0 15 15"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{ color: gray.gray12, transition: 'color 0.2s' }}
                                            >
                                                <path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM10.1589 5.53774C10.3178 5.31191 10.2636 5.00001 10.0378 4.84109C9.81194 4.68217 9.50004 4.73642 9.34112 4.96225L6.51977 8.97154L5.35681 7.78706C5.16334 7.59002 4.84677 7.58711 4.64973 7.78058C4.45268 7.97404 4.44978 8.29061 4.64325 8.48765L6.22658 10.1003C6.33054 10.2062 6.47617 10.2604 6.62407 10.2483C6.77197 10.2363 6.90686 10.1591 6.99226 10.0377L10.1589 5.53774Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <Box className="flex-1">
                                            <Text size="2" className="block" style={{ color: gray.gray11, marginBottom: '0.25rem' }}>
                                                YouTube Integration
                                            </Text>
                                            <Text size="3" weight="bold" className="block" style={{ color: gray.gray12 }}>
                                                We add our links to their creators’ descriptions so you can track your outreach
                                            </Text>
                                        </Box>
                                    </Flex>
                                </Card>
                            </div>
                        </div>

                        {/* Right side - Homepage Image */}
                        <div className="flex items-center justify-start w-full" style={{ marginTop: '-16px', marginBottom: '-16px' }}>
                            <div className="w-full max-w-lg aspect-square rounded-2xl overflow-hidden shadow-md" style={{ height: 'calc(100% + 32px)', marginTop: '-16px', marginBottom: '-16px', position: 'relative' }}>
                                <Image src="/images/homepage.jpeg" alt="Maatchaa Dashboard Preview" fill className="object-cover" />
                            </div>
                        </div>
                    </div>

                    <Box className="text-center pt-2 mt-6 mb-20">
                        <Text size="5" weight="medium" className="block" style={{ color: gray.gray11, marginBottom: '1rem' }}>
                             Still want to learn more?
                         </Text>
                         <Button variant="classic" color="lime" size="3" asChild>
                             <Link href="/blog" className="flex items-center gap-2">
                                 Read Our Tech Blog
                                 <ArrowRightIcon width="16" height="16" />
                             </Link>
                         </Button>
                     </Box>
                 </div>
             </section>

             {/* Waitlist Section */}
             {/* border between sections is limited to the centered content width (moved to inner container) */}
             <section id="waitlist" className="px-6 bg-white" style={{backgroundColor: '#ffffff', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
                 {/* decorative, non-interactive whisk background */}
                 {/* Hidden on small screens to avoid clutter. Each whisk is wrapped in an absolutely positioned div that uses translate(-50%,-50%) to center and avoid layout shift. Images are lazy-loaded and non-interactive. */}
                 <div aria-hidden className="absolute inset-0 pointer-events-none hidden sm:block">
                     {whiskPositions.map((w, i) => {
                         const transform = `translate(-50%, -50%) rotate(${w.rotate}deg)`;
                         return (
                             <div
                                 key={i}
                                 className="absolute"
                                 style={{
                                     left: `${w.left}%`,
                                     top: `${w.top}%`,
                                     width: `${w.size}vw`,
                                     height: `${w.size}vw`,
                                     opacity: 0.3,
                                     overflow: 'hidden',
                                     mixBlendMode: 'multiply',
                                     transform,
                                     transformOrigin: 'center',
                                     pointerEvents: 'none',
                                     willChange: 'transform'
                                 }}
                             >
                                 <span aria-hidden style={{ display: 'inline-block', width: '100%', height: '100%', textAlign: 'center', fontSize: `${w.size}vw`, lineHeight: 1 }}>
                                     🍵
                                 </span>
                             </div>
                         );
                     })}
                 </div>

                 {/* limit the top border to the centered content width so it doesn't span full page width */}
                 <div className="max-w-7xl mx-auto" style={{ position: 'relative', zIndex: 2, borderTop: `1px solid ${sage.sage6}`, paddingTop: '4rem', paddingBottom: '6rem' }}>
                     <div className="max-w-4xl mx-auto text-center">
                         <Text size="9" weight="bold" className="block" style={{ color: gray.gray12, marginBottom: '0.5rem' }}>
                             Join the waitlist for early access
                         </Text>
                         <div className="flex justify-center mb-5">
                             <Text size="4" className="block" style={{ color: gray.gray11, maxWidth: '42rem' }}>
                                 Be among the first to experience Maatchaa when we launch.
                             </Text>
                         </div>
                         <WaitlistForm />
                     </div>
                 </div>
             </section>

            <Footer />
        </div>
    );
}
