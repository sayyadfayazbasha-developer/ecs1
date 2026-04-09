import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, Loader2, UserPlus, KeyRound, ShieldCheck, User, Key, Phone, Mail, UserCheck } from 'lucide-react';
import { z } from 'zod';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset-password';
type PortalType = 'user' | 'admin';
type AuthMethod = 'email' | 'phone';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().min(10, 'Please enter a valid phone number');

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userRole, signIn, signUp, signUpWithPhone, resetPassword, loading } = useAuth();

  const [portal, setPortal] = useState<PortalType>('user');
  const [mode, setMode] = useState<AuthMode>('login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Emergency contact fields
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
  const [errors, setErrors] = useState<{ 
    email?: string; 
    phone?: string;
    password?: string; 
    confirmPassword?: string; 
    secretKey?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    newPassword?: string;
  }>({});

  // Redirect authenticated users based on role
  useEffect(() => {
    if (user && !loading && userRole) {
      if (userRole === 'admin') {
        navigate('/admin-portal');
      } else {
        navigate('/user-portal');
      }
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    const portalParam = searchParams.get('portal');
    const modeParam = searchParams.get('mode');
    
    if (portalParam === 'admin') setPortal('admin');
    else if (portalParam === 'user') setPortal('user');
    
    if (modeParam === 'register') setMode('register');
    else if (modeParam === 'forgot') setMode('forgot');
    else setMode('login');
  }, [searchParams]);

  // Listen for password recovery event from reset link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (mode === 'reset-password') {
      if (!newPassword || newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      if (newPassword !== confirmNewPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (mode === 'forgot') {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (authMethod === 'email') {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
      }
    } else {
      const phoneResult = phoneSchema.safeParse(phone);
      if (!phoneResult.success) {
        newErrors.phone = phoneResult.error.errors[0].message;
      }
    }

    if (mode === 'login' || mode === 'register') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (mode === 'register' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate secret key for admin registration
    if (portal === 'admin' && mode === 'register' && !secretKey.trim()) {
      newErrors.secretKey = 'Admin secret key is required';
    }

    // Validate emergency contact for user registration
    if (portal === 'user' && mode === 'register') {
      if (!contactName.trim()) {
        newErrors.contactName = 'Emergency contact name is required';
      }
      // Phone is optional, but validate format if provided
      if (contactPhone.trim()) {
        const phoneResult = phoneSchema.safeParse(contactPhone);
        if (!phoneResult.success) {
          newErrors.contactPhone = phoneResult.error.errors[0].message;
        }
      }
      if (contactEmail.trim()) {
        const contactEmailResult = emailSchema.safeParse(contactEmail);
        if (!contactEmailResult.success) {
          newErrors.contactEmail = contactEmailResult.error.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('promote-to-admin', {
        body: { user_id: userId, secret_key: secretKey }
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error promoting to admin:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'reset-password') {
        // Update password using the session from the reset link
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Password reset successfully! You can now login.');
          setMode('login');
          setNewPassword('');
          setConfirmNewPassword('');
        }
      } else if (mode === 'login') {
        const identifier = authMethod === 'email' ? email : phone;
        const { error } = await signIn(identifier, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid credentials');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please verify your email address');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
        }
      } else if (mode === 'register') {
        let error: Error | null = null;
        
        if (authMethod === 'phone') {
          const result = await signUpWithPhone(phone, password, fullName);
          error = result.error;
        } else {
          const result = await signUp(email, password, fullName, phone || undefined);
          error = result.error;
        }
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This account is already registered. Please login instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          // For admin registration, promote to admin
          if (portal === 'admin') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: { user: newUser } } = await supabase.auth.getUser();
            
            if (newUser) {
              const result = await promoteToAdmin(newUser.id);
              if (result.success) {
                toast.success('Admin account created successfully!');
              } else {
                toast.error(result.error || 'Failed to assign admin role. Invalid secret key.');
                await supabase.auth.signOut();
                return;
              }
            }
          } else {
            // For user registration, add emergency contact
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: { user: newUser } } = await supabase.auth.getUser();
            
            if (newUser && contactName.trim() && contactPhone.trim()) {
              const { error: contactError } = await supabase
                .from('emergency_contacts')
                .insert({
                  user_id: newUser.id,
                  name: contactName.trim(),
                  phone: contactPhone.trim(),
                  email: contactEmail.trim() || null,
                  is_primary: true
                });
              
              if (contactError) {
                console.error('Error saving emergency contact:', contactError);
                toast.warning('Account created but failed to save emergency contact. You can add it later.');
              } else {
                toast.success('Account created with emergency contact!');
              }
            } else {
              toast.success('Account created! You can now login.');
            }
          }
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Password reset link sent to your email! Check your inbox.');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPortalContent = () => {
    if (portal === 'admin') {
      return {
        icon: mode === 'register' ? <UserPlus className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />,
        title: mode === 'register' ? 'Register as Admin' : mode === 'forgot' ? 'Reset Password' : mode === 'reset-password' ? 'Set New Password' : 'Admin Portal',
        description: mode === 'register' 
          ? 'Create a new administrator account with secret key' 
          : mode === 'forgot' 
          ? 'Enter your email to receive a reset link'
          : mode === 'reset-password'
          ? 'Enter your new password'
          : 'Sign in with your administrator credentials',
        color: 'text-accent',
        bgColor: 'bg-accent/10'
      };
    }
    return {
      icon: mode === 'register' ? <UserPlus className="h-6 w-6" /> : mode === 'forgot' || mode === 'reset-password' ? <KeyRound className="h-6 w-6" /> : <User className="h-6 w-6" />,
      title: mode === 'register' ? 'Create User Account' : mode === 'forgot' ? 'Reset Password' : mode === 'reset-password' ? 'Set New Password' : 'User Portal',
      description: mode === 'register' 
        ? 'Register with email or phone number' 
        : mode === 'forgot' 
        ? 'Enter your email to receive a reset link'
        : mode === 'reset-password'
        ? 'Enter your new password'
        : 'Sign in to access your emergency call dashboard',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    };
  };

  const content = getPortalContent();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Portal Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={portal === 'user' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => {
              setPortal('user');
              setMode('login');
              setSecretKey('');
            }}
          >
            <User className="h-4 w-4 mr-2" />
            User Portal
          </Button>
          <Button
            variant={portal === 'admin' ? 'secondary' : 'outline'}
            className="flex-1"
            onClick={() => {
              setPortal('admin');
              setMode('login');
            }}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Admin Portal
          </Button>
        </div>

        <Card className="glass border-border/40">
          <CardHeader className="text-center space-y-4">
            <div className={`mx-auto w-12 h-12 rounded-xl ${content.bgColor} flex items-center justify-center ${content.color}`}>
              {content.icon}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{content.title}</CardTitle>
              <CardDescription className="mt-2">{content.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {mode === 'reset-password' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <PasswordInput
                    id="newPassword"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-background/50"
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <PasswordInput
                    id="confirmNewPassword"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="bg-background/50"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
                  ) : (
                    'Update Password'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to login
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Auth Method Toggle for Login/Register */}
                {(mode === 'login' || mode === 'register') && (
                  <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as AuthMethod)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </TabsTrigger>
                      <TabsTrigger value="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                {mode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                )}

                {/* Email Field */}
                {(authMethod === 'email' || mode === 'forgot') && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({ ...errors, email: undefined });
                      }}
                      className={`bg-background/50 ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                )}

                {/* Phone Field */}
                {mode !== 'forgot' && authMethod === 'phone' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setErrors({ ...errors, phone: undefined });
                      }}
                      className={`bg-background/50 ${errors.phone ? 'border-destructive' : ''}`}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput
                      id="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors({ ...errors, password: undefined });
                      }}
                      className={`bg-background/50 ${errors.password ? 'border-destructive' : ''}`}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                )}

                {mode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <PasswordInput
                      id="confirmPassword"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors({ ...errors, confirmPassword: undefined });
                      }}
                      className={`bg-background/50 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {/* Emergency Contact Fields for User Registration */}
                {portal === 'user' && mode === 'register' && (
                  <div className="space-y-4 border-t border-border/40 pt-4 mt-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <UserCheck className="h-4 w-4" />
                      Emergency Contact (Required)
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        type="text"
                        placeholder="Emergency contact's name"
                        value={contactName}
                        onChange={(e) => {
                          setContactName(e.target.value);
                          setErrors({ ...errors, contactName: undefined });
                        }}
                        className={`bg-background/50 ${errors.contactName ? 'border-destructive' : ''}`}
                      />
                      {errors.contactName && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.contactName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        Contact Phone
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="+1234567890"
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value);
                          setErrors({ ...errors, contactPhone: undefined });
                        }}
                        className={`bg-background/50 ${errors.contactPhone ? 'border-destructive' : ''}`}
                      />
                      {errors.contactPhone && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.contactPhone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail" className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        Contact Email (Optional)
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="contact@example.com"
                        value={contactEmail}
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          setErrors({ ...errors, contactEmail: undefined });
                        }}
                        className={`bg-background/50 ${errors.contactEmail ? 'border-destructive' : ''}`}
                      />
                      {errors.contactEmail && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.contactEmail}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Secret Key Field */}
                {portal === 'admin' && mode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="secretKey" className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-accent" />
                      Admin Secret Key
                    </Label>
                    <PasswordInput
                      id="secretKey"
                      placeholder="Enter admin secret key"
                      value={secretKey}
                      onChange={(e) => {
                        setSecretKey(e.target.value);
                        setErrors({ ...errors, secretKey: undefined });
                      }}
                      className={`bg-background/50 ${errors.secretKey ? 'border-destructive' : ''}`}
                    />
                    {errors.secretKey && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.secretKey}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Contact your system administrator for the secret key
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  variant={portal === 'admin' ? 'secondary' : 'default'}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {mode === 'forgot' ? 'Sending...' : mode === 'register' ? 'Creating...' : 'Signing in...'}
                    </>
                  ) : (
                    <>
                      {mode === 'forgot' ? 'Send Reset Link' : mode === 'register' ? 'Create Account' : 'Sign In'}
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 space-y-4">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot your password?
                  </button>
                  <div className="border-t border-border/40 pt-4">
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-sm text-primary hover:underline"
                    >
                      Don't have an account? Register
                    </button>
                  </div>
                </>
              )}

              {mode === 'register' && (
                <div className="border-t border-border/40 pt-4">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-primary hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              )}

              {mode === 'forgot' && (
                <div className="border-t border-border/40 pt-4">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-primary hover:underline"
                  >
                    Back to login
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
