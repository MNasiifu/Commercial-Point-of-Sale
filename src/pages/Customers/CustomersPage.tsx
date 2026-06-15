import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { CustomerTable }     from '@/components/organisms/CustomerTable/CustomerTable'

export function CustomersPage() {
  return (
    <DashboardTemplate>
      <CustomerTable />
    </DashboardTemplate>
  )
}
