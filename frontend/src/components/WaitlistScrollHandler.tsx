"use client"

import { useEffect } from "react"

export default function WaitlistScrollHandler() {
  useEffect(() => {
    const scrollToWaitlist = () => {
      if (window.location.hash === '#waitlist') {
        // Small delay to ensure the page has rendered
        setTimeout(() => {
          document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }

    // Check on mount
    scrollToWaitlist()

    // Listen for hash changes (when navigating from other pages)
    window.addEventListener('hashchange', scrollToWaitlist)

    return () => {
      window.removeEventListener('hashchange', scrollToWaitlist)
    }
  }, [])

  return null
}
