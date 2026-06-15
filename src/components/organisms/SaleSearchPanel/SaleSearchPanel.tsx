import { useState } from 'react'
import {
  Alert, Box, Button, Chip, CircularProgress, Divider,
  Drawer, IconButton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow,
  Tooltip, Typography,
} from '@mui/material'
import CloseIcon        from '@mui/icons-material/Close'
import BlockIcon        from '@mui/icons-material/Block'
import UndoIcon         from '@mui/icons-material/Undo'

import { SearchTextField }   from '@/components/molecules/SearchTextField'
import { useSales }          from '@/hooks/sales/useSales'
import { usePermissions }    from '@/hooks/auth/usePermissions'
import { VoidSaleDialog }    from '@/components/organisms/VoidSaleDialog/VoidSaleDialog'
import { formatUGX, formatDateTime } from '@/lib/formatters'
import type { SaleWithDetails }   from '@/services/salesService'
import type { SaleType }          from '@/types/database.types'

const SALE_TYPE_LABELS: Record<SaleType, string> = {
  walk_in:  'Walk-in',
  account:  'Account',
  delivery: 'Delivery',
}

interface Props {
  open:            boolean
  onClose:         () => void
  onSelectForReturn: (sale: SaleWithDetails) => void
}

export function SaleSearchPanel({ open, onClose, onSelectForReturn }: Props) {
  const [search,      setSearch]      = useState('')
  const [voidTarget,  setVoidTarget]  = useState<SaleWithDetails | null>(null)
  const { canVoidSale, canProcessReturn } = usePermissions()

  const { data: sales = [], isLoading, isError } = useSales({
    search,
    showVoided: false,
  })

  const handleVoided = () => setVoidTarget(null)

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: '100%', sm: 600 }, p: 0 } }}
      >
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          px={2.5}
          py={1.5}
          borderBottom="1px solid"
          borderColor="divider"
        >
          <Typography variant="subtitle1" fontWeight={700} flex={1}>
            Find Sale
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Search field */}
        <Box px={2.5} py={2}>
          <SearchTextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sale #, customer name, or phone…"
            fullWidth
            autoFocus
          />
        </Box>

        <Divider />

        {/* Results */}
        <Box flex={1} overflow="auto">
          {isLoading && (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={28} />
            </Box>
          )}
          {isError && (
            <Box px={2.5} py={2}>
              <Alert severity="error">Failed to load sales.</Alert>
            </Box>
          )}
          {!isLoading && !isError && sales.length === 0 && (
            <Box px={2.5} py={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                {search.trim() ? 'No sales found matching your search.' : 'Enter a sale number or customer name to search.'}
              </Typography>
            </Box>
          )}
          {!isLoading && sales.map((sale) => (
            <SaleRow
              key={sale.id}
              sale={sale}
              canVoid={canVoidSale}
              canReturn={canProcessReturn}
              onVoid={() => setVoidTarget(sale)}
              onReturn={() => { onSelectForReturn(sale); onClose() }}
            />
          ))}
        </Box>
      </Drawer>

      {voidTarget && (
        <VoidSaleDialog
          open
          saleId={voidTarget.id}
          saleNumber={voidTarget.sale_number}
          onClose={() => setVoidTarget(null)}
          onVoided={handleVoided}
        />
      )}
    </>
  )
}

interface SaleRowProps {
  sale:      SaleWithDetails
  canVoid:   boolean
  canReturn: boolean
  onVoid:    () => void
  onReturn:  () => void
}

function SaleRow({ sale, canVoid, canReturn, onVoid, onReturn }: SaleRowProps) {
  const [expanded, setExpanded] = useState(false)
  const customerName = sale.customers?.full_name ?? '—'
  const itemCount    = sale.sale_items.length

  return (
    <Box borderBottom="1px solid" borderColor="divider">
      {/* Summary row */}
      <Box
        px={2.5}
        py={1.5}
        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        onClick={() => setExpanded((x) => !x)}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box flex={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                {sale.sale_number}
              </Typography>
              <Chip
                label={SALE_TYPE_LABELS[sale.sale_type] ?? sale.sale_type}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 18, borderRadius: '4px' }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {customerName} · {formatDateTime(sale.created_at)} · {itemCount} item{itemCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Typography variant="body2" fontWeight={700} fontFamily="monospace" flexShrink={0}>
            {formatUGX(sale.total_amount)}
          </Typography>
        </Stack>
      </Box>

      {/* Expanded item list + actions */}
      {expanded && (
        <Box px={2.5} pb={2}>
          <Table size="small" sx={{ mb: 1.5 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Product</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Line total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sale.sale_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="caption" fontWeight={600}>
                      {item.products?.name ?? '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {[item.products?.sizes?.name, item.products?.colors?.name].filter(Boolean).join(' · ') || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption">{item.quantity}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" fontFamily="monospace">
                      {formatUGX(item.line_total)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {canReturn && (
              <Tooltip title="Process a return for this sale" arrow>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UndoIcon fontSize="small" />}
                  onClick={(e) => { e.stopPropagation(); onReturn() }}
                >
                  Process return
                </Button>
              </Tooltip>
            )}
            {canVoid && (
              <Tooltip title="Void entire sale" arrow>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<BlockIcon fontSize="small" />}
                  onClick={(e) => { e.stopPropagation(); onVoid() }}
                >
                  Void sale
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
