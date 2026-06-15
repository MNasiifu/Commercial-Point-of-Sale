import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { ProductTable }      from '@/components/organisms/ProductTable/ProductTable'

export function ProductsPage() {
  return (
    <DashboardTemplate>
      <ProductTable />
    </DashboardTemplate>
  )
}
