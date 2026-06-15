import { useEffect, useState } from 'react'
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, FormHelperText, Grid, IconButton,
  InputLabel, MenuItem, Select, TextField, Tooltip, Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver }         from '@hookform/resolvers/zod'
import { z }                   from 'zod'

import { useCreateUser, useUpdateUser }  from '@/hooks/users/useUserMutations'
import { useBranches }                  from '@/hooks/users/useUsers'
import type { CreateUserResult }        from '@/services/userService'
import type { Profile }                 from '@/types/database.types'

// ── Unified schema (email optional — required only for create) ──

const userFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email:     z.string().max(200).optional(),
  role:      z.enum(['admin', 'manager', 'teller'] as const, { required_error: 'Role is required' }),
  branch_id: z.string().uuid('Branch is required'),
})

type UserFormValues = z.infer<typeof userFormSchema>

interface Props {
  open:      boolean
  onClose:   () => void
  existing?: Profile
  onCreated?: (result: CreateUserResult & { email: string; full_name: string }) => void
}

const ROLE_OPTIONS = [
  { value: 'admin',   label: 'Admin'   },
  { value: 'manager', label: 'Manager' },
  { value: 'teller',  label: 'Teller'  },
] as const

export function UserForm({ open, onClose, existing, onCreated }: Props) {
  const isEdit = !!existing
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const { data: branches = [], isLoading: loadingBranches } = useBranches()

  const {
    control, handleSubmit, reset, setError,
    formState: { isSubmitting, errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      full_name: existing?.full_name ?? '',
      email:     '',
      role:      existing?.role      ?? 'teller',
      branch_id: existing?.branch_id ?? '',
    },
  })

  // Re-populate when the dialog re-opens with a different record
  useEffect(() => {
    reset({
      full_name: existing?.full_name ?? '',
      email:     '',
      role:      existing?.role      ?? 'teller',
      branch_id: existing?.branch_id ?? '',
    })
  }, [existing, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => { reset(); onClose() }

  const onSubmit = async (values: UserFormValues) => {
    if (!isEdit) {
      // Email is required for create
      if (!values.email || !values.email.includes('@')) {
        setError('email', { message: 'Valid email address is required' })
        return
      }
      const result = await createUser.mutateAsync({
        full_name: values.full_name,
        email:     values.email,
        role:      values.role,
        branch_id: values.branch_id,
      })
      onCreated?.({ ...result, email: values.email, full_name: values.full_name })
    } else {
      await updateUser.mutateAsync({
        id: existing!.id,
        data: {
          full_name: values.full_name,
          role:      values.role,
          branch_id: values.branch_id,
        },
      })
    }
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit user' : 'Create new user'}</DialogTitle>

      <DialogContent>
        <Grid container spacing={2} mt={0.5}>

          {/* Full name */}
          <Grid item xs={12}>
            <Controller
              name="full_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full name *"
                  size="small"
                  fullWidth
                  error={!!errors.full_name}
                  helperText={errors.full_name?.message}
                />
              )}
            />
          </Grid>

          {/* Email — create mode only */}
          {!isEdit && (
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label="Email address *"
                    size="small"
                    fullWidth
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
          )}

          {/* Role */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <FormControl size="small" fullWidth error={!!errors.role}>
                  <InputLabel>Role *</InputLabel>
                  <Select {...field} label="Role *">
                    {ROLE_OPTIONS.map((r) => (
                      <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                    ))}
                  </Select>
                  {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Grid>

          {/* Branch */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="branch_id"
              control={control}
              render={({ field }) => (
                <FormControl size="small" fullWidth error={!!errors.branch_id}>
                  <InputLabel>Branch *</InputLabel>
                  <Select {...field} label="Branch *" disabled={loadingBranches}>
                    {loadingBranches && (
                      <MenuItem disabled value="">
                        <CircularProgress size={14} sx={{ mr: 1 }} /> Loading…
                      </MenuItem>
                    )}
                    {branches.map((b) => (
                      <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                    ))}
                  </Select>
                  {errors.branch_id && (
                    <FormHelperText>{errors.branch_id.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>

          {/* Note for edit mode */}
          {isEdit && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Email address cannot be changed here.
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting
            ? <CircularProgress size={18} color="inherit" />
            : isEdit ? 'Save changes' : 'Create user'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Credentials dialog shown after successful user creation ──

interface CredentialsDialogProps {
  open:         boolean
  email:        string
  fullName:     string
  tempPassword: string
  onClose:      () => void
}

export function CredentialsDialog({
  open, email, fullName, tempPassword, onClose,
}: CredentialsDialogProps) {
  const [copied, setCopied] = useState(false)

  const copyAll = () => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${tempPassword}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>User created</DialogTitle>
      <DialogContent>
        <Typography variant="body2" mb={2}>
          <strong>{fullName}</strong>'s account is ready. Share these credentials
          securely, they will be required to change their password on first login.
        </Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <TextField
              label="Email"
              value={email}
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Temporary password"
              value={tempPassword}
              size="small"
              fullWidth
              InputProps={{
                readOnly: true,
                sx: { fontFamily: 'monospace', fontWeight: 600, letterSpacing: 1 },
                endAdornment: (
                  <Tooltip title={copied ? 'Copied!' : 'Copy credentials'} arrow>
                    <IconButton size="small" onClick={copyAll}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          </Grid>
        </Grid>

        <Typography variant="caption" color="warning.main" display="block" mt={1.5}>
          A welcome email with these credentials has been sent to {email} (if Resend
          is configured).
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="contained" onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}
