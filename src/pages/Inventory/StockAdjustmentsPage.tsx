import { DashboardTemplate }    from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { StockAdjustmentTable } from '@/components/organisms/StockAdjustmentTable/StockAdjustmentTable'

export function StockAdjustmentsPage() {
  return (
    <DashboardTemplate>
      <StockAdjustmentTable />
    </DashboardTemplate>
  )
}
