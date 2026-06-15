import { useNavigate } from 'react-router-dom'
import { DashboardTemplate }   from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { StockReceivingForm }  from '@/components/organisms/StockReceivingForm/StockReceivingForm'

export function ReceiveStockPage() {
  const navigate = useNavigate()

  return (
    <DashboardTemplate>
      <StockReceivingForm onDone={() => navigate('/inventory/product-stock')} />
    </DashboardTemplate>
  )
}
