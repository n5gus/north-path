import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { landingBackground } from "@/lib/media/assets";

const PATHS = [
  {
    href: "/describe",
    title: "Describe",
    text: "Say or type the work you want. North Path matches those words to indexed program names, then builds a plan around your week.",
  },
  {
    href: "/discover",
    title: "Discover",
    text: "Answer a short set of questions about interests, time, and budget. The reasons cite your answers and the catalog, not a hidden aptitude score.",
  },
  {
    href: "/directory",
    title: "Directory",
    text: "See every indexed program in CIP groups, with a map and a list. Relationships are labeled. Transfer is not assumed.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <Image
          src={landingBackground.src}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-[center_42%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/25" />
      </div>
      <p className="sr-only">
        The page background is a supplied dusk photograph of a campus building, palm trees, and their reflection in a lake. Permission and source were not independently verified.
      </p>
      <div className="relative z-10">
        <SiteHeader tone="glass" />
        <main id="content" className="mx-auto flex min-h-[calc(100vh-5.5rem)] max-w-6xl items-center px-5 py-8">
          <section aria-label="Describe, Discover, and Directory" className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            {PATHS.map((path) => (
              <article key={path.href} className="flex flex-col rounded-3xl border border-white/30 bg-black/40 p-5">
                <h2 className="font-display text-4xl text-white">{path.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white">{path.text}</p>
                <Link href={path.href} className="mt-5 inline-flex w-fit rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white">
                  Open {path.title}
                </Link>
              </article>
            ))}
          </section>
        </main>
        <SiteFooter tone="glass" />
      </div>
    </div>
  );
}
