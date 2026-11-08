import { InteriorBackdrop } from "@/components/interior-backdrop";
import { ContinuingEducationPanel } from "@/components/continuing-education-panel";
import { DirectoryExplorer } from "@/components/directory-explorer";
import { getDirectory } from "@/lib/directory/build";

export default function DirectoryPage() {
  return (
    <InteriorBackdrop page="directory">
      <main id="content">
        <DirectoryExplorer directory={getDirectory()} />
        <ContinuingEducationPanel />
      </main>
    </InteriorBackdrop>
  );
}
