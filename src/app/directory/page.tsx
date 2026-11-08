import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ContinuingEducationPanel } from "@/components/continuing-education-panel";
import { DirectoryExplorer } from "@/components/directory-explorer";
import { getDirectory } from "@/lib/directory/build";

export default function DirectoryPage() {
  return (
    <>
      <SiteHeader />
      <main id="content">
        <DirectoryExplorer directory={getDirectory()} />
        <ContinuingEducationPanel />
      </main>
      <SiteFooter />
    </>
  );
}
