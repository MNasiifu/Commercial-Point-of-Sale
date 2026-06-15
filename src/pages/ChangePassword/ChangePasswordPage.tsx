import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Typography, InputAdornment,
  IconButton, Alert, CircularProgress, Paper,
  LinearProgress,
} from '@mui/material'
import LockIcon          from '@mui/icons-material/Lock'
import VisibilityIcon    from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import SecurityIcon      from '@mui/icons-material/Security'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import { FormTextField } from '@/components/molecules/FormField/FormField'
import { Logo }          from '@/components/atoms/Logo/Logo'
import { useAuth }       from '@/hooks/auth/useAuth'

const schema = z
  .object({
    newPassword:     z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

function getStrength(pwd: string): { score: number; label: string; color: 'error' | 'warning' | 'success' } {
  let score = 0
  if (pwd.length >= 8)  score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 2) return { score: score * 20, label: 'Weak',   color: 'error'   }
  if (score <= 3) return { score: score * 20, label: 'Fair',   color: 'warning' }
  return               { score: score * 20, label: 'Strong', color: 'success' }
}

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { changePassword, fullName } = useAuth()
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const pwd = watch('newPassword')
  const strength = getStrength(pwd)

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await changePassword(values.newPassword)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to change password')
    }
  }

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={3}
      sx={{ bgcolor: 'background.default' }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
        }}
      >
        {/* Logo */}
        <Box display="flex" justifyContent="center" mb={4}>
          <Logo size="md" />
        </Box>

        {/* Security notice */}
        <Box
          display="flex"
          alignItems="flex-start"
          gap={1.5}
          p={2}
          mb={3}
          borderRadius={2}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        >
          <SecurityIcon sx={{ mt: 0.25, flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Set your new password
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Welcome, {fullName}. For your security, please set a new password before continuing.
            </Typography>
          </Box>
        </Box>

        {serverError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {serverError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          display="flex"
          flexDirection="column"
          gap={2.5}
        >
          <FormTextField
            name="newPassword"
            control={control}
            label="New password"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            autoFocus
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowNew((v) => !v)} edge="end" tabIndex={-1}>
                    {showNew ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password strength bar */}
          {pwd.length > 0 && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={strength.score}
                color={strength.color}
                sx={{ borderRadius: 2, height: 6, mb: 0.5 }}
              />
              <Typography variant="caption" color={`${strength.color}.main`} fontWeight={600}>
                Strength: {strength.label}
              </Typography>
            </Box>
          )}

          <FormTextField
            name="confirmPassword"
            control={control}
            label="Confirm new password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowConfirm((v) => !v)} edge="end" tabIndex={-1}>
                    {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isSubmitting}
            sx={{ mt: 1, height: 48 }}
          >
            {isSubmitting
              ? <CircularProgress size={22} color="inherit" />
              : 'Set new password & continue'
            }
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
          Requirements: min 8 characters, one uppercase letter, one number.
        </Typography>
      </Paper>
    </Box>
  )
}
