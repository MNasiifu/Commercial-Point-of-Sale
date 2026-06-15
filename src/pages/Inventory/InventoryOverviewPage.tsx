import { DashboardTemplate }  from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { InventoryOverview }  from '@/components/organisms/InventoryOverview/InventoryOverview'

export function InventoryOverviewPage() {
  return (
    <DashboardTemplate>
      <InventoryOverview />
    </DashboardTemplate>
  )
}
