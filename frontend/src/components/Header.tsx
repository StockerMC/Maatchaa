"use client"

export default function Header() {
    return (
        <header className="relative z-20 flex items-center justify-between p-6">
            {/* Logo */}
            <div className="flex items-center">{/* Logo removed */}</div>

            {/* Navigation */}
            <nav className="flex items-center space-x-2">
                <a
                    href="#"
                    className="text-white/80 hover:text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    Pricing
                </a>
                <a
                    href="#"
                    className="text-white/80 hover:text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    Businesses
                </a>
                <a
                    href="#"
                    className="text-white/80 hover:text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    Creators
                </a>
            </nav>

            {/* Login Button Group with Arrow */}
                <button className="px-7 py-2 rounded-full bg-[#e6e1c5] hover:bg-[#d9d4ba] text-black font-medium text-sm transition-all duration-300 hover:bg-white/90 cursor-pointer h-9 flex items-center z-10">
                    Login
                </button>
        </header>
    )
}
