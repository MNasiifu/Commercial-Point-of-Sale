import { useParams } from "react-router-dom";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate/DashboardTemplate";
import { TransferDetail } from "@/components/organisms/TransferDetail/TransferDetail";

export function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <DashboardTemplate>
      {id && <TransferDetail transferId={id} />}
    </DashboardTemplate>
  );
}
