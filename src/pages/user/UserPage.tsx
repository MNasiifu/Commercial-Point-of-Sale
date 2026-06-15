import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { UserTable }          from '@/components/organisms/UserTable/UserTable'

export function UserPage() {
  return (
    <DashboardTemplate>
      <UserTable />
    </DashboardTemplate>
  )
}