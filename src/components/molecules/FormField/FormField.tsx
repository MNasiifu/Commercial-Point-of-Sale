import {
  TextField, type TextFieldProps,
  FormControl, FormHelperText, InputLabel,
  Select, type SelectProps,
  MenuItem,
} from '@mui/material'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'

// ─── Text / number / password field ──────────────────────────
interface FormTextFieldProps<T extends FieldValues> extends Omit<TextFieldProps, 'name'> {
  name: Path<T>
  control: Control<T>
  label: string
}

export function FormTextField<T extends FieldValues>({
  name, control, label, ...rest
}: FormTextFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...rest}
          label={label}
          error={!!error}
          helperText={error?.message ?? rest.helperText}
          fullWidth
          value={field.value ?? ''}
        />
      )}
    />
  )
}

// ─── Select field ─────────────────────────────────────────────
interface SelectOption {
  value: string | number
  label: string
}

interface FormSelectFieldProps<T extends FieldValues> extends Omit<SelectProps, 'name'> {
  name: Path<T>
  control: Control<T>
  label: string
  options: SelectOption[]
  helperText?: string
}

export function FormSelectField<T extends FieldValues>({
  name, control, label, options, helperText, size, ...rest
}: FormSelectFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth error={!!error} size={size as 'small' | 'medium' | undefined}>
          <InputLabel>{label}</InputLabel>
          <Select {...field} {...rest} label={label} value={field.value ?? ''}>
            {options.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
          {(error?.message ?? helperText) && (
            <FormHelperText>{error?.message ?? helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}
