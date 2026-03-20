import { createClient } from './server'
import type { AuthUser } from './types'

/**
 * Get the current authenticated user with their metadata
 * Returns null if not authenticated or Supabase not configured
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient()

  if (!supabase) {
    return null
  }

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user as AuthUser
}

/**
 * Get the user role from user metadata
 */
export function getUserRole(user: AuthUser | null): 'parent' | 'therapist' | 'admin' | null {
  if (!user) return null
  return user.user_metadata?.role ?? 'parent'
}

/**
 * Check if the current user is a parent
 */
export function isParent(user: AuthUser | null): boolean {
  return getUserRole(user) === 'parent'
}

/**
 * Check if the current user is a therapist
 */
export function isTherapist(user: AuthUser | null): boolean {
  return getUserRole(user) === 'therapist'
}

/**
 * Check if the current user is an admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return getUserRole(user) === 'admin'
}

/**
 * Get the user's display name (first name or email prefix)
 */
export function getDisplayName(user: AuthUser | null): string {
  if (!user) return 'Guest'

  const { first_name, last_name } = user.user_metadata ?? {}
  if (first_name) {
    return last_name ? `${first_name} ${last_name}` : first_name
  }

  return user.email?.split('@')[0] ?? 'User'
}

/**
 * Protected routes that require authentication
 */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/analytics',
  '/history',
  '/team',
  '/wellness',
  '/admin',
] as const

/**
 * Routes only accessible to therapists/admins
 */
export const THERAPIST_ROUTES = [
  '/therapist',
] as const

/**
 * Routes only accessible to admins
 */
export const ADMIN_ROUTES = [
  '/admin',
] as const

/**
 * Check if a route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is therapist-only
 */
export function isTherapistRoute(pathname: string): boolean {
  return THERAPIST_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is admin-only
 */
export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route))
}
