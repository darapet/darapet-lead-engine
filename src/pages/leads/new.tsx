import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateLeadBatch, useUploadLeadBatch, useGetDashboardSummary } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, UploadCloud, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const searchSchema = z.object({
  niche: z.string().min(2, "Niche must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  targetType: z.enum(["email", "social"]),
  requestedCount: z.coerce.number().min(1).max(500, "Maximum 500 leads per batch"),
});

const uploadSchema = z.object({
  targetType: z.enum(["email", "social"]),
  entries: z.string().min(1, "Please provide at least one URL or email"),
});

export function NewLeadBatch() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: summary } = useGetDashboardSummary();
  const createBatch = useCreateLeadBatch();
  const uploadBatch = useUploadLeadBatch();

  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      niche: "",
      country: "",
      targetType: "email",
      requestedCount: 50,
    },
  });

  const uploadForm = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      targetType: "email",
      entries: "",
    },
  });

  const onSearchSubmit = (values: z.infer<typeof searchSchema>) => {
    createBatch.mutate({ data: values }, {
      onSuccess: (batch) => {
        toast({
          title: "Batch created successfully",
          description: `Batch #${batch.darapetId} is now running.`,
        });
        setLocation(`/leads/${batch.id}`);
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Failed to create batch",
          description: error?.message || "Ensure your Google Search API key is configured.",
        });
      }
    });
  };

  const onUploadSubmit = (values: z.infer<typeof uploadSchema>) => {
    const entriesList = values.entries.split('\n').map(e => e.trim()).filter(e => e.length > 0);
    if (entriesList.length === 0) {
      uploadForm.setError("entries", { message: "No valid entries found" });
      return;
    }

    uploadBatch.mutate({ 
      data: { 
        targetType: values.targetType, 
        entries: entriesList 
      } 
    }, {
      onSuccess: (batch) => {
        toast({
          title: "List uploaded successfully",
          description: `Batch #${batch.darapetId} has been created.`,
        });
        setLocation(`/leads/${batch.id}`);
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Failed to upload list",
          description: error?.message || "An error occurred.",
        });
      }
    });
  };

  const isGoogleConfigured = summary?.googleSearchConfigured ?? true;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">New Lead Batch</h1>
        <p className="text-muted-foreground mt-2">
          Hunt for new prospects or bring your own list.
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12 items-center p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="search" className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:bg-white h-full transition-all">
            <Search className="w-4 h-4 mr-2" />
            Auto Search
          </TabsTrigger>
          <TabsTrigger value="upload" className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:bg-white h-full transition-all">
            <UploadCloud className="w-4 h-4 mr-2" />
            Upload List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card className="border-t-4 border-t-primary shadow-sm">
            <CardHeader>
              <CardTitle>Target Criteria</CardTitle>
              <CardDescription>
                Define your ideal customer and we'll scrape the web to find them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isGoogleConfigured && (
                <Alert variant="destructive" className="mb-6 bg-destructive/5 border-destructive/20 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Missing Configuration</AlertTitle>
                  <AlertDescription>
                    Auto-search needs a Google Search key in Settings. You can still use the "Upload List" tab, or try to submit and it will fail gracefully.
                  </AlertDescription>
                </Alert>
              )}

              <Form {...searchForm}>
                <form onSubmit={searchForm.handleSubmit(onSearchSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={searchForm.control}
                      name="niche"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Niche / Industry</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Plumbers, SaaS Founders..." {...field} className="bg-slate-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={searchForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country / Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. USA, UK, London..." {...field} className="bg-slate-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={searchForm.control}
                    name="targetType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>What are you looking for?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="email" />
                              </FormControl>
                              <div className="font-medium">Emails</div>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="social" />
                              </FormControl>
                              <div className="font-medium">Social Media Profiles</div>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={searchForm.control}
                    name="requestedCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of leads (max 500)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-slate-50 w-full md:w-1/3" />
                        </FormControl>
                        <FormDescription>Larger batches take longer to process.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full md:w-auto mt-4" disabled={createBatch.isPending}>
                    {createBatch.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Start Hunting
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card className="border-t-4 border-t-indigo-500 shadow-sm">
            <CardHeader>
              <CardTitle>Upload Custom List</CardTitle>
              <CardDescription>
                Paste a list of website URLs or Emails (one per line) to parse and standardize them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...uploadForm}>
                <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-6">
                  <FormField
                    control={uploadForm.control}
                    name="targetType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Process as:</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="email" />
                              </FormControl>
                              <div className="font-medium">Emails</div>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="social" />
                              </FormControl>
                              <div className="font-medium">Social Media Profiles</div>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={uploadForm.control}
                    name="entries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data (URLs or Emails)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="https://example.com&#10;https://another.com&#10;test@email.com" 
                            className="min-h-[200px] font-mono text-sm bg-slate-50" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Paste one entry per line.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700" disabled={uploadBatch.isPending}>
                    {uploadBatch.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Process List
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
