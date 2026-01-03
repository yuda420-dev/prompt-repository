import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { onAuthStateChange, signOut } from '../services/auth';
import { getUserProfile, getUserSettings, getNotifications, getUserBookings, getEnrolledCourses, getUserLikedPosts } from '../services/database';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([0]);
  const [likedPosts, setLikedPosts] = useState({});

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Demo mode - check localStorage
      const savedUser = localStorage.getItem('aiStudioUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setProfile(parsed);
        setIsLoggedIn(true);
      }
      setLoading(false);
      return;
    }

    // Real Supabase auth
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);

        // Load user data
        try {
          const [profileData, settingsData, notifs, bookings, courses, likes] = await Promise.all([
            getUserProfile(session.user.id),
            getUserSettings(session.user.id),
            getNotifications(session.user.id),
            getUserBookings(session.user.id),
            getEnrolledCourses(session.user.id),
            getUserLikedPosts(session.user.id)
          ]);

          setProfile(profileData);
          setSettings(settingsData);
          setNotifications(notifs || []);
          setMyBookings(bookings || []);
          setEnrolledCourses(courses?.map(c => c.course_id) || [0]);

          // Convert likes array to object
          const likesObj = {};
          likes?.forEach(postId => { likesObj[postId] = true; });
          setLikedPosts(likesObj);
        } catch (err) {
          console.error('Error loading user data:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
        setSettings(null);
        setIsLoggedIn(false);
        setNotifications([]);
        setMyBookings([]);
        setEnrolledCourses([0]);
        setLikedPosts({});
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await signOut();
    } else {
      localStorage.removeItem('aiStudioUser');
      setUser(null);
      setProfile(null);
      setIsLoggedIn(false);
    }
  };

  // Demo mode login
  const demoLogin = (provider) => {
    const newUser = {
      id: Date.now().toString(),
      name: 'Creative User',
      email: provider === 'google' ? 'user@gmail.com' : 'user@icloud.com',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      provider,
      tier: 'Premium',
      credits: 3,
      total_visits: 0,
      projects_completed: 0
    };
    setUser(newUser);
    setProfile(newUser);
    setIsLoggedIn(true);
    localStorage.setItem('aiStudioUser', JSON.stringify(newUser));
    localStorage.setItem('hasSeenTutorial', 'true');
    return newUser;
  };

  return {
    isLoggedIn,
    user,
    profile,
    settings,
    loading,
    notifications,
    setNotifications,
    myBookings,
    setMyBookings,
    enrolledCourses,
    setEnrolledCourses,
    likedPosts,
    setLikedPosts,
    handleLogout,
    demoLogin,
    setProfile,
  };
};
