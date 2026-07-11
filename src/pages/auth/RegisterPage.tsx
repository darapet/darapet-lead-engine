import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, CheckCircle2, ArrowRight, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const APP_URL = 'https://darapet.github.io/Darapet-Technology/';

type Step = 'email' | 'otp' | 'password';

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const [step, setStep]                     = useState<Step>('email');
  const [email, setEmail]                   = useState('');
  const [otp, setOtp]                       = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [loading, setLoading]               = useState(false);
  const [resending, setResending]           = useState(false);
  const [error, setError]                   = useState('');
  const [linkClicked, setLinkClicked]       = useState(false);

  // ─── Auto-advance when user clicks the magic link in their email ───────────
  // Supabase sends a clickable link by default. When the user clicks it they
  // land back on this page with an access_token in the URL hash, which the
  // Supabase client (detectSessionInUrl: true) exchanges for a live session.
  // onAuthStateChange fires → we move to the password step automatically.
  useEffect(() => {
    if (step !== 'otp') return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          setLinkClicked(true);
          // Small delay so the "verified!" flash shows before transition
          setTimeout(() => setStep('password'), 600);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [step]);

  // ─── Step 1: send OTP / magic link ─────────────────────────────────────────
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: APP_URL,   // magic link lands on the correct URL
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep('otp');
  };

  // ─── Resend ─────────────────────────────────────────────────────────────────
  const resendOtp = async () => {
    setResending(true);
    setError('');
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: APP_URL },
    });
    setResending(false);
  };

  // ─── Step 2: verify the 6-digit code (only needed if email shows one) ──────
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep('password');
  };

  // ─── Step 3: set password ───────────────────────────────────────────────────
  const setAccountPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setLocation('/onboarding');
  };

  const steps = [
    { key: 'email',    label: 'Email',    icon: Mail          },
    { key: 'otp',      label: 'Verify',   icon: CheckCircle2  },
    { key: 'password', label: 'Password', icon: Lock          },
  ];
  const currentStepIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/30">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-blue-200 mt-1 text-sm">Join Darapet Lead Engine</p>
        </div>

        {/* Step bar */}
        <div className="flex items-center justify-center mb-8 gap-0">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all
                ${i <= currentStepIdx ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/40'}`}>
                {i < currentStepIdx ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:block ${i <= currentStepIdx ? 'text-blue-200' : 'text-white/40'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-3 ${i < currentStepIdx ? 'bg-blue-600' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Enter your email</CardTitle>
                  <CardDescription className="text-blue-200">
                    We'll send a verification email to your inbox.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={sendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-blue-100">Email address</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com" required autoFocus
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400" />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      {loading ? 'Sending…' : 'Continue'}
                    </Button>
                    <p className="text-center text-sm text-blue-200">
                      Already have an account?{' '}
                      <a href="/login" className="text-blue-400 hover:underline"
                        onClick={e => { e.preventDefault(); setLocation('/login'); }}>Sign in</a>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 2: OTP / magic link ── */}
          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    {linkClicked
                      ? <><CheckCircle2 className="w-5 h-5 text-green-400" /> Verified!</>
                      : <><Mail className="w-5 h-5 text-blue-400" /> Check your email</>
                    }
                  </CardTitle>
                  <CardDescription className="text-blue-200 space-y-1">
                    <span>We sent an email to <strong className="text-white">{email}</strong>.</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* Primary: click the link */}
                  <div className="rounded-xl bg-blue-600/10 border border-blue-500/30 p-4 space-y-2">
                    <p className="text-white font-semibold text-sm flex items-center gap-2">
                      <span className="text-blue-400 text-lg">①</span> Click the link in the email
                    </p>
                    <p className="text-blue-200 text-xs leading-relaxed">
                      Open the email from Supabase and click <strong>"Confirm your mail"</strong> or <strong>"Log In"</strong>.
                      This page will automatically advance to the next step.
                    </p>
                    {!linkClicked && (
                      <div className="flex items-center gap-2 pt-1">
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                        <span className="text-blue-300 text-xs">Waiting for you to click the link…</span>
                      </div>
                    )}
                    {linkClicked && (
                      <div className="flex items-center gap-2 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-300 text-xs">Link verified! Moving to next step…</span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/30 text-xs">OR</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Secondary: enter OTP code (if email template shows {{ .Token }}) */}
                  <div className="space-y-1">
                    <p className="text-white font-semibold text-sm flex items-center gap-2">
                      <span className="text-blue-400 text-lg">②</span> Enter the 6-digit code
                    </p>
                    <p className="text-white/40 text-xs mb-3">
                      If the email shows a numeric code, type it here instead.
                    </p>
                    <form onSubmit={verifyOtp} className="space-y-3">
                      <Input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                        value={otp} onChange={e => setOtp(e.target.value)}
                        placeholder="e.g. 123456"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-blue-400 tracking-widest text-center text-lg" />
                      {error && <p className="text-red-400 text-sm">{error}</p>}
                      <Button type="submit" disabled={loading || otp.length < 6} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {loading ? 'Verifying…' : 'Verify Code'}
                      </Button>
                    </form>
                  </div>

                  {/* Resend */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <p className="text-white/40 text-xs">Didn't receive the email?</p>
                    <Button type="button" variant="ghost" size="sm" onClick={resendOtp} disabled={resending}
                      className="text-blue-400 hover:text-blue-300 text-xs gap-1">
                      {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Resend
                    </Button>
                  </div>

                  <p className="text-white/30 text-xs text-center">
                    Wrong email?{' '}
                    <button onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                      className="text-blue-400 hover:underline">Go back</button>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 3: Set password ── */}
          {step === 'password' && (
            <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" /> Email verified!
                  </CardTitle>
                  <CardDescription className="text-blue-200">Set a password for your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={setAccountPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-blue-100">Password</Label>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'}
                          value={password} onChange={e => setPassword(e.target.value)}
                          placeholder="Minimum 8 characters" required
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 pr-10" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-blue-100">Confirm password</Label>
                      <Input type={showPassword ? 'text' : 'password'}
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password" required
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400" />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      {loading ? 'Creating account…' : 'Create Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
