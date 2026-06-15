import { useState } from 'react'
import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { DeliveryTable }     from '@/components/organisms/DeliveryTable/DeliveryTable'
import { DeliveryForm }      from '@/components/organisms/DeliveryForm/DeliveryForm'

export function DeliveriesPage() {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <DashboardTemplate>
      <DeliveryTable onNewDelivery={() => setFormOpen(true)} />
      <DeliveryForm open={formOpen} onClose={() => setFormOpen(false)} />
    </DashboardTemplate>
  )
}
