import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListMemories, useCreateMemory, useDeleteMemory, getListMemoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Brain, Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const memorySchema = z.object({
  title: z.string().min(1, "Required"),
  content: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
  importance: z.coerce.number().min(1).max(10),
  tags: z.string().optional()
});

export default function Memories() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: memories, isLoading } = useListMemories({ 
    search: search || undefined, 
    category: category !== "all" ? category : undefined 
  });

  const createMem = useCreateMemory();
  const deleteMem = useDeleteMemory();

  const form = useForm<z.infer<typeof memorySchema>>({
    resolver: zodResolver(memorySchema),
    defaultValues: { title: "", content: "", category: "personal", importance: 5, tags: "" }
  });

  const onSubmit = (data: z.infer<typeof memorySchema>) => {
    const tagsArray = data.tags ? data.tags.split(",").map(t => t.trim()).filter(t => t) : [];
    createMem.mutate(
      { data: { ...data, tags: tagsArray } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
          setIsOpen(false);
          form.reset();
          toast({ title: "Memory Stored", description: "Memory successfully encoded in the core." });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMem.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
        toast({ title: "Memory Purged", description: "Memory removed from the core." });
      }
    });
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "work": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "personal": return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "health": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "finance": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "relationship": return "bg-pink-500/20 text-pink-400 border-pink-500/50";
      default: return "bg-primary/20 text-primary border-primary/50";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" /> Memory Archive
            </h1>
            <p className="text-muted-foreground">Retrieve, analyze, and manage encoded experiences.</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 glow-blue text-white">
                <Plus className="mr-2 w-4 h-4" /> Encode Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Encode New Memory</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input className="bg-black/50" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-black/50"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-popover border-white/10">
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="relationship">Relationship</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea className="bg-black/50 h-24" {...field} /></FormControl></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="importance" render={({ field }) => (
                      <FormItem><FormLabel>Importance (1-10)</FormLabel><FormControl><Input type="number" min={1} max={10} className="bg-black/50" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="tags" render={({ field }) => (
                      <FormItem><FormLabel>Tags (comma separated)</FormLabel><FormControl><Input placeholder="e.g. happy, travel" className="bg-black/50" {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMem.isPending}>
                    {createMem.isPending ? "Encoding..." : "Store in Core"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </header>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search neural patterns..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 glass-panel bg-black/20 border-white/10 focus-visible:ring-primary"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px] glass-panel bg-black/20 border-white/10">
              <SelectValue placeholder="Category filter" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-white/10">
              <SelectItem value="all">All Clusters</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="relationship">Relationship</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl bg-white/5" />
            ))
          ) : memories?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground glass-panel rounded-xl">
              No memories found matching your parameters.
            </div>
          ) : (
            memories?.map((memory, i) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-panel border-white/10 h-full flex flex-col hover:border-primary/50 transition-colors group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-20 pointer-events-none rounded-full ${memory.category === 'work' ? 'bg-blue-500' : 'bg-primary'}`} />
                  
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className={getCategoryColor(memory.category)}>
                        {memory.category}
                      </Badge>
                      <button 
                        onClick={() => handleDelete(memory.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <CardTitle className="line-clamp-1">{memory.title}</CardTitle>
                    <CardDescription>{format(new Date(memory.createdAt), "MMM d, yyyy")}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-foreground/80 line-clamp-4 flex-1 mb-4">
                      {memory.content}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {memory.tags?.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
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