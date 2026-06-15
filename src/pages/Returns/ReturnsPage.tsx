import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import { DashboardTemplate }  from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { ReturnTable }        from '@/components/organisms/ReturnTable/ReturnTable'
import { SaleSearchPanel }    from '@/components/organisms/SaleSearchPanel/SaleSearchPanel'
import { ReturnForm }         from '@/components/organisms/ReturnForm/ReturnForm'
import type { SaleWithDetails } from '@/services/salesService'

export function ReturnsPage() {
  const navigate = useNavigate()
  const [searchOpen,      setSearchOpen]      = useState(false)
  const [selectedSale,    setSelectedSale]    = useState<SaleWithDetails | null>(null)
  const returnFormOpen = !!selectedSale

  const handleSelectSale = (sale: SaleWithDetails) => {
    setSelectedSale(sale)
  }

  const handleReturnDone = (returnId: string) => {
    setSelectedSale(null)
    navigate(`/returns/${returnId}`)
  }

  return (
    <DashboardTemplate>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>Returns</Typography>
        <Typography variant="body2" color="text.secondary">
          Process product returns and view return history.
        </Typography>
      </Box>

      <ReturnTable onNewReturn={() => setSearchOpen(true)} />

      {/* Step 1: Find the sale */}
      <SaleSearchPanel
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectForReturn={handleSelectSale}
      />

      {/* Step 2: Fill in the return form */}
      <Dialog
        open={returnFormOpen}
        onClose={() => setSelectedSale(null)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700} flex={1}>
            Process Return
          </Typography>
          <IconButton size="small" onClick={() => setSelectedSale(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSale && (
            <ReturnForm
              sale={selectedSale}
              onDone={handleReturnDone}
              onCancel={() => setSelectedSale(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardTemplate>
  )
}
