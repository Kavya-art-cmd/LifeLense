import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListInsights, useGenerateInsight, getListInsightsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lightbulb, Sparkles, Network } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const insightSchema = z.object({
  insightType: z.string().min(1, "Required"),
  period: z.string().min(1, "Required"),
});

export default function Insights() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: insights, isLoading } = useListInsights();
  const generateInsight = useGenerateInsight();

  const form = useForm<z.infer<typeof insightSchema>>({
    resolver: zodResolver(insightSchema),
    defaultValues: { insightType: "pattern", period: "month" }
  });

  const onSubmit = (data: z.infer<typeof insightSchema>) => {
    generateInsight.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInsightsQueryKey() });
          setIsOpen(false);
          toast({ title: "Insight Synthesized", description: "New neural connection established." });
        }
      }
    );
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pattern": return <Network className="w-5 h-5 text-secondary" />;
      case "growth": return <Sparkles className="w-5 h-5 text-primary" />;
      default: return <Lightbulb className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-green-500" /> Synthesis Engine
            </h1>
            <p className="text-muted-foreground">AI-generated patterns and revelations from your data.</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                <Sparkles className="mr-2 w-4 h-4" /> Synthesize Insight
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate New Insight</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="insightType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Synthesis Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-black/50"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-popover border-white/10">
                          <SelectItem value="pattern">Behavioral Pattern</SelectItem>
                          <SelectItem value="growth">Growth Opportunity</SelectItem>
                          <SelectItem value="warning">Risk Warning</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="period" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Horizon</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-black/50"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-popover border-white/10">
                          <SelectItem value="week">Past Week</SelectItem>
                          <SelectItem value="month">Past Month</SelectItem>
                          <SelectItem value="year">Past Year</SelectItem>
                          <SelectItem value="all_time">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white mt-4" disabled={generateInsight.isPending}>
                    {generateInsight.isPending ? "Synthesizing Neural Data..." : "Generate Insight"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl bg-white/5" />
            ))
          ) : insights?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground glass-panel rounded-xl">
              No insights generated yet. Add more memories to allow the engine to synthesize patterns.
            </div>
          ) : (
            insights?.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-panel border-white/10 h-full hover:border-green-500/50 transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-green-500/20 transition-colors" />
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      {getInsightTypeIcon(insight.insightType)}
                      <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground">{insight.insightType} • {insight.period}</span>
                    </div>
                    <CardTitle className="text-lg leading-tight">{insight.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                      {insight.content}
                    </p>
                    <div className="text-xs text-muted-foreground font-mono">
                      Synthesized: {format(new Date(insight.createdAt), "MMM d, yyyy")}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}