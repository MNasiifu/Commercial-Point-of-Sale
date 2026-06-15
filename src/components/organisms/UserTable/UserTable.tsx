import { useState, useMemo } from 'react'
import {
  Box, Button, Chip, FormControl, IconButton,
  InputLabel, MenuItem, Select, Stack, Switch, FormControlLabel,
  Tooltip, Typography,
} from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { AppDataGrid } from '@/components/molecules/AppDataGrid'
import { SearchTextField } from '@/components/molecules/SearchTextField'
import EditIcon          from '@mui/icons-material/Edit'
import AddIcon           from '@mui/icons-material/Add'
import ToggleOnIcon      from '@mui/icons-material/ToggleOn'
import ToggleOffIcon     from '@mui/icons-material/ToggleOff'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

import { useAuth }                             from '@/hooks/auth/useAuth'
import { useUsers }                            from '@/hooks/users/useUsers'
import { useToggleUserActive, useDeleteUser }  from '@/hooks/users/useUserMutations'
import { UserForm, CredentialsDialog }         from '@/components/organisms/UserForm/UserForm'
import { ToggleUserModal }                     from '@/components/organisms/UserTable/ToggleUserModal'
import { DeleteUserModal }                     from '@/components/organisms/UserTable/DeleteUserModal'
import { formatDate, formatDateTime }        from '@/lib/formatters'
import type { UserWithBranch }               from '@/services/userService'
import type { CreateUserResult }             from '@/services/userService'
import type { Profile, UserRole }            from '@/types/database.types'

const ROLE_CHIP_COLOR: Record<UserRole, 'error' | 'warning' | 'default'> = {
  admin:   'error',
  manager: 'warning',
  teller:  'default',
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin:   'Admin',
  manager: 'Manager',
  teller:  'Teller',
}

interface CreatedCredentials extends CreateUserResult {
  email:     string
  full_name: string
}

export function UserTable() {
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState<UserRole | ''>('')
  const [showInactive, setShowInactive] = useState(false)
  const [dialogOpen,   setDialogOpen]   = useState(false)
  const [editing,      setEditing]      = useState<Profile | undefined>()
  const [credentials,  setCredentials]  = useState<CreatedCredentials | null>(null)
  const [toggleTarget, setToggleTarget] = useState<UserWithBranch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserWithBranch | null>(null)

  const { user: currentUser } = useAuth()
  const { data: users = [], isLoading } = useUsers({
    search,
    role:         roleFilter || undefined,
    showInactive,
  })

  const toggleActive = useToggleUserActive()
  const deleteUser   = useDeleteUser()

  const columns: GridColDef<UserWithBranch>[] = useMemo(() => [
    {
      field: 'full_name',
      headerName: 'Name',
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row }: GridRenderCellParams<UserWithBranch>) => (
        <Box py={0.5}>
          <Typography variant="body2" fontWeight={600}>{row.full_name}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {row.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 110,
      renderCell: ({ value }: GridRenderCellParams) => (
        <Chip
          label={ROLE_LABELS[value as UserRole] ?? value}
          size="small"
          color={ROLE_CHIP_COLOR[value as UserRole] ?? 'default'}
          variant="outlined"
          sx={{ borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'branch_id',
      headerName: 'Branch',
      flex: 1,
      minWidth: 140,
      renderCell: ({ row }: GridRenderCellParams<UserWithBranch>) => (
        <Typography variant="body2" color={row.branches?.name ? 'text.primary' : 'text.disabled'}>
          {row.branches?.name ?? '—'}
        </Typography>
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      renderCell: ({ row }: GridRenderCellParams<UserWithBranch>) => (
        <Chip
          label={row.is_active ? 'Active' : 'Inactive'}
          size="small"
          color={row.is_active ? 'success' : 'default'}
          variant={row.is_active ? 'filled' : 'outlined'}
          sx={{ borderRadius: '6px', fontSize: '0.7rem' }}
        />
      ),
    },
    {
      field: 'last_login_at',
      headerName: 'Last login',
      width: 160,
      renderCell: ({ value }: GridRenderCellParams) => (
        <Typography variant="body2" color={value ? 'text.primary' : 'text.disabled'}>
          {value ? formatDateTime(value as string) : 'Never'}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      valueFormatter: (v: string) => formatDate(v),
    },
    {
      field: 'actions',
      headerName: '',
      width: 120,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<UserWithBranch>) => {
        const isSelf = row.id === currentUser?.id
        return (
          <Box display="flex" gap={0.25}>
            <Tooltip title="Edit" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditing(row)
                  setDialogOpen(true)
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={row.is_active ? 'Deactivate' : 'Activate'} arrow>
              <IconButton
                size="small"
                color={row.is_active ? 'warning' : 'success'}
                onClick={(e) => { e.stopPropagation(); setToggleTarget(row) }}
              >
                {row.is_active
                  ? <ToggleOffIcon fontSize="small" />
                  : <ToggleOnIcon  fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip
              title={isSelf ? 'You cannot remove your own account' : 'Remove account'}
              arrow
            >
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={isSelf}
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )
      },
    },
  ], [currentUser?.id])

  const handleCreated = (result: CreateUserResult & { email: string; full_name: string }) => {
    setCredentials(result)
  }

  return (
    <Box>
      {/* ── Toolbar ─────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        mb={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        flexWrap="wrap"
      >
        <SearchTextField
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200, maxWidth: { sm: 340 } }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
          >
            <MenuItem value="">All roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="teller">Teller</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2">Show inactive</Typography>}
        />

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => { setEditing(undefined); setDialogOpen(true) }}
          sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Add user
        </Button>
      </Stack>

      {/* ── Data grid ───────────────────────────────────── */}
      <AppDataGrid
        rows={users}
        columns={columns}
        loading={isLoading}
      />

      {/* ── Create / edit dialog ─────────────────────────── */}
      <UserForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        existing={editing}
        onCreated={handleCreated}
      />

      {/* ── Remove account confirmation modal ──────────── */}
      <DeleteUserModal
        open={!!deleteTarget}
        user={deleteTarget}
        isPending={deleteUser.isPending}
        onConfirm={(confirmedEmail) => {
          if (!deleteTarget) return
          deleteUser.mutate(
            { id: deleteTarget.id, email: confirmedEmail },
            { onSettled: () => setDeleteTarget(null) },
          )
        }}
        onClose={() => setDeleteTarget(null)}
      />

      {/* ── Toggle active confirmation modal ─────────────── */}
      <ToggleUserModal
        open={!!toggleTarget}
        user={toggleTarget}
        isPending={toggleActive.isPending}
        onConfirm={() => {
          if (!toggleTarget) return
          toggleActive.mutate(
            { id: toggleTarget.id, isActive: !toggleTarget.is_active },
            { onSettled: () => setToggleTarget(null) },
          )
        }}
        onClose={() => setToggleTarget(null)}
      />

      {/* ── Credentials dialog (post-creation) ──────────── */}
      {credentials && (
        <CredentialsDialog
          open
          email={credentials.email}
          fullName={credentials.full_name}
          tempPassword={credentials.temp_password}
          onClose={() => setCredentials(null)}
        />
      )}
    </Box>
  )
}
