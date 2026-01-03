import React, { useState } from 'react';
import { X, Smartphone, Tablet, Monitor, Play, Mail, Lock, User } from 'lucide-react';
import { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } from '../services/auth';
import { isSupabaseConfigured } from '../lib/supabase';

const AuthModal = ({ onClose, onSuccess, onShowTutorial }) => {
  const [authMode, setAuthMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isConfigured = isSupabaseConfigured();

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      setError('Supabase not configured. Please add credentials.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!isConfigured) {
      setError('Supabase not configured. Please add credentials.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithApple();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!isConfigured) {
      setError('Supabase not configured. Please add credentials.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (authMode === 'signup') {
        const { user } = await signUpWithEmail(email, password, name);
        if (user) {
          onSuccess(user);
        }
      } else {
        const { user } = await signInWithEmail(email, password);
        if (user) {
          onSuccess(user);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative h-32 bg-gradient-to-r from-amber-600 to-amber-400">
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-2xl font-bold text-white font-serif">
              <span className="text-amber-900">AI</span> Studio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
          </h3>
          <p className="text-gray-600 text-center mb-6">
            {authMode === 'signup' ? 'Join 1,800+ creative members worldwide' : 'Sign in to continue your creative journey'}
          </p>

          {!isConfigured && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              Demo mode: Add Supabase credentials to enable real authentication.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Device Icons */}
          <div className="flex justify-center gap-6 mb-6 text-gray-400">
            <div className="flex flex-col items-center">
              <Smartphone className="w-6 h-6" />
              <span className="text-xs mt-1">iPhone</span>
            </div>
            <div className="flex flex-col items-center">
              <Tablet className="w-6 h-6" />
              <span className="text-xs mt-1">iPad</span>
            </div>
            <div className="flex flex-col items-center">
              <Smartphone className="w-6 h-6" />
              <span className="text-xs mt-1">Android</span>
            </div>
            <div className="flex flex-col items-center">
              <Monitor className="w-6 h-6" />
              <span className="text-xs mt-1">Desktop</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleAppleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Your name"
                    required={authMode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium bg-amber-500 text-white hover:bg-amber-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <p className="text-center text-sm text-gray-600 mt-6">
            {authMode === 'signup' ? (
              <>Already have an account? <button onClick={() => setAuthMode('login')} className="text-amber-600 font-medium">Sign in</button></>
            ) : (
              <>Don't have an account? <button onClick={() => setAuthMode('signup')} className="text-amber-600 font-medium">Sign up</button></>
            )}
          </p>

          <p className="text-center text-xs text-gray-400 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>

          <button
            onClick={onShowTutorial}
            className="w-full mt-4 py-2 text-center text-sm text-amber-600 font-medium flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Watch Tutorial First
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
