import { DashboardTemplate } from "@/components/templates/DashboardTemplate/DashboardTemplate";
import { TransferTable } from "@/components/organisms/TransferTable/TransferTable";

export function TransfersPage() {
  return (
    <DashboardTemplate>
      <TransferTable />
    </DashboardTemplate>
  );
}
