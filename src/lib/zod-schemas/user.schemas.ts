import { z } from 'zod'

export const createUserSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email:     z.string().email('Invalid email address').max(200),
  role:      z.enum(['admin', 'manager', 'teller'], { required_error: 'Role is required' }),
  branch_id: z.string().uuid('Branch is required'),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  role:      z.enum(['admin', 'manager', 'teller'], { required_error: 'Role is required' }),
  branch_id: z.string().uuid('Branch is required'),
})

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
