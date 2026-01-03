import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ============ PROFILES ============

export const getUserProfile = async (userId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export const updateUserProfile = async (userId, updates) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============ BOOKINGS ============

export const createBooking = async (bookingData) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single()

  if (error) throw error

  // Decrement user credits
  await supabase.rpc('decrement_credits', { user_id: bookingData.user_id })

  return data
}

export const getUserBookings = async (userId) => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (error) throw error
  return data || []
}

export const cancelBooking = async (bookingId, userId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============ COMMUNITY POSTS ============

export const getPosts = async (limit = 20, offset = 0) => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data || []
}

export const createPost = async (postData) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('community_posts')
    .insert(postData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deletePost = async (postId, userId) => {
  if (!isSupabaseConfigured()) return null

  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId)

  if (error) throw error
  return true
}

// ============ POST LIKES ============

export const likePost = async (postId, userId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export const unlikePost = async (postId, userId) => {
  if (!isSupabaseConfigured()) return null

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)

  if (error) throw error
  return true
}

export const getUserLikedPosts = async (userId) => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)

  if (error) throw error
  return data?.map(like => like.post_id) || []
}

export const checkIfLiked = async (postId, userId) => {
  if (!isSupabaseConfigured()) return false

  const { data, error } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return !!data
}

// ============ NOTIFICATIONS ============

export const getNotifications = async (userId) => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

export const markNotificationRead = async (notificationId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const markAllNotificationsRead = async (userId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
    .select()

  if (error) throw error
  return data
}

export const createNotification = async (userId, text, type) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, text, type })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============ ENROLLED COURSES ============

export const getEnrolledCourses = async (userId) => {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('enrolled_courses')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data || []
}

export const enrollInCourse = async (userId, courseId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('enrolled_courses')
    .insert({ user_id: userId, course_id: courseId })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCourseProgress = async (userId, courseId, progress) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('enrolled_courses')
    .update({ progress })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============ USER SETTINGS ============

export const getUserSettings = async (userId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const updateUserSettings = async (userId, settings) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('user_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============ CHECK-INS ============

export const checkIn = async (userId, studioId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('check_ins')
    .insert({ user_id: userId, studio_id: studioId })
    .select()
    .single()

  if (error) throw error

  // Increment visit count
  await supabase.rpc('increment_visits', { user_id: userId })

  return data
}

export const checkOut = async (checkInId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('check_ins')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('id', checkInId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getActiveCheckIn = async (userId) => {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .is('checked_out_at', null)
    .order('checked_in_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// ============ REAL-TIME SUBSCRIPTIONS ============

export const subscribeToNotifications = (userId, callback) => {
  if (!isSupabaseConfigured()) return null

  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe()
}

export const subscribeToPosts = (callback) => {
  if (!isSupabaseConfigured()) return null

  return supabase
    .channel('community_posts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_posts',
      },
      callback
    )
    .subscribe()
}

export const unsubscribe = (channel) => {
  if (channel) {
    supabase.removeChannel(channel)
  }
}
