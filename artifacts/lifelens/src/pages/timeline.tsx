import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListTimelineEvents, useCreateTimelineEvent, getListTimelineEventsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, Plus, Star, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const eventSchema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  eventType: z.string().min(1, "Required"),
  date: z.string().min(1, "Required"),
  milestone: z.boolean().default(false),
});

export default function Timeline() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events, isLoading } = useListTimelineEvents();
  const createEvent = useCreateTimelineEvent();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: "", description: "", eventType: "life", date: new Date().toISOString().split("T")[0], milestone: false }
  });

  const onSubmit = (data: z.infer<typeof eventSchema>) => {
    createEvent.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTimelineEventsQueryKey() });
          setIsOpen(false);
          form.reset();
          toast({ title: "Event Added", description: "Timeline successfully updated." });
        }
      }
    );
  };

  // Group and sort events
  const sortedEvents = events?.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Clock className="w-8 h-8 text-secondary" /> Chronological Core
            </h1>
            <p className="text-muted-foreground">The sequential fabric of your recorded experiences.</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary text-white hover:bg-secondary/90 glow-purple">
                <Plus className="mr-2 w-4 h-4" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Timeline Event</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input className="bg-black/50" {...field} /></FormControl></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" className="bg-black/50" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="eventType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-black/50"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent className="bg-popover border-white/10">
                            <SelectItem value="life">Life</SelectItem>
                            <SelectItem value="career">Career</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="bg-black/50 h-20" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="milestone" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4 bg-black/20">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-secondary" />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark as Milestone</FormLabel>
                        <p className="text-xs text-muted-foreground">Highlight this as a major turning point.</p>
                      </div>
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-white" disabled={createEvent.isPending}>
                    {createEvent.isPending ? "Logging..." : "Log Event"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </header>

        {/* Timeline Visualization */}
        <div className="relative pt-8 pb-12">
          {/* Main vertical line */}
          <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-secondary/50 to-primary/0" />

          {isLoading ? (
            <div className="space-y-12">
              {[1,2,3].map(i => (
                <div key={i} className="flex flex-col md:flex-row items-center w-full gap-8">
                  <Skeleton className="w-full md:w-1/2 h-32 bg-white/5" />
                </div>
              ))}
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground glass-panel rounded-xl">
              No timeline events recorded. Your chronological core is empty.
            </div>
          ) : (
            <div className="space-y-12">
              {sortedEvents.map((event, index) => {
                const isEven = index % 2 === 0;
                
                return (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className={`relative flex flex-col md:flex-row items-center w-full ${isEven ? 'md:flex-row-reverse' : ''}`}
                  >
                    {/* Center Node */}
                    <div className="absolute left-[27px] md:left-1/2 w-4 h-4 rounded-full bg-background border-2 border-secondary transform -translate-x-1/2 flex items-center justify-center z-10 shadow-[0_0_10px_rgba(var(--secondary),0.5)]">
                      {event.milestone && (
                        <motion.div 
                          className="w-full h-full rounded-full border border-secondary"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>

                    {/* Content Card */}
                    <div className="w-full md:w-1/2 pl-16 md:pl-0">
                      <div className={`md:w-[90%] ${isEven ? 'md:ml-auto md:mr-0' : 'md:mr-auto md:ml-0'}`}>
                        <div className={`glass-panel p-6 rounded-2xl border ${event.milestone ? 'border-secondary/50 glow-purple bg-secondary/5' : 'border-white/10'} relative overflow-hidden group`}>
                          
                          {event.milestone && (
                            <Star className="absolute top-4 right-4 w-5 h-5 text-secondary opacity-50" />
                          )}
                          
                          <div className="flex flex-col mb-2">
                            <span className="text-sm font-mono text-secondary mb-1">
                              {format(new Date(event.date), "MMMM d, yyyy")}
                            </span>
                            <h3 className="text-xl font-bold">{event.title}</h3>
                          </div>
                          
                          <p className="text-muted-foreground text-sm mt-3">
                            {event.description}
                          </p>
                          
                          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground bg-white/5 px-2 py-1 rounded">
                              {event.eventType}
                            </span>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs hover:bg-white/10">
                              View Links <ArrowRight className="ml-1 w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}