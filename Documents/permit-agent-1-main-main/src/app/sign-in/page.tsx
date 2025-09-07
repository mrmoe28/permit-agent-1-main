'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Building2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

function SignInFormContent({ selectedPlan }: { selectedPlan: string | null }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (showForgotPassword) {
        // Handle forgot password
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send reset email');
        }

        setError(`Password reset email sent to ${email}. Please check your inbox.`);
        setShowForgotPassword(false);
      } else if (isSignUp) {
        // Handle sign up
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Sign up failed');
        }

        // Auto sign in after successful sign up
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error('Account created but sign in failed. Please try signing in.');
        }

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // Handle sign in
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error('Invalid email or password');
        }

        // Redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">
            {showForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Sign In')}
          </CardTitle>
          <CardDescription>
            {showForgotPassword 
              ? 'Enter your email to receive a password reset link'
              : (isSignUp 
                ? 'Start your free account with 3 searches per month'
                : 'Access your projects and subscription'
              )
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedPlan === 'free' && !showForgotPassword && !isSignUp && (
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Free plan selected. Sign in to your account or{' '}
              <button
                onClick={() => setIsSignUp(true)}
                className="underline hover:no-underline"
              >
                create a new account
              </button>
              {' '}to start with 3 searches per month.
            </div>
          )}

          {selectedPlan === 'free' && isSignUp && (
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Free plan selected. Create your account to start with 3 searches per month.
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-4">
            {isSignUp && !showForgotPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="pl-9"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="pl-9"
                />
              </div>
            </div>
            
            {!showForgotPassword && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isSignUp && (
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters</p>
                )}
              </div>
            )}
            
            {error && (
              <p className={`text-sm ${error.includes('sent to') ? 'text-green-600' : 'text-red-600'}`}>{error}</p>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? (showForgotPassword ? 'Sending Reset Email…' : (isSignUp ? 'Creating Account…' : 'Signing In…'))
                : (showForgotPassword ? 'Send Reset Email' : (isSignUp ? 'Create Account' : 'Sign In'))
              }
            </Button>
          </form>

          {!showForgotPassword && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          )}
          
          <div className="text-center mt-4 text-sm text-gray-600">
            {showForgotPassword ? (
              <>
                Remember your password?{' '}
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError(null);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="text-blue-600 hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="text-blue-600 hover:underline"
                >
                  Create one
                </button>
                {' '}or{' '}
                <Link href="/pricing" className="text-blue-600 hover:underline">
                  view plans
                </Link>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-gray-500">By continuing, you agree to our Terms and Privacy Policy.</p>
        </CardFooter>
      </Card>
    </main>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const selectedPlan = searchParams?.get('plan') || null;
  
  return <SignInFormContent selectedPlan={selectedPlan} />;
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PermitAgent</h1>
                <p className="text-gray-600 text-sm">Find permit information for any address</p>
              </div>
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </header>

      <Suspense fallback={
        <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
          </Card>
        </main>
      }>
        <SignInForm />
      </Suspense>
    </div>
  );
}


