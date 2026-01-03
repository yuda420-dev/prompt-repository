import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Sign in with Google OAuth
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Please add your credentials.')
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) throw error
  return data
}

// Sign in with Apple OAuth
export const signInWithApple = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Please add your credentials.')
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  })

  if (error) throw error
  return data
}

// Sign in with Email/Password
export const signInWithEmail = async (email, password) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Please add your credentials.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

// Sign up with Email/Password
export const signUpWithEmail = async (email, password, name) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Please add your credentials.')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  })

  if (error) throw error
  return data
}

// Sign out
export const signOut = async () => {
  if (!isSupabaseConfigured()) {
    return
  }

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current session
export const getCurrentSession = async () => {
  if (!isSupabaseConfigured()) {
    return null
  }

  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// Get current user
export const getCurrentUser = async () => {
  if (!isSupabaseConfigured()) {
    return null
  }

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Listen for auth state changes
export const onAuthStateChange = (callback) => {
  if (!isSupabaseConfigured()) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

// Password reset
export const resetPassword = async (email) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Please add your credentials.')
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) throw error
  return data
}

// Update password
export const updatePassword = async (newPassword) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Please add your credentials.')
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
  return data
}
