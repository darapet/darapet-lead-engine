import { useParams } from "wouter";
import { useGetLeadBatch } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Download, Mail, AlertCircle, RefreshCcw, Send, Globe, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetLeadBatchQueryKey } from "@workspace/api-client-react";

export function LeadBatchDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: batch, isLoading, isError, isFetching } = useGetLeadBatch(id, {
    query: {
      queryKey: getGetLeadBatchQueryKey(id),
      refetchInterval: (data) => {
        // Poll every 3 seconds if status is running or pending
        if (data?.state?.data?.status === 'running' || data?.state?.data?.status === 'pending') {
          return 3000;
        }
        return false;
      }
    }
  });

  const queryClient = useQueryClient();

  const handleDownloadCSV = () => {
    if (!batch || !batch.leads.length) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (batch.targetType === 'email') {
      csvContent += "Email,Source URL,Created At\n";
      batch.leads.forEach(lead => {
        const row = `"${lead.email || ''}","${lead.sourceUrl || ''}","${lead.createdAt}"`;
        csvContent += row + "\n";
      });
    } else {
      csvContent += "Platform,Name,URL,Source URL,Created At\n";
      batch.leads.forEach(lead => {
        const row = `"${lead.socialPlatform || ''}","${lead.socialName || ''}","${lead.socialUrl || ''}","${lead.sourceUrl || ''}","${lead.createdAt}"`;
        csvContent += row + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `darapet-batch-${batch.darapetId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !batch) {
    return (
      <div className="p-8 text-center bg-destructive/5 rounded-xl border border-destructive/20 text-destructive">
        <AlertCircle className="w-10 h-10 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Batch not found</h2>
        <p>The batch you are looking for does not exist or an error occurred.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/leads">Back to history</Link>
        </Button>
      </div>
    );
  }

  const isRunning = batch.status === 'running' || batch.status === 'pending';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/leads" className="hover:text-foreground flex items-center transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to History
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Batch #{batch.darapetId}
            <Badge variant={
              batch.status === 'completed' ? 'default' : 
              batch.status === 'failed' ? 'destructive' : 'secondary'
            } className="capitalize text-sm">
              {batch.status}
            </Badge>
            {isFetching && <RefreshCcw className="w-4 h-4 text-muted-foreground animate-spin" />}
          </h1>
          <p className="text-muted-foreground mt-2">
            {batch.source === 'upload' ? 'Uploaded list' : `Search: ${batch.niche} in ${batch.country}`}
            {" • "}{format(new Date(batch.createdAt), 'PPpp')}
          </p>
        </div>
        
        <div className="flex gap-2">
          {batch.targetType === 'email' && (
            <Button variant="secondary" disabled className="gap-2" title="Coming soon">
              <Send className="w-4 h-4" /> Send Emails
              <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1 bg-white">Soon</Badge>
            </Button>
          )}
          <Button 
            onClick={handleDownloadCSV} 
            disabled={batch.leads.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" /> Download CSV
          </Button>
        </div>
      </div>

      {batch.errorMessage && (
        <Card className="border-destructive bg-destructive/5 text-destructive shadow-none">
          <CardContent className="p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Task failed</p>
              <p className="text-sm mt-1">{batch.errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold text-foreground">Target Type</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold capitalize flex items-center gap-2">
              {batch.targetType === 'email' ? <Mail className="text-primary" /> : <Globe className="text-indigo-500" />}
              {batch.targetType}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold text-foreground">Requested</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold">{batch.requestedCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold text-foreground">Found</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold text-primary">{batch.foundCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm overflow-hidden border-t-4 border-t-primary">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle>Results ({batch.leads.length})</CardTitle>
          {isRunning && (
            <CardDescription className="flex items-center gap-2 text-primary font-medium">
              <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Scraping in progress...
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  {batch.targetType === 'email' ? (
                    <>
                      <TableHead>Email</TableHead>
                      <TableHead>Source URL</TableHead>
                      <TableHead className="w-[150px]">Discovered</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Platform</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Profile URL</TableHead>
                      <TableHead className="w-[150px]">Discovered</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      {isRunning ? "Waiting for results..." : "No leads found for this batch."}
                    </TableCell>
                  </TableRow>
                ) : (
                  batch.leads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                      {batch.targetType === 'email' ? (
                        <>
                          <TableCell className="font-medium">{lead.email}</TableCell>
                          <TableCell className="text-muted-foreground text-sm truncate max-w-[300px]">
                            {lead.sourceUrl ? (
                              <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                                {lead.sourceUrl}
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                            {format(new Date(lead.createdAt), 'MMM d, h:mm a')}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="capitalize">
                            <Badge variant="outline" className="bg-white">{lead.socialPlatform}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{lead.socialName || '-'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                            {lead.socialUrl ? (
                              <a href={lead.socialUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                                {lead.socialUrl}
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                            {format(new Date(lead.createdAt), 'MMM d, h:mm a')}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
