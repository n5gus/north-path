import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { interiorBackgrounds } from "@/lib/media/assets";

export function InteriorBackdrop({
  page,
  children,
}: {
  page: keyof typeof interiorBackgrounds;
  children: React.ReactNode;
}) {
  const photo = interiorBackgrounds[page];
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <Image src={photo.src} alt="" fill priority unoptimized sizes="100vw" className={`object-cover ${photo.position}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/45" />
      </div>
      <p className="sr-only">
        Background photograph supplied by the user: {photo.scene} Permission and source were not independently verified.
      </p>
      <div className="relative z-10">
        <SiteHeader tone="glass" />
        {children}
      </div>
    </div>
  );
}
