import { useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { COUNTRIES } from '@/data/countries';
import { SOCIAL_PLATFORMS, SOCIAL_CATEGORIES } from '@/data/socialMedia';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2, Search, Globe2, Hash, Share2, Mail, AtSign, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScrapeResult {
  country: string;
  leads: Array<{ name: string; url: string; email?: string; source: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SCRAPING ENGINE — extracts real emails and social profile links, not domains
// ═══════════════════════════════════════════════════════════════════════════════

// Matches valid email addresses
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g;

// Junk domains / prefixes we never want to surface
const JUNK_EMAIL_PREFIXES = ['sentry', 'noreply', 'no-reply', 'donotreply', 'mailer', 'bounce', 'info@example', 'test@'];
const JUNK_EMAIL_DOMAINS  = ['example.com', 'w3.org', 'schema.org', 'sentry.io', 'cloudflare.com', 'google.com', 'bing.com'];

// Paths that belong to the platform UI, not a user profile
const PROFILE_BLOCKLIST: Record<string, RegExp> = {
  'instagram.com': /\/(p|reel|reels|stories|explore|tv|direct|accounts|_u|web)\//i,
  'twitter.com':   /\/(search|home|i\/|hashtag|explore|notifications|messages|settings)\//i,
  'x.com':         /\/(search|home|i\/|hashtag|explore|notifications|messages|settings)\//i,
  'linkedin.com':  /\/(jobs|feed|messaging|notifications|search|learning|company-beta)\//i,
  'tiktok.com':    /\/(explore|trending|live|foryou|tag)\//i,
  'youtube.com':   /\/(results|feed|playlist|watch|shorts|trending)\//i,
  'facebook.com':  /\/(events|groups|marketplace|gaming|watch|pages\/create|login)\//i,
  'pinterest.com': /\/(search|pin|board)\//i,
  'snapchat.com':  /\/(map|stories|spotlight)\//i,
};
const NON_PROFILE_SEGS = new Set(['search', 'explore', 'home', 'live', 'feed', 'watch', 'trending', 'help', 'about', 'legal', 'privacy', 'terms', 'blog', 'press', 'careers', 'ads', 'business', 'brand', 'directory', 'hashtag', 'topic', 'category']);

/** Extract valid social-profile URLs for a given platform domain from raw HTML */
function extractProfileUrls(html: string, domain: string): string[] {
  const esc = domain.replace(/\./g, '\\.');
  // Capture: https://domain.com/path[/subpath] — stop at quote/space/end
  const re  = new RegExp(`https?://(?:www\\.)?${esc}/([\\w@.%_-]{2,60})(?:/([\\w@.%_-]{2,40}))?`, 'gi');
  const seen = new Set<string>();
  const out: string[] = [];
  const blocklist = PROFILE_BLOCKLIST[domain];

  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const full = m[0].replace(/['")\s>]+$/, ''); // strip trailing junk
    if (seen.has(full)) continue;
    seen.add(full);

    const seg1 = (m[1] || '').replace(/^@/, '').toLowerCase();
    if (!seg1 || seg1.length < 2) continue;
    if (NON_PROFILE_SEGS.has(seg1)) continue;
    if (blocklist && blocklist.test(full)) continue;

    out.push(full);
  }
  return out;
}

/** Core scraping function — no API key needed, uses Bing via free CORS proxy */
async function scrapeLeadsKeyless(
  query: string,
  count: number,
  type: 'email' | 'social',
  platform?: { id: string; domain: string; name: string },
): Promise<Array<{
  email?: string;
  social_name?: string;
  social_platform?: string;
  social_url?: string;
}>> {

  // ── Build the right Bing query ──────────────────────────────────────────────
  // Email: add common email domains so Bing surfaces pages that contain them
  // Social: search "niche country platform.com" (NO site: — often blocked by proxy)
  const searchQ = type === 'email'
    ? `"${query}" "@gmail.com" OR "@yahoo.com" OR "@hotmail.com" OR "@outlook.com"`
    : `"${query}" ${platform?.domain ?? 'social media'} profile`;

  // ── Fetch via two free CORS proxies ────────────────────────────────────────
  const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchQ)}&count=50&setlang=en`;
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(bingUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(bingUrl)}`,
  ];

  let html = '';
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy, { signal: AbortSignal.timeout(13000) });
      if (!res.ok) continue;
      const raw = await res.text();
      // allorigins wraps content in JSON; corsproxy returns raw HTML
      try { html = JSON.parse(raw).contents ?? raw; } catch { html = raw; }
      if (html.length > 500) break;
    } catch { /* try next proxy */ }
  }

  if (!html) return [];

  // ── Extract based on type ───────────────────────────────────────────────────
  if (type === 'email') {
    // Scan the ENTIRE Bing HTML — snippets contain emails when we search for "@gmail.com"
    const raw   = html.match(EMAIL_RE) ?? [];
    const valid = [...new Set(raw.map(e => e.toLowerCase()))].filter(e => {
      const [user, domain] = e.split('@');
      if (!user || !domain || !domain.includes('.')) return false;
      if (JUNK_EMAIL_PREFIXES.some(p => e.startsWith(p))) return false;
      if (JUNK_EMAIL_DOMAINS.some(d => domain.endsWith(d))) return false;
      if (user.length < 3) return false;
      return true;
    });
    return valid.slice(0, count).map(email => ({ email }));
  } else {
    // Extract social media profile URLs from the HTML
    const domain    = platform?.domain ?? '';
    const profiles  = domain ? extractProfileUrls(html, domain) : [];
    return profiles.slice(0, count).map(url => {
      // Pull the first meaningful path segment as username
      const seg = url
        .replace(/https?:\/\/(www\.)?[^/]+\//, '')
        .replace(/^@/, '')
        .split('/')[0] || url;
      return {
        social_name:     seg,
        social_platform: platform?.id ?? 'social',
        social_url:      url,
      };
    });
  }
}
// ═══════════════════════════════════════════════════════════════════════════════

export function ScrapePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [scraping, setScraping] = useState(false);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [batchId, setBatchId] = useState<number | null>(null);

  // Step 0: Countries & States
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<Record<string, string[]>>({});
  const [countrySearch, setCountrySearch] = useState('');

  // Step 1: Niche & Amount
  const [niche, setNiche] = useState('');
  const [amount, setAmount] = useState(20);

  // Step 2: Target
  const [scrapeType, setScrapeType] = useState<'email' | 'social'>('email');
  const [selectedSocial, setSelectedSocial] = useState('');
  const [socialCategoryFilter, setSocialCategoryFilter] = useState('all');

  const steps = [
    { title: 'Location', description: 'Pick countries & states', icon: Globe2 },
    { title: 'Target',   description: 'Niche & lead count',      icon: Hash   },
    { title: 'Channel',  description: 'Email or social platform', icon: Share2 },
  ];

  // ── Country / State helpers ─────────────────────────────────────────────────
  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
    if (!selectedStates[code]) setSelectedStates(prev => ({ ...prev, [code]: [] }));
  };
  const toggleState = (countryCode: string, state: string) => {
    setSelectedStates(prev => {
      const cur = prev[countryCode] || [];
      return { ...prev, [countryCode]: cur.includes(state) ? cur.filter(s => s !== state) : [...cur, state] };
    });
  };
  const selectAllStates = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (!country) return;
    const cur = selectedStates[countryCode] || [];
    setSelectedStates(prev => ({
      ...prev,
      [countryCode]: cur.length === country.states.length ? [] : [...country.states],
    }));
  };

  const filteredCountries  = COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  const filteredSocials    = SOCIAL_PLATFORMS.filter(p => socialCategoryFilter === 'all' || p.category === socialCategoryFilter);

  // ── Main scrape logic ───────────────────────────────────────────────────────
  const doScrape = async () => {
    if (!user) return;
    setScraping(true);
    setStep(3);

    const allResults: ScrapeResult[] = [];
    const platform = SOCIAL_PLATFORMS.find(p => p.id === selectedSocial);

    for (const countryCode of selectedCountries) {
      const country     = COUNTRIES.find(c => c.code === countryCode)!;
      const countryLeads: ScrapeResult['leads'] = [];

      // Use specific states if selected, otherwise use country name
      const locations = (selectedStates[countryCode] || []).length > 0
        ? selectedStates[countryCode]
        : [country.name];

      for (const location of locations) {
        try {
          const raw = await scrapeLeadsKeyless(
            `${niche} ${location}`,
            Math.ceil(amount / locations.length),
            scrapeType,
            platform ? { id: platform.id, domain: platform.domain, name: platform.name } : undefined,
          );

          for (const lead of raw) {
            if (scrapeType === 'social') {
              // For social: name = @username, url = full profile URL
              countryLeads.push({
                name:   `@${lead.social_name ?? ''}`,
                url:    lead.social_url ?? '',
                source: lead.social_url ?? '',
              });
            } else {
              // For email: name = the email address itself (no website domain noise)
              countryLeads.push({
                name:   lead.email ?? '',
                email:  lead.email,
                url:    '',          // no website URL — user asked for emails only
                source: '',
              });
            }
          }
        } catch (err) {
          console.error('Scrape error for', location, err);
        }

        if (countryLeads.length >= amount) break;
      }

      // Deduplicate within country
      const deduped = countryLeads.filter((lead, i, arr) =>
        lead.name && arr.findIndex(l => l.name === lead.name) === i
      );

      // Save batch to Supabase
      const { data: batch } = await supabase.from('lead_batches').insert({
        user_id:         user.id,
        niche,
        country:         country.name,
        target_type:     scrapeType === 'social' ? (platform?.id || selectedSocial) : 'email',
        requested_count: amount,
        found_count:     deduped.length,
        source:          'bing',
        status:          'complete',
      }).select().single();

      if (batch) {
        setBatchId(batch.id);
        const leadsToInsert = deduped.map(lead => ({
          batch_id:        batch.id,
          email:           scrapeType === 'email' ? lead.email ?? null : null,
          social_name:     scrapeType === 'social' ? lead.name.replace(/^@/, '') : null,
          social_platform: scrapeType === 'social' ? (platform?.id || selectedSocial) : null,
          social_url:      scrapeType === 'social' ? lead.url : null,
          source_url:      lead.source || null,
        }));
        if (leadsToInsert.length > 0) await supabase.from('darapet_leads').insert(leadsToInsert);
      }

      if (deduped.length > 0) allResults.push({ country: country.name, leads: deduped.slice(0, amount) });
    }

    // Log activity
    const total = allResults.reduce((s, r) => s + r.leads.length, 0);
    supabase.from('activity_logs').insert({
      user_id: user.id,
      action: `Scraped ${total} ${scrapeType} leads for "${niche}"`,
    }).then(() => {});

    setResults(allResults);
    setScraping(false);

    if (total > 0) {
      toast({ title: `Found ${total} leads!`, description: 'Saved to your lead history.' });
    } else {
      toast({ variant: 'destructive', title: 'No leads found', description: 'Try a broader niche or different location.' });
    }
  };

  const totalFound = results.reduce((s, r) => s + r.leads.length, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">New Lead Scrape</h1>
        <p className="text-muted-foreground mt-2">Find leads by location, niche, and channel</p>
      </div>

      {/* Step bar */}
      {step < 3 && (
        <div className="flex items-center gap-0">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done   = i < step;
            return (
              <div key={s.title} className="flex items-center">
                <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                  active ? 'bg-primary/10 text-primary' : done ? 'text-green-600' : 'text-muted-foreground')}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  <span className="text-sm font-medium hidden sm:block">{s.title}</span>
                </div>
                {i < steps.length - 1 && <div className={cn('w-8 h-0.5', done ? 'bg-green-500' : 'bg-border')} />}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── Step 0 — Countries ───────────────────────────────── */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader>
                <CardTitle>Select Countries &amp; States</CardTitle>
                <CardDescription>Choose where to look for leads. Check states for more specific targeting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Search countries..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
                  className="bg-muted/50" />
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredCountries.map(country => {
                    const isSelected = selectedCountries.includes(country.code);
                    const states     = selectedStates[country.code] || [];
                    const allSel     = states.length === country.states.length;
                    return (
                      <div key={country.code} className={cn('border rounded-xl overflow-hidden transition-all',
                        isSelected ? 'border-primary/40 bg-primary/5' : 'border-border')}>
                        <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30" onClick={() => toggleCountry(country.code)}>
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleCountry(country.code)} className="shrink-0" />
                          <span className="font-medium flex-1">{country.name}</span>
                          {isSelected && <Badge variant="secondary" className="text-xs">{states.length}/{country.states.length} states</Badge>}
                        </div>
                        {isSelected && (
                          <div className="px-4 pb-3 border-t border-border/50 bg-muted/20">
                            <button onClick={() => selectAllStates(country.code)}
                              className="text-xs text-primary hover:underline mt-2 mb-2 font-medium flex items-center gap-1">
                              {allSel ? '☑ Deselect all states' : '☐ Select all states'} ({country.states.length})
                            </button>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                              {country.states.map(state => (
                                <label key={state} className="flex items-center gap-2 text-xs py-1 cursor-pointer hover:text-primary">
                                  <Checkbox checked={states.includes(state)} onCheckedChange={() => toggleState(country.code, state)} className="w-3 h-3" />
                                  {state}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedCountries.length} countr{selectedCountries.length !== 1 ? 'ies' : 'y'} selected
                  </span>
                  <Button onClick={() => setStep(1)} disabled={selectedCountries.length === 0} className="gap-2">
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 1 — Niche & Amount ──────────────────────────── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader>
                <CardTitle>What are you looking for?</CardTitle>
                <CardDescription>Enter a niche and how many leads you want per country.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Niche / Industry</Label>
                  <Input placeholder="e.g. Plumbers, SaaS Startups, E-commerce stores, Dentists..."
                    value={niche} onChange={e => setNiche(e.target.value)} className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Number of leads (per country)</Label>
                  <Input type="number" min={1} max={100} value={amount}
                    onChange={e => setAmount(Number(e.target.value))} className="bg-muted/50 w-40" />
                  <p className="text-xs text-muted-foreground">Up to 100 leads per country per scrape.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(0)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
                  <Button onClick={() => setStep(2)} disabled={niche.length < 2} className="gap-2">Continue <ChevronRight className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 2 — Channel ─────────────────────────────────── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Channel</CardTitle>
                <CardDescription>Scrape email addresses, or find profiles on a social platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setScrapeType('email')}
                    className={cn('p-4 rounded-xl border-2 text-left transition-all',
                      scrapeType === 'email' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                    <Mail className="w-6 h-6 mb-2 text-primary" />
                    <p className="font-semibold">Email Addresses</p>
                    <p className="text-xs text-muted-foreground mt-1">Find real business emails (gmail, yahoo, etc.)</p>
                  </button>
                  <button onClick={() => setScrapeType('social')}
                    className={cn('p-4 rounded-xl border-2 text-left transition-all',
                      scrapeType === 'social' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                    <Share2 className="w-6 h-6 mb-2 text-primary" />
                    <p className="font-semibold">Social Profiles</p>
                    <p className="text-xs text-muted-foreground mt-1">Find profile names &amp; links on a platform</p>
                  </button>
                </div>

                {scrapeType === 'social' && (
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {['all', ...SOCIAL_CATEGORIES.map(c => c.id)].map(cat => (
                        <button key={cat} onClick={() => setSocialCategoryFilter(cat)}
                          className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all',
                            socialCategoryFilter === cat
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:border-primary/30')}>
                          {cat === 'all' ? 'All' : SOCIAL_CATEGORIES.find(c => c.id === cat)?.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
                      {filteredSocials.map(platform => (
                        <button key={platform.id} onClick={() => setSelectedSocial(platform.id)}
                          className={cn('flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left',
                            selectedSocial === platform.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/30')}>
                          <img src={platform.icon} alt={platform.name} className="w-4 h-4 shrink-0 object-contain"
                            style={{ filter: selectedSocial === platform.id ? 'none' : 'brightness(0) invert(0.6)' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <span className="truncate">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                    {selectedSocial && (() => {
                      const pl = SOCIAL_PLATFORMS.find(p => p.id === selectedSocial);
                      return pl ? (
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-sm flex items-center gap-2">
                          <img src={pl.icon} alt={pl.name} className="w-4 h-4 shrink-0 object-contain"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                          <span className="text-primary font-medium">{pl.name}</span>
                          <span className="text-muted-foreground">selected. Only one platform per scrape.</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
                  <Button onClick={doScrape} disabled={scrapeType === 'social' && !selectedSocial} className="gap-2">
                    <Search className="w-4 h-4" /> Start Scraping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 3 — Loading / Results ───────────────────────── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {scraping ? (
              <Card>
                <CardContent className="py-16 text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                  <p className="text-lg font-semibold">Scraping in progress…</p>
                  <p className="text-muted-foreground text-sm">
                    Searching across {selectedCountries.length} countr{selectedCountries.length !== 1 ? 'ies' : 'y'} for <strong>{niche}</strong>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Summary banner */}
                <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="p-6 flex items-center gap-4">
                    <CheckCircle2 className="w-10 h-10 text-green-500 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Scrape Complete!</h3>
                      <p className="text-green-600 dark:text-green-400 text-sm">
                        Found <strong>{totalFound}</strong> {scrapeType === 'email' ? 'email addresses' : 'social profiles'} across {results.length} countr{results.length !== 1 ? 'ies' : 'y'}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      {scrapeType === 'email' && (
                        <Button size="sm" onClick={() => batchId && setLocation(`/email?batch=${batchId}`)} disabled={!batchId || totalFound === 0} className="gap-1">
                          <Mail className="w-3.5 h-3.5" /> Send Emails
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => batchId && setLocation(`/leads/${batchId}`)} disabled={!batchId}>
                        View All Leads
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results by country */}
                {results.map(r => (
                  <Card key={r.country}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-primary" /> {r.country}
                        <Badge variant="secondary">{r.leads.length} leads</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-border">
                        {r.leads.map((lead, i) => (
                          <div key={i} className="flex items-center gap-3 py-2">
                            <span className="text-muted-foreground text-xs w-6 shrink-0">{i + 1}</span>
                            {scrapeType === 'email' ? (
                              /* ── EMAIL RESULT ── */
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                                  {lead.email || lead.name}
                                </span>
                              </div>
                            ) : (
                              /* ── SOCIAL RESULT ── */
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <AtSign className="w-4 h-4 text-purple-500 shrink-0" />
                                <span className="text-sm font-medium truncate">{lead.name}</span>
                                {lead.url && (
                                  <a href={lead.url} target="_blank" rel="noopener noreferrer"
                                    className="ml-auto shrink-0 text-muted-foreground hover:text-primary flex items-center gap-1 text-xs">
                                    <ExternalLink className="w-3 h-3" /> Profile
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {totalFound === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No leads found. Try a broader niche or different location.
                    </CardContent>
                  </Card>
                )}

                <Button variant="outline" onClick={() => { setStep(0); setResults([]); }} className="w-full">
                  Start New Scrape
                </Button>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
