import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { CategoryTable } from '@/components/organisms/CategoryTable/CategoryTable'

export function CategoriesPage() {
  return (
    <DashboardTemplate>
      <CategoryTable />
    </DashboardTemplate>
  )
}
