import { InteriorBackdrop } from "@/components/interior-backdrop";
import { DescribeFlow } from "@/components/describe-flow";
import { getDirectory } from "@/lib/directory/build";

export default function DescribePage() {
  const directory = getDirectory();
  return (
    <InteriorBackdrop page="describe">
      <main id="content">
        <DescribeFlow programs={directory.programs} />
      </main>
    </InteriorBackdrop>
  );
}
