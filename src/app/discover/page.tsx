import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DiscoverFlow } from "@/components/discover-flow";
import { getDirectory } from "@/lib/directory/build";

export default function DiscoverPage() {
  const directory = getDirectory();
  return (
    <>
      <SiteHeader />
      <main id="content">
        <DiscoverFlow groups={directory.groups} programs={directory.programs} />
      </main>
      <SiteFooter />
    </>
  );
}
