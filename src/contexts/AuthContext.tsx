import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getPhoneLoginEmailCandidates, normalizePhone } from '@/lib/phone';

type UserRole = 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ error: Error | null }>;
  signUpWithPhone: (phone: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (emailOrPhone: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  sendOTP: (type: 'email' | 'phone', destination: string) => Promise<{ error: Error | null; otpToken?: string }>;
  verifyOTPAndResetPassword: (otpToken: string, otp: string, destination: string, newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return 'user';
      }

      return (data?.role as UserRole | undefined) ?? 'user';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }
  };

  const ensureUserProfile = async (authUser: User) => {
    try {
      const email = authUser.email ?? `${authUser.id}@phone.local`;
      const fullName = typeof authUser.user_metadata?.full_name === 'string'
        ? authUser.user_metadata.full_name
        : null;
      const phone = normalizePhone(
        typeof authUser.user_metadata?.phone === 'string'
          ? authUser.user_metadata.phone
          : authUser.phone
      );

      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, phone')
        .eq('user_id', authUser.id)
        .limit(1)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking user profile:', profileError);
        return;
      }

      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: authUser.id,
            email,
            full_name: fullName,
            phone,
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        }

        return;
      }

      const nextEmail = existingProfile.email || email;
      const nextFullName = existingProfile.full_name || fullName;
      const nextPhone = existingProfile.phone || phone;
      const shouldUpdateProfile =
        nextEmail !== existingProfile.email ||
        nextFullName !== existingProfile.full_name ||
        nextPhone !== existingProfile.phone;

      if (!shouldUpdateProfile) {
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: nextEmail,
          full_name: nextFullName,
          phone: nextPhone,
        })
        .eq('user_id', authUser.id);

      if (updateError) {
        console.error('Error syncing user profile:', updateError);
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setLoading(true);
      setSession(nextSession);

      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      setUserRole(null);

      if (!nextUser) {
        setLoading(false);
        return;
      }

      await ensureUserProfile(nextUser);
      const nextRole = await fetchUserRole(nextUser.id);

      if (!isMounted) return;

      setUserRole(nextRole);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        void syncAuthState(nextSession);
      }
    );

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      void syncAuthState(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const normalizedPhone = normalizePhone(phone);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: normalizedPhone
        }
      }
    });

    if (!error && data?.session?.user) {
      await ensureUserProfile(data.session.user);
    }

    return { error: error as Error | null };
  };

  const signUpWithPhone = async (phone: string, password: string, fullName?: string) => {
    const normalizedPhone = normalizePhone(phone);
    const phoneDigits = normalizedPhone?.replace(/\D/g, '') ?? phone.replace(/[^0-9]/g, '');
    const tempEmail = `${phoneDigits}@phone.local`;
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email: tempEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: normalizedPhone
        }
      }
    });

    if (!error && data?.session?.user) {
      await ensureUserProfile(data.session.user);
    }

    return { error: error as Error | null };
  };

  const signIn = async (emailOrPhone: string, password: string) => {
    const identifier = emailOrPhone.trim();
    const normalizedEmail = identifier.toLowerCase();
    const isPhone = identifier.startsWith('+') || /^\d{10,}$/.test(identifier.replace(/[^0-9]/g, ''));

    const trySignIn = async (email: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return error as Error | null;
    };

    if (!isPhone) {
      const error = await trySignIn(normalizedEmail);
      return { error };
    }

    const phoneEmailCandidates = getPhoneLoginEmailCandidates(identifier);
    let lastError: Error | null = null;

    for (const candidateEmail of phoneEmailCandidates) {
      const error = await trySignIn(candidateEmail);
      if (!error) {
        return { error: null };
      }
      lastError = error;
    }

    // Final fallback in case user entered an email in the phone field.
    const fallbackError = await trySignIn(normalizedEmail);
    return { error: fallbackError ?? lastError };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    return { error: error as Error | null };
  };

  const sendOTP = async (type: 'email' | 'phone', destination: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { type, destination, purpose: 'reset_password' }
      });

      if (error) {
        return { error: error as Error };
      }

      if (data?.error) {
        return { error: new Error(data.error) };
      }

      return { error: null, otpToken: data?.otpToken };
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const verifyOTPAndResetPassword = async (otpToken: string, otp: string, destination: string, newPassword: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { otpToken, otp, destination, newPassword }
      });

      if (error) {
        return { error: error as Error };
      }

      if (data?.error) {
        return { error: new Error(data.error) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signUp,
    signUpWithPhone,
    signIn,
    signOut,
    resetPassword,
    sendOTP,
    verifyOTPAndResetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
