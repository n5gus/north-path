import Image from "next/image";
import type { StockPhoto } from "@/lib/media/assets";

export function StockImage({ photo, className = "", imageClassName = "h-80 w-full rounded-3xl object-cover" }: { photo: StockPhoto; className?: string; imageClassName?: string }) {
  return (
    <figure className={className}>
      <Image src={photo.src} alt={photo.alt} width={1600} height={1066} className={imageClassName} />
      <figcaption className="mt-1 text-xs leading-snug text-muted">
        {photo.artist} · {photo.license}. Not an MDC campus or student.
      </figcaption>
    </figure>
  );
}
