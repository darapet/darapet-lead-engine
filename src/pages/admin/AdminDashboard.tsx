import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Users, ShieldOff, AlertTriangle, Mail, Activity, TrendingUp, Database, Copy, CheckCircle2 } from 'lucide-react';
import type { AppUser } from '@/types/database';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  restrictedUsers: number;
  totalLeadBatches: number;
  totalEmailSends: number;
  recentActivity: Array<{ id: string; action: string | null; created_at: string | null; user_id: string | null }>;
}

const SQL_MIGRATION_URL =
  'https://raw.githubusercontent.com/darapet/darapet-lead-engine/main/supabase/migrations/20260710_schema_and_rls.sql';

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [users, batches, emails, activity] = await Promise.all([
        supabase.from('app_users').select('id, status'),
        supabase.from('lead_batches').select('id', { count: 'exact', head: true }),
        supabase.from('email_sends').select('id', { count: 'exact', head: true }),
        supabase.from('activity_logs').select('id, action, created_at, user_id').order('created_at', { ascending: false }).limit(10),
      ]);

      // Table doesn't exist → Supabase returns error code 42P01 or PGRST116
      if (users.error?.code === '42P01' || users.error?.message?.includes('does not exist')) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      const userList: Array<{ id: string; status: string | null }> =
        (users.data as Array<{ id: string; status: string | null }>) || [];

      setStats({
        totalUsers:        userList.length,
        activeUsers:       userList.filter(u => !u.status || u.status === 'active').length,
        suspendedUsers:    userList.filter(u => u.status === 'suspended').length,
        bannedUsers:       userList.filter(u => u.status === 'banned').length,
        restrictedUsers:   userList.filter(u => u.status === 'restricted').length,
        totalLeadBatches:  batches.count || 0,
        totalEmailSends:   emails.count  || 0,
        recentActivity:    activity.data || [],
      });
      setLoading(false);
    };
    load();
  }, []);

  const copySql = async () => {
    try {
      const sql = await fetch(SQL_MIGRATION_URL).then(r => r.text());
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      window.open(SQL_MIGRATION_URL, '_blank');
    }
  };

  // ── Database not set up yet ────────────────────────────────────────────────
  if (needsSetup) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/40 mt-1">Platform overview and controls</p>
        </div>

        <Card className="bg-amber-950/30 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2">
              <Database className="w-5 h-5" /> Database Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/70 text-sm leading-relaxed">
              The database tables for this app have not been created yet. You need to run the SQL migration
              once in your Supabase dashboard to set everything up.
            </p>

            <ol className="space-y-2 text-sm text-white/60 list-decimal list-inside">
              <li>Go to your <strong className="text-white">Supabase Dashboard</strong></li>
              <li>Click <strong className="text-white">SQL Editor</strong> in the left sidebar</li>
              <li>Click <strong className="text-white">+ New query</strong></li>
              <li>Paste the SQL below and click <strong className="text-white">Run</strong></li>
            </ol>

            <Button onClick={copySql} className="bg-amber-600 hover:bg-amber-500 gap-2">
              {copied
                ? <><CheckCircle2 className="w-4 h-4" /> Copied to clipboard!</>
                : <><Copy className="w-4 h-4" /> Copy SQL Migration</>
              }
            </Button>

            <p className="text-white/30 text-xs">
              Or view the file directly:{' '}
              <a href={SQL_MIGRATION_URL} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 underline break-all">{SQL_MIGRATION_URL}</a>
            </p>

            <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 space-y-1">
              <p className="font-semibold text-white/70">This migration creates:</p>
              <p>• All app tables (profiles, app_users, lead_batches, darapet_leads, email_sends, activity_logs, campaigns, settings, app_settings)</p>
              <p>• Row Level Security policies (admin sees everything, users see their own data)</p>
              <p>• Default settings rows</p>
            </div>

            <Button variant="ghost" size="sm" onClick={() => { setLoading(true); setNeedsSetup(false); window.location.reload(); }}
              className="text-white/40 hover:text-white mt-2">
              I've run the SQL — Reload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 bg-white/5 rounded-xl" />)}
      </div>
    </div>
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const STAT_CARDS = [
    { label: 'Total Users',    value: stats?.totalUsers,        icon: Users,        color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
    { label: 'Active',         value: stats?.activeUsers,       icon: TrendingUp,   color: 'text-green-400',  bg: 'bg-green-500/10'  },
    { label: 'Suspended',      value: stats?.suspendedUsers,    icon: AlertTriangle,color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Banned',         value: stats?.bannedUsers,       icon: ShieldOff,    color: 'text-red-400',    bg: 'bg-red-500/10'    },
    { label: 'Lead Batches',   value: stats?.totalLeadBatches,  icon: Activity,     color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Emails Sent',    value: stats?.totalEmailSends,   icon: Mail,         color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-white/40 mt-1">Platform overview and controls</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="bg-white/5 border-white/5 text-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold">{value ?? 0}</div>
                <div className="text-white/50 text-sm">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/admin/users">
          <a className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/8 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
            <Users className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-white font-medium text-sm">User Management</p>
              <p className="text-white/40 text-xs">{stats?.totalUsers} users</p>
            </div>
          </a>
        </Link>
        <Link href="/admin/activity">
          <a className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/8 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
            <Activity className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <p className="text-white font-medium text-sm">Activity Log</p>
              <p className="text-white/40 text-xs">Platform-wide actions</p>
            </div>
          </a>
        </Link>
        <Link href="/admin/settings">
          <a className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/8 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
            <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <p className="text-white font-medium text-sm">Platform Settings</p>
              <p className="text-white/40 text-xs">Brevo, Groq, limits</p>
            </div>
          </a>
        </Link>
      </div>

      {/* Recent activity */}
      {(stats?.recentActivity?.length ?? 0) > 0 && (
        <Card className="bg-white/5 border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats!.recentActivity.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span className="text-white/60 text-sm flex-1 truncate">{log.action}</span>
                  <span className="text-white/25 text-xs whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
