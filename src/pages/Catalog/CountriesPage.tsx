import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { CountryTable } from '@/components/organisms/CountryTable/CountryTable'

export function CountriesPage() {
  return (
    <DashboardTemplate>
      <CountryTable />
    </DashboardTemplate>
  )
}
