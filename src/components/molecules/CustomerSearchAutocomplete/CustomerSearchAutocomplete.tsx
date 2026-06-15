import { useState } from 'react'
import {
  Autocomplete, Box, CircularProgress, TextField, Typography,
} from '@mui/material'
import { getSearchTextFieldInputProps } from '@/components/molecules/SearchTextField'
import { useCustomerSearch } from '@/hooks/customers/useCustomers'
import type { Customer } from '@/types/database.types'

interface Props {
  value?:      Customer | null
  onChange:    (customer: Customer | null) => void
  label?:      string
  size?:       'small' | 'medium'
  disabled?:   boolean
  placeholder?: string
  error?:      boolean
  helperText?: string
}

export function CustomerSearchAutocomplete({
  value, onChange, label = 'Customer', size = 'small',
  disabled, placeholder = 'Search by name or phone…', error, helperText,
}: Props) {
  const [query, setQuery] = useState('')
  const { data: options = [], isFetching } = useCustomerSearch(query)

  return (
    <Autocomplete<Customer>
      options={options}
      value={value ?? null}
      loading={isFetching}
      inputValue={query}
      onInputChange={(_, v, reason) => { if (reason === 'input') setQuery(v) }}
      onChange={(_, v) => { onChange(v); if (!v) setQuery('') }}
      getOptionLabel={(o) => o.full_name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(x) => x}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size={size}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          InputProps={getSearchTextFieldInputProps({
            value: query,
            onClear: () => {
              setQuery('')
              onChange(null)
            },
            inputProps: params.InputProps,
            endAdornment: isFetching ? <CircularProgress size={14} /> : undefined,
          })}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id} display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 28, height: 28, borderRadius: '50%',
              bgcolor: 'primary.light', color: 'primary.contrastText',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}
          >
            {option.full_name.charAt(0).toUpperCase()}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600}>{option.full_name}</Typography>
            {option.phone && (
              <Typography variant="caption" color="text.secondary">{option.phone}</Typography>
            )}
          </Box>
        </Box>
      )}
    />
  )
}
