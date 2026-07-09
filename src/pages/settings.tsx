import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const settingsSchema = z.object({
  brevoApiKey: z.string().optional(),
  googleSearchApiKey: z.string().optional(),
  googleSearchEngineId: z.string().optional(),
  brandName: z.string().min(1, "Brand name is required"),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  signatureName: z.string().optional(),
  signatureTitle: z.string().optional(),
  signatureText: z.string().optional(),
});

export function SettingsPage() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      brandName: "",
      websiteUrl: "",
      signatureName: "",
      signatureTitle: "",
      signatureText: "",
      brevoApiKey: "",
      googleSearchApiKey: "",
      googleSearchEngineId: "",
    },
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (settings && !initializedRef.current) {
      form.reset({
        brandName: settings.brandName || "",
        websiteUrl: settings.websiteUrl || "",
        signatureName: settings.signatureName || "",
        signatureTitle: settings.signatureTitle || "",
        signatureText: settings.signatureText || "",
        brevoApiKey: settings.brevoApiKey || "",
        googleSearchApiKey: settings.googleSearchApiKey || "",
        googleSearchEngineId: settings.googleSearchEngineId || "",
      });
      initializedRef.current = true;
    }
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    updateSettings.mutate({
      data: values
    }, {
      onSuccess: () => {
        toast({
          title: "Settings saved",
          description: "Your configuration has been updated successfully.",
        });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Failed to save",
          description: "There was an error saving your settings.",
        });
      }
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure API keys and brand details.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card className="border-t-4 border-t-indigo-500 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>Required for scraping and emailing.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldAlert className="w-4 h-4 text-indigo-500" />
                    Google Search Setup
                  </div>
                  {settings?.googleSearchApiKey ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Configured</Badge>
                  ) : (
                    <Badge variant="secondary">Missing</Badge>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="googleSearchApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Custom Search API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="AIzaSy..." {...field} className="font-mono bg-white" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="googleSearchEngineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Engine ID (cx)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="1234567890abcdef..." {...field} className="font-mono bg-white" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    Brevo Setup
                  </div>
                  {settings?.brevoApiKey ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Configured</Badge>
                  ) : (
                    <Badge variant="secondary">Missing</Badge>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="brevoApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brevo API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="xkeysib-..." {...field} className="font-mono bg-white" />
                      </FormControl>
                      <FormDescription>Used for sending cold email sequences.</FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>How you appear to prospects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="brandName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand / Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Email Signature</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="signatureName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="signatureTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="CEO & Founder" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="signatureText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sign-off Text</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Best regards," {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-6 flex justify-end">
              <Button type="submit" size="lg" disabled={updateSettings.isPending} className="min-w-[120px]">
                {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Settings
              </Button>
            </CardFooter>
          </Card>

        </form>
      </Form>
    </div>
  );
}
