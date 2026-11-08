import Image from "next/image";
import Link from "next/link";
import { mdcLogo, stockPhotos } from "@/lib/media/assets";

export function SiteFooter({ tone = "solid" }: { tone?: "solid" | "glass" }) {
  if (tone === "glass") {
    return (
      <footer>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-sm leading-relaxed text-navy sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg rounded-2xl border border-white/30 bg-black/45 p-4 text-white shadow-sm">
            <Image src={mdcLogo.src} alt="" width={mdcLogo.width} height={mdcLogo.height} className="h-16 w-auto" />
            <p className="mt-2">
              Independent student project. Not an official Miami Dade College service. The seal is not an endorsement.
            </p>
            <p className="mt-1 text-xs text-white/85">Background photograph supplied by the user. Permission and source were not independently verified.</p>
            <p className="mt-2">
              <Link className="underline" href="/catalog">
                Catalog tester
              </Link>
              {" · "}
              <Link className="underline" href="/pilot">
                Earlier cybersecurity example
              </Link>
            </p>
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 text-sm leading-relaxed text-muted md:grid-cols-2">
        <div>
          <Image src={mdcLogo.src} alt="" width={mdcLogo.width} height={mdcLogo.height} className="h-16 w-auto" />
          <p className="mt-3">
            North Path is an independent student project for exploring Miami Dade College offerings. The seal’s outer white field was removed for display. Its presence is not an endorsement, and this is not an official Miami Dade College service.
          </p>
          <p className="mt-2">{mdcLogo.note}</p>
        </div>
        <div>
          <p className="font-semibold text-navy">Photographs</p>
          <ul className="mt-2 space-y-2">
            {Object.values(stockPhotos).map((photo) => (
              <li key={photo.src}>
                <a className="underline" href={photo.sourcePage}>
                  {photo.artist}
                </a>{" "}
                · {photo.license}. {photo.note}
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <Link className="underline" href="/catalog">
              Catalog tester
            </Link>
            {" · "}
            <Link className="underline" href="/pilot">
              Earlier cybersecurity example
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
