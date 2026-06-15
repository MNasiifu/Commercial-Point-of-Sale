import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { StockTakeTable }    from '@/components/organisms/StockTakeTable/StockTakeTable'

export function StockTakesPage() {
  return (
    <DashboardTemplate>
      <StockTakeTable />
    </DashboardTemplate>
  )
}
