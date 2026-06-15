import { useQuery } from '@tanstack/react-query'
import {
  reportService,
  type SalesReportFilters,
  type GoodsReceivedFilters,
  type TransferReportFilters,
} from '@/services/reportService'

// All report queries use enabled:false — triggered explicitly by the page via refetch()

export function useSalesReport(filters: SalesReportFilters, enabled: boolean) {
  return useQuery({
    queryKey:  ['report-sales', filters],
    queryFn:   () => reportService.getSalesReport(filters),
    enabled,
    staleTime: 0,
  })
}

export function useGoodsReceived(filters: GoodsReceivedFilters, enabled: boolean) {
  return useQuery({
    queryKey:  ['report-goods-received', filters],
    queryFn:   () => reportService.getGoodsReceived(filters),
    enabled,
    staleTime: 0,
  })
}

export function useTransferReport(filters: TransferReportFilters, enabled: boolean) {
  return useQuery({
    queryKey:  ['report-transfers', filters],
    queryFn:   () => reportService.getTransferReport(filters),
    enabled,
    staleTime: 0,
  })
}

export function useTellers() {
  return useQuery({
    queryKey:  ['tellers'],
    queryFn:   reportService.getTellers,
    staleTime: 5 * 60_000,
  })
}
