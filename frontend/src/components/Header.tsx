import Link from "next/link"

export default function Header() {
    return (
        <header className="relative z-20 flex items-center justify-between p-6">
            {/* Logo */}
            <div className="flex items-center">{/* Logo removed */}</div>

            {/* Navigation */}
            <nav className="flex items-center space-x-8">
                <Link
                    href="/"
                    className="text-white/80 hover:text-white text-xl font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    Home
                </Link>
                <Link
                    href="/stores"
                    className="text-white/80 hover:text-white text-xl font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    Stores
                </Link>
                <Link
                    href="/creators"
                    className="text-white/80 hover:text-white text-xl font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    Creators
                </Link>
            </nav>

            {/* Login Button Group with Arrow
                <button className="px-8 py-3 rounded-full bg-[#e6e1c5] hover:bg-[#d9d4ba] text-black font-medium transition-all duration-300 cursor-pointer h-9 flex items-center z-10">
                    Login
                </button> */}
        </header>
    )
}
