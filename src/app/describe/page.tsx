import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DescribeFlow } from "@/components/describe-flow";
import { getDirectory } from "@/lib/directory/build";

export default function DescribePage() {
  const directory = getDirectory();
  return (
    <>
      <SiteHeader />
      <main id="content">
        <DescribeFlow programs={directory.programs} />
      </main>
      <SiteFooter />
    </>
  );
}
