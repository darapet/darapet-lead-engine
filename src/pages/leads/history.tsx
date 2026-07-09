import { useListLeadBatches, useDeleteLeadBatch } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, ExternalLink, AlertCircle, Database } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListLeadBatchesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function LeadHistory() {
  const { data: batches, isLoading, isError } = useListLeadBatches();
  const deleteBatch = useDeleteLeadBatch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    deleteBatch.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Batch deleted" });
        queryClient.invalidateQueries({ queryKey: getListLeadBatchesQueryKey() });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to delete batch" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  if (isError || !batches) {
    return (
      <div className="p-8 text-center bg-destructive/5 rounded-xl border border-destructive/20 text-destructive">
        <AlertCircle className="w-10 h-10 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load history</h2>
        <p>There was an error retrieving your lead batches.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Lead History</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your past lead generation batches.
          </p>
        </div>
        <Button asChild>
          <Link href="/leads/new">New Batch</Link>
        </Button>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="p-16 text-center text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-2">No batches yet</h3>
            <p className="mb-6">You haven't run any lead searches yet.</p>
            <Button asChild variant="outline">
              <Link href="/leads/new">Start your first search</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <Card key={batch.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4">
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[120px]">
                    <Badge variant="outline" className="font-mono bg-slate-50">#{batch.darapetId}</Badge>
                    <Badge variant={
                      batch.status === 'completed' ? 'default' : 
                      batch.status === 'failed' ? 'destructive' : 'secondary'
                    } className="capitalize">
                      {batch.status}
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-primary truncate">
                      {batch.source === 'upload' ? 'List Upload' : `${batch.niche} in ${batch.country}`}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="capitalize font-medium text-foreground/80">{batch.targetType} Leads</span>
                      <span>{format(new Date(batch.createdAt), 'PPpp')}</span>
                      {batch.errorMessage && (
                        <span className="text-destructive truncate block max-w-xs" title={batch.errorMessage}>
                          Error: {batch.errorMessage}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
                    <div className="text-center sm:text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {batch.foundCount}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        found of {batch.requestedCount}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the batch #{batch.darapetId} and all its associated leads.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(batch.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button asChild size="sm" className="h-8">
                        <Link href={`/leads/${batch.id}`}>
                          View <ExternalLink className="w-3 h-3 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
