import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListDecisions, useCreateDecision, useDeleteDecision, getListDecisionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GitBranch, Plus, Search, Trash2, ShieldAlert, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const decisionSchema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  reasoning: z.string().min(1, "Required"),
  impact: z.string().min(1, "Required"),
  outcome: z.string().optional()
});

export default function Decisions() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: decisions, isLoading } = useListDecisions({ search: search || undefined });
  const createDec = useCreateDecision();
  const deleteDec = useDeleteDecision();

  const form = useForm<z.infer<typeof decisionSchema>>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { title: "", description: "", reasoning: "", impact: "medium", outcome: "" }
  });

  const onSubmit = (data: z.infer<typeof decisionSchema>) => {
    createDec.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDecisionsQueryKey() });
          setIsOpen(false);
          form.reset();
          toast({ title: "Decision Logged", description: "Neural branch successfully recorded." });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteDec.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDecisionsQueryKey() });
        toast({ title: "Branch Pruned", description: "Decision removed from the core." });
      }
    });
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default: return "bg-white/10 text-muted-foreground border-white/20";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <GitBranch className="w-8 h-8 text-yellow-500" /> Decision Tree
            </h1>
            <p className="text-muted-foreground">Map choices, reasoning, and their resulting impact ripples.</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-[0_0_15px_rgba(202,138,4,0.5)]">
                <Plus className="mr-2 w-4 h-4" /> Log Branch
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Log Neural Branch (Decision)</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Decision Point</FormLabel><FormControl><Input placeholder="e.g. Accept new job offer" className="bg-black/50" {...field} /></FormControl></FormItem>
                  )} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Context</FormLabel><FormControl><Textarea className="bg-black/50 h-24" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="reasoning" render={({ field }) => (
                      <FormItem><FormLabel>Reasoning</FormLabel><FormControl><Textarea className="bg-black/50 h-24" {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="impact" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Impact</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-black/50"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent className="bg-popover border-white/10">
                            <SelectItem value="low">Low (Reversible)</SelectItem>
                            <SelectItem value="medium">Medium (Moderate)</SelectItem>
                            <SelectItem value="high">High (Life-altering)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="outcome" render={({ field }) => (
                      <FormItem><FormLabel>Outcome (if known)</FormLabel><FormControl><Input className="bg-black/50" {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white mt-4" disabled={createDec.isPending}>
                    {createDec.isPending ? "Logging..." : "Commit to Tree"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </header>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search decisions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 glass-panel bg-black/20 border-white/10 focus-visible:ring-yellow-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl bg-white/5" />
            ))
          ) : decisions?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground glass-panel rounded-xl">
              No decisions recorded.
            </div>
          ) : (
            decisions?.map((decision, i) => (
              <motion.div
                key={decision.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-panel border-white/10 h-full flex flex-col hover:border-yellow-500/50 transition-colors group">
                  <CardHeader className="pb-2 border-b border-white/5 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className={`${getImpactColor(decision.impact)} uppercase tracking-wider text-[10px]`}>
                        {decision.impact} Impact
                      </Badge>
                      <button 
                        onClick={() => handleDelete(decision.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <CardTitle className="text-xl">{decision.title}</CardTitle>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {format(new Date(decision.createdAt), "MMM d, yyyy")}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Context
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {decision.description}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Reasoning
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-yellow-500/30 pl-3">
                        {decision.reasoning}
                      </p>
                    </div>
                  </CardContent>
                  {decision.outcome && (
                    <CardFooter className="pt-4 pb-4 border-t border-white/5 bg-black/20">
                      <div className="w-full">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Actual Outcome:</span>
                        <p className="text-sm">{decision.outcome}</p>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}