import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Settings, AppSettings } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Cpu, Globe, Users, CheckCircle2, Info } from 'lucide-react';

export function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [appSettings, setAppSettings] = useState<Partial<AppSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [s, a] = await Promise.all([
        supabase.from('settings').select('*').eq('id', 1).single(),
        supabase.from('app_settings').select('*').eq('id', 1).single(),
      ]);
      if (s.data) setSettings(s.data);
      if (a.data) setAppSettings(a.data);
      setLoading(false);
    };
    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const [r1, r2] = await Promise.all([
      supabase.from('settings').upsert({ id: 1, ...settings, updated_at: new Date().toISOString() }),
      supabase.from('app_settings').upsert({ id: 1, ...appSettings, updated_at: new Date().toISOString() }),
    ]);
    setSaving(false);
    const err = r1.error || r2.error;
    if (err) {
      toast({ variant: 'destructive', title: 'Error saving settings', description: err.message });
    } else {
      toast({ title: 'Settings saved ✓', description: 'All platform settings updated.' });
    }
  };

  const set = (key: keyof Settings, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));
  const setApp = (key: keyof AppSettings, value: unknown) =>
    setAppSettings(prev => ({ ...prev, [key]: value }));

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-36 bg-white/5 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
        <p className="text-white/40 mt-1">Configure email, AI assistant, and global defaults</p>
      </div>

      {/* Email sending */}
      <Card className="bg-white/5 border-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" /> Email Sending
          </CardTitle>
          <CardDescription className="text-white/40">
            Brevo API key for sending outreach emails. Users can also set their own in account settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Brevo API Key (platform-wide default)</Label>
            <Input type="password" value={settings.brevo_api_key || ''} onChange={e => set('brevo_api_key', e.target.value)}
              placeholder="xkeysib-..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            <p className="text-xs text-white/30 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" /> Get from brevo.com → Settings → API Keys
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Platform Support Email</Label>
            <Input type="email" value={(settings as Record<string,unknown>).support_email as string || ''}
              onChange={e => set('support_email' as keyof Settings, e.target.value)}
              placeholder="support@yourcompany.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
        </CardContent>
      </Card>

      {/* AI Email Writer */}
      <Card className="bg-white/5 border-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" /> AI Email Writer
          </CardTitle>
          <CardDescription className="text-white/40">
            Groq API key for generating cold-outreach emails. Free at console.groq.com.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Groq API Key (platform-wide default)</Label>
            <Input type="password" value={settings.groq_api_key || ''} onChange={e => set('groq_api_key', e.target.value)}
              placeholder="gsk_..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            <p className="text-xs text-white/30 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" /> Users without their own key will use this. Free at console.groq.com
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Platform Identity */}
      <Card className="bg-white/5 border-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-400" /> Platform Identity
          </CardTitle>
          <CardDescription className="text-white/40">Brand name and signature shown in emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Platform Brand Name</Label>
            <Input value={settings.brand_name || ''} onChange={e => set('brand_name', e.target.value)}
              placeholder="Darapet Lead Engine" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Signature Name (shows in outgoing emails)</Label>
            <Input value={settings.signature_name || ''} onChange={e => set('signature_name', e.target.value)}
              placeholder="The Darapet Team" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Website URL</Label>
            <Input value={settings.website_url || ''} onChange={e => set('website_url', e.target.value)}
              placeholder="https://darapet.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
        </CardContent>
      </Card>

      {/* User Defaults */}
      <Card className="bg-white/5 border-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> User Defaults
          </CardTitle>
          <CardDescription className="text-white/40">
            Limits applied to new users on registration. Overridable per user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Default Daily Email Limit</Label>
            <Input type="number" min={1} max={10000} value={appSettings.default_daily_email_limit ?? 50}
              onChange={e => setApp('default_daily_email_limit', Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white w-40" />
            <p className="text-xs text-white/30">Emails a new user can send per day.</p>
          </div>
        </CardContent>
      </Card>

      {/* Scraping info */}
      <Card className="bg-white/5 border-green-500/20">
        <CardContent className="p-5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium text-sm">Lead Scraping: No API key needed</p>
            <p className="text-white/40 text-xs mt-1">
              Scraping uses Bing search via a free CORS proxy — no Google API key required. Users can scrape immediately after signing up.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2 px-8">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
