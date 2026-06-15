import { supabase } from '@/lib/supabase'
import type { Branch, Profile, UserRole } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface UserWithBranch extends Profile {
  branches: Pick<Branch, 'name'> | null
}

export interface UserFilters {
  search?:       string
  role?:         UserRole | ''
  showInactive?: boolean
}

export interface CreateUserPayload {
  full_name: string
  email:     string
  role:      UserRole
  branch_id: string
}

export interface CreateUserResult {
  success:       boolean
  user_id:       string
  temp_password: string
}

export const userService = {

  async getAll(filters: UserFilters = {}): Promise<UserWithBranch[]> {
    let query = db
      .from('profiles')
      .select('*, branches(name)')
      .is('deleted_at', null)
      .order('full_name')

    if (!filters.showInactive) query = query.eq('is_active', true)
    if (filters.role)          query = query.eq('role', filters.role)

    const { data, error } = await query
    if (error) throw error

    if (filters.search) {
      const q = filters.search.toLowerCase()
      return (data as UserWithBranch[]).filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
    }
    return data as UserWithBranch[]
  },

  async update(
    id: string,
    payload: Partial<Pick<Profile, 'full_name' | 'role' | 'branch_id'>>,
  ): Promise<Profile> {
    const { data, error } = await db
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await db
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) throw error
  },

  async deleteUser(userId: string, email: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId, email },
    })
    if (error) throw new Error(error.message)
    if (!(data as { success?: boolean })?.success) {
      throw new Error((data as { error?: string })?.error ?? 'Failed to remove account')
    }
  },

  async createUser(payload: CreateUserPayload): Promise<CreateUserResult> {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: payload,
    })
    if (error) throw new Error(error.message)
    if (!(data as CreateUserResult)?.success) {
      throw new Error((data as { error?: string })?.error ?? 'Failed to create user')
    }
    return data as CreateUserResult
  },

  async getBranches(): Promise<Pick<Branch, 'id' | 'name'>[]> {
    const { data, error } = await db
      .from('branches')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return data as Pick<Branch, 'id' | 'name'>[]
  },
}
