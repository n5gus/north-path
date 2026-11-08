import Link from "next/link";
import { PathwayApp } from "@/components/pathway-app";
import { SiteHeader } from "@/components/site-header";

export default function PilotPage() {
  return (
    <>
      <SiteHeader />
      <p className="mx-auto max-w-6xl px-5 pt-6 text-sm text-muted">
        This is the earlier cybersecurity example. It is not the catalog. Use <Link className="underline" href="/describe">Describe</Link>, <Link className="underline" href="/discover">Discover</Link>, or <Link className="underline" href="/directory">Directory</Link> for the indexed offerings.
      </p>
      <PathwayApp />
    </>
  );
}
