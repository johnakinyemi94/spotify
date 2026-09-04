import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full border-b border-emerald-900/60 bg-black/30 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-3" aria-label="Spotify Wrapped home">
          <Image src="/spotify.svg" alt="Spotify" width={90} height={28} className="h-7 w-auto" />
          <span className="hidden text-sm font-bold tracking-wide text-white sm:inline">WRAPPED UP</span>
        </Link>
        <div className="flex items-center gap-5 text-sm font-semibold">
          <Link href="/" className="text-zinc-300 transition-colors hover:text-emerald-400">Home</Link>
          <Link href="/wrapped" className="rounded-full bg-emerald-500 px-4 py-2 text-black transition-colors hover:bg-emerald-400">My Wrapped</Link>
        </div>
      </nav>
    </header>
  );
}