import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import type { AppUser, ActivityLog, RestrictionField } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, ShieldOff, UserCheck, Trash2, Plus, ArrowLeft, Loader2, Mail, Calendar, Hash, Lock } from 'lucide-react';

type FieldType = 'text' | 'number' | 'date' | 'file';

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<AppUser | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [suspendDialog, setSuspendDialog] = useState(false);
  const [banDialog, setBanDialog] = useState(false);
  const [restrictDialog, setRestrictDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [upgradeDialog, setUpgradeDialog] = useState(false);

  const [suspendReason, setSuspendReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const [emailLimit, setEmailLimit] = useState('');
  const [planName, setPlanName] = useState('');
  const [restrictionTitle, setRestrictionTitle] = useState('');
  const [restrictionDesc, setRestrictionDesc] = useState('');
  const [restrictionFields, setRestrictionFields] = useState<RestrictionField[]>([]);

  useEffect(() => {
    const load = async () => {
      const [userRes, actRes] = await Promise.all([
        supabase.from('app_users').select('*').eq('id', id!).single(),
        supabase.from('activity_logs').select('*').eq('user_id', id!).order('created_at', { ascending: false }).limit(20),
      ]);
      setUser(userRes.data);
      setActivity(actRes.data || []);
      if (userRes.data?.daily_email_limit) setEmailLimit(String(userRes.data.daily_email_limit));
      if (userRes.data?.role) setPlanName(userRes.data.role);
      setLoading(false);
    };
    load();
  }, [id]);

  // Fixed: single update call with cast to bypass strict TS
  const updateStatus = async (status: string, extra: Record<string, unknown> = {}) => {
    setSaving(true);
    const updates = { status, ...extra };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('app_users') as any).update(updates).eq('id', id!);
    setSaving(false);
    if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); return; }
    setUser(prev => prev ? { ...prev, ...updates } as AppUser : prev);
    toast({ title: 'Updated', description: `User status set to "${status}"` });
  };

  const handleSuspend  = async () => { await updateStatus('suspended',  { suspend_reason: suspendReason }); setSuspendDialog(false); setSuspendReason(''); };
  const handleBan      = async () => { await updateStatus('banned',     { suspend_reason: banReason });    setBanDialog(false);    setBanReason(''); };
  const handleUndo     = async () => { await updateStatus('active',     { suspend_reason: null, review_request: null }); };
  const handleRestrict = async () => {
    const req = { title: restrictionTitle, description: restrictionDesc, fields: restrictionFields };
    await updateStatus('restricted', { review_request: JSON.stringify(req) });
    setRestrictDialog(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    await supabase.from('app_users').delete().eq('id', id!);
    setSaving(false);
    toast({ title: 'Deleted', description: 'User account deleted.' });
    setLocation('/admin/users');
  };

  const handleUpgrade = async () => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('app_users') as any).update({ daily_email_limit: Number(emailLimit), role: planName }).eq('id', id!);
    setSaving(false);
    setUser(prev => prev ? { ...prev, daily_email_limit: Number(emailLimit), role: planName } as AppUser : prev);
    setUpgradeDialog(false);
    toast({ title: 'Plan Updated', description: 'Email limit and plan updated.' });
  };

  const addField    = () => setRestrictionFields(prev => [...prev, { id: Date.now().toString(), label: '', type: 'text' as FieldType, required: true }]);
  const updateField = (i: number, patch: Partial<RestrictionField>) => setRestrictionFields(prev => prev.map((f, idx) => idx === i ? { ...f, ...patch } : f));
  const removeField = (i: number) => setRestrictionFields(prev => prev.filter((_, idx) => idx !== i));

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />)}</div>;
  if (!user)   return <div className="text-white/50 text-center py-20">User not found</div>;

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown User';
  const status   = user.status || 'active';
  const STATUS_COLOR: Record<string, string> = {
    active:     'bg-green-500/10  text-green-400  border-green-500/30',
    suspended:  'bg-orange-500/10 text-orange-400 border-orange-500/30',
    restricted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    banned:     'bg-red-500/10    text-red-400    border-red-500/30',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => setLocation('/admin/users')} className="text-white/50 hover:text-white gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Button>

      {/* User card */}
      <div className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/5">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center text-2xl font-bold text-blue-300 shrink-0">
          {fullName[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-white">{fullName}</h2>
            <Badge className={STATUS_COLOR[status] || STATUS_COLOR.active}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
          </div>
          <p className="text-white/50 text-sm mt-1">{user.email}</p>
          {user.brand_name && <p className="text-white/40 text-xs mt-1">Brand: {user.brand_name}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-white/30 flex-wrap">
            {user.daily_email_limit && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.daily_email_limit}/day</span>}
            {user.role && <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {user.role}</span>}
            {user.created_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {new Date(user.created_at).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      {/* Status alerts */}
      {status === 'restricted' && user.review_request && (() => {
        try { const req = JSON.parse(user.review_request as string);
          return <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300"><p className="font-semibold text-sm">⚠ Restriction: {req.title}</p>{req.description && <p className="text-xs text-yellow-300/70 mt-1">{req.description}</p>}</div>;
        } catch { return null; }
      })()}
      {status === 'suspended' && user.suspend_reason && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-300">
          <p className="font-semibold text-sm">⛔ Suspended: {user.suspend_reason}</p>
        </div>
      )}

      {/* Actions */}
      <Card className="bg-white/5 border-white/5">
        <CardHeader><CardTitle className="text-white text-base">Account Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {status !== 'active' && (
              <Button onClick={handleUndo} disabled={saving} className="bg-green-700 hover:bg-green-600 gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} Restore Active
              </Button>
            )}
            {status === 'active' && <>
              <Button onClick={() => setSuspendDialog(true)} variant="outline" disabled={saving} className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 gap-2">
                <AlertTriangle className="w-4 h-4" /> Suspend
              </Button>
              <Button onClick={() => setRestrictDialog(true)} variant="outline" disabled={saving} className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 gap-2">
                <Lock className="w-4 h-4" /> Restrict
              </Button>
              <Button onClick={() => setBanDialog(true)} variant="outline" disabled={saving} className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2">
                <ShieldOff className="w-4 h-4" /> Ban
              </Button>
            </>}
            <Button onClick={() => setUpgradeDialog(true)} variant="outline" disabled={saving} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-2">
              <Mail className="w-4 h-4" /> Set Plan &amp; Limits
            </Button>
            <Button onClick={() => setDeleteDialog(true)} variant="outline" disabled={saving} className="border-red-500/20 text-red-500 hover:bg-red-500/10 gap-2 ml-auto">
              <Trash2 className="w-4 h-4" /> Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity */}
      <Card className="bg-white/5 border-white/5">
        <CardHeader><CardTitle className="text-white text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {activity.length === 0
            ? <p className="text-white/30 text-sm py-4 text-center">No activity recorded yet.</p>
            : <div className="space-y-1">{activity.map(log => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <span className="text-white/60 text-sm flex-1">{log.action}</span>
                  <span className="text-white/25 text-xs whitespace-nowrap">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</span>
                </div>
              ))}</div>
          }
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle className="text-orange-400">Suspend User</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Reason (shown to user)</Label>
            <Textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="e.g. Violation of terms of service..." className="bg-white/5 border-white/10 text-white" /></div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspendDialog(false)} className="text-white/60">Cancel</Button>
            <Button onClick={handleSuspend} disabled={saving || !suspendReason} className="bg-orange-600 hover:bg-orange-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={banDialog} onOpenChange={setBanDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle className="text-red-400">Ban User</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Reason</Label>
            <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="e.g. Repeated abuse..." className="bg-white/5 border-white/10 text-white" /></div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBanDialog(false)} className="text-white/60">Cancel</Button>
            <Button onClick={handleBan} disabled={saving || !banReason} className="bg-red-600 hover:bg-red-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Permanently Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restrictDialog} onOpenChange={setRestrictDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
          <DialogHeader><DialogTitle className="text-yellow-400">Restrict Account</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2"><Label>Restriction Title</Label>
              <Input value={restrictionTitle} onChange={e => setRestrictionTitle(e.target.value)} placeholder="e.g. Identity Verification Required" className="bg-white/5 border-white/10 text-white" /></div>
            <div className="space-y-2"><Label>Description (optional)</Label>
              <Textarea value={restrictionDesc} onChange={e => setRestrictionDesc(e.target.value)} placeholder="Explain what the user needs to do..." className="bg-white/5 border-white/10 text-white" rows={2} /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Required Fields</Label>
                <Button type="button" size="sm" onClick={addField} variant="outline" className="border-white/10 text-white/70 hover:text-white gap-1"><Plus className="w-3 h-3" /> Add field</Button>
              </div>
              {restrictionFields.map((field, i) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <Input value={field.label} onChange={e => updateField(i, { label: e.target.value })} placeholder="Field label" className="bg-white/5 border-white/10 text-white flex-1" />
                  <Select value={field.type} onValueChange={v => updateField(i, { type: v as FieldType })}>
                    <SelectTrigger className="w-28 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {(['text','number','date','file'] as FieldType[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeField(i)} className="text-red-400 hover:text-red-300 shrink-0"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRestrictDialog(false)} className="text-white/60">Cancel</Button>
            <Button onClick={handleRestrict} disabled={saving || !restrictionTitle} className="bg-yellow-600 hover:bg-yellow-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Apply Restriction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={upgradeDialog} onOpenChange={setUpgradeDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>Set Plan &amp; Limits</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Plan Name</Label>
              <Input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="e.g. Pro, Basic, Free" className="bg-white/5 border-white/10 text-white" /></div>
            <div className="space-y-2"><Label>Daily Email Limit</Label>
              <Input type="number" value={emailLimit} onChange={e => setEmailLimit(e.target.value)} className="bg-white/5 border-white/10 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUpgradeDialog(false)} className="text-white/60">Cancel</Button>
            <Button onClick={handleUpgrade} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle className="text-red-400">Delete Account</DialogTitle></DialogHeader>
          <p className="text-white/70">This permanently deletes <strong>{fullName}</strong>'s account. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(false)} className="text-white/60">Cancel</Button>
            <Button onClick={handleDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Yes, Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
