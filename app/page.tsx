import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getLoginUrl } from "@/app/utils/spotify";

export default function Home() {
  const loginUrl = getLoginUrl();

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans bg-linear-to-r from-green-800 via-black to-black">
      <Navbar />
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-transparent sm:items-start">
        <Image
          className="h-100% w-[70px] pb-5"
          src="/spotify.svg"
          alt="Next.js logo"
          width={20}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="fx-ember text-6xl font-bold leading-15 tracking-tight text-black dark:text-zinc-50">
            Spotify Wrapped
          </h1>
          <div className="card flex flex-col items-center text-center">
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-200 pb-4">
              Discover your top Spotify tracks and artists from the past year.
              Also, get AI-generated song recommendations based on your taste.
            </p>
            <p className="font-semibold">
              Click &quot;Get My Wrapped&quot; to see your personalized results!
            </p>
          </div>
          <div className="flex flex-col font-medium">
            <Link
              href={loginUrl}
              className="flex bg-emerald-500 hover:bg-emerald-400 h-12 w-full items-center justify-center gap-2 rounded-full
              px-5 transition-colors font-bold text-black md:w-[158px]"
              rel="noopener noreferrer"
            >
              Get My Wrapped
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
