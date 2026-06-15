import { DashboardTemplate } from "@/components/templates/DashboardTemplate/DashboardTemplate";
import { ProductStockTable } from "@/components/organisms/ProductStockTable/ProductStockTable";

export function ProductStockPage() {
  return (
    <DashboardTemplate>
      <ProductStockTable />
    </DashboardTemplate>
  );
}
