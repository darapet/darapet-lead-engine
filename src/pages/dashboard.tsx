import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Database, Mail, Share2, AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

export function Dashboard() {
  const { data: summary, isLoading, isError } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-8 text-center bg-destructive/5 rounded-xl border border-destructive/20 text-destructive">
        <AlertCircle className="w-10 h-10 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load dashboard</h2>
        <p>There was an error communicating with the API.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Your command center for lead generation and outreach.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Batches</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalBatches.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{summary.totalLeads.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emails Found</CardTitle>
            <Mail className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{summary.totalEmails.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Social Profiles</CardTitle>
            <Share2 className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-600">{summary.totalSocials.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Batches</h2>
            <Link href="/leads" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <Card className="shadow-sm overflow-hidden">
            {summary.recentBatches.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No batches found. Start scraping to generate leads.</p>
                <Link href="/leads/new" className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Create First Batch
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {summary.recentBatches.map((batch) => (
                  <Link key={batch.id} href={`/leads/${batch.id}`} className="block hover:bg-muted/50 transition-colors p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs text-primary bg-primary/5">
                            #{batch.darapetId}
                          </Badge>
                          <span className="font-semibold">{batch.niche}</span>
                          <span className="text-muted-foreground">in</span>
                          <span className="font-semibold">{batch.country}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="capitalize">{batch.targetType} leads</span>
                          <span>•</span>
                          <span>{format(new Date(batch.createdAt), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg text-primary">
                          {batch.foundCount} <span className="text-sm font-normal text-muted-foreground">/ {batch.requestedCount}</span>
                        </div>
                        <Badge variant={
                          batch.status === 'completed' ? 'default' : 
                          batch.status === 'failed' ? 'destructive' : 'secondary'
                        } className="capitalize mt-1">
                          {batch.status === 'running' && <Clock className="w-3 h-3 mr-1 animate-pulse" />}
                          {batch.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">System Status</h2>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Google Search API</p>
                    <p className="text-xs text-muted-foreground">Required for auto-scraping</p>
                  </div>
                  {summary.googleSearchConfigured ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" /> Configured</Badge>
                  ) : (
                    <Badge variant="destructive">Missing</Badge>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Brevo Mail</p>
                    <p className="text-xs text-muted-foreground">Required for sending emails</p>
                  </div>
                  {summary.brevoConfigured ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" /> Configured</Badge>
                  ) : (
                    <Badge variant="secondary">Missing</Badge>
                  )}
                </div>
              </div>
            </CardContent>
            {(!summary.googleSearchConfigured || !summary.brevoConfigured) && (
              <div className="bg-muted p-4 border-t text-sm">
                <p className="mb-3 text-muted-foreground">Configure your APIs to unlock all features.</p>
                <Link href="/settings" className="text-primary font-medium hover:underline text-sm">
                  Go to Settings &rarr;
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
