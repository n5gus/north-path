"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mdcLogo } from "@/lib/media/assets";

const LINKS = [
  { href: "/describe", label: "Describe" },
  { href: "/discover", label: "Discover" },
  { href: "/directory", label: "Directory" },
];

export function SiteHeader({ tone = "solid" }: { tone?: "solid" | "glass" }) {
  const pathname = usePathname();
  const glass = tone === "glass";
  return (
    <header className={glass ? "border-b border-white/25 bg-black/35" : "border-b border-line bg-white"}>
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4">
          <Image src={mdcLogo.src} alt={mdcLogo.alt} width={mdcLogo.width} height={mdcLogo.height} className="h-14 w-auto" />
          <div className={glass ? "border-l border-white/40 pl-4" : "border-l border-line pl-4"}>
            <Link href="/" className={`font-display text-2xl leading-none ${glass ? "text-white" : "text-navy"}`}>
              North Path
            </Link>
            <p className={`mt-1 max-w-xs text-xs leading-snug ${glass ? "text-white/90" : "text-muted"}`}>Independent student project</p>
          </div>
        </div>
        <nav aria-label="Pathways" className="flex flex-wrap gap-2">
          {LINKS.map((link) => {
            const current = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${current ? "bg-teal text-white" : glass ? "text-white hover:bg-white/15" : "text-navy hover:bg-[#e7eefb]"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
