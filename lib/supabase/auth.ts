"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, metadata?: { [key: string]: any }) {
  const supabase = createClient()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createClient()
  return supabase.auth.signOut()
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const supabase = createClient()
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  })
}

/**
 * Update password
 */
export async function updatePassword(password: string) {
  const supabase = createClient()
  return supabase.auth.updateUser({
    password,
  })
}

/**
 * Get the current session
 */
export async function getSession() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getSession()
  return { data: data.session, error }
}

/**
 * Get the current user
 */
export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
} 