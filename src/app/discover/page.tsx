import { InteriorBackdrop } from "@/components/interior-backdrop";
import { DiscoverFlow } from "@/components/discover-flow";
import { getDirectory } from "@/lib/directory/build";

export default function DiscoverPage() {
  const directory = getDirectory();
  return (
    <InteriorBackdrop page="discover">
      <main id="content">
        <DiscoverFlow groups={directory.groups} programs={directory.programs} />
      </main>
    </InteriorBackdrop>
  );
}
