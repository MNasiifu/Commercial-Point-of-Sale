import type { ChangeEvent, ReactNode } from 'react'
import {
  IconButton,
  InputAdornment,
  TextField,
  type TextFieldProps,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

export interface SearchTextFieldInputPropsOptions {
  value: string
  onClear: () => void
  /** Rendered before the clear button and Autocomplete dropdown arrow */
  endAdornment?: ReactNode
  /** Replaces the default search icon at the start */
  startAdornment?: ReactNode
  /** Existing InputProps (e.g. from MUI Autocomplete renderInput params) */
  inputProps?: TextFieldProps['InputProps']
}

/** Builds start/end adornments for search inputs (TextField or Autocomplete). */
export function getSearchTextFieldInputProps({
  value,
  onClear,
  endAdornment,
  startAdornment,
  inputProps,
}: SearchTextFieldInputPropsOptions): NonNullable<TextFieldProps['InputProps']> {
  const showClear = value.length > 0

  return {
    ...inputProps,
    startAdornment: (
      <InputAdornment position="start">
        {startAdornment ?? <SearchIcon fontSize="small" color="action" />}
      </InputAdornment>
    ),
    endAdornment: (
      <>
        {endAdornment}
        {showClear && (
          <InputAdornment position="end">
            <IconButton
              size="small"
              edge="end"
              aria-label="Clear search"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClear}
              tabIndex={-1}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        )}
        {inputProps?.endAdornment}
      </>
    ),
  }
}

export interface SearchTextFieldProps extends Omit<TextFieldProps, 'type'> {
  onClear?: () => void
}

export function SearchTextField({
  value = '',
  onChange,
  onClear,
  InputProps,
  size = 'small',
  ...rest
}: SearchTextFieldProps) {
  const stringValue = String(value ?? '')

  const handleClear = () => {
    if (onClear) {
      onClear()
      return
    }
    onChange?.({
      target: { value: '' },
    } as ChangeEvent<HTMLInputElement>)
  }

  return (
    <TextField
      {...rest}
      size={size}
      value={value}
      onChange={onChange}
      InputProps={{
        ...InputProps,
        ...getSearchTextFieldInputProps({
          value: stringValue,
          onClear: handleClear,
          inputProps: InputProps,
        }),
      }}
    />
  )
}
