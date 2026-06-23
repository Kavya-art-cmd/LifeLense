import { useGetDashboardSummary, useGetRecentActivity, useGetGrowthData } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Clock, GitBranch, Lightbulb, Activity, Phone } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity();
  const { data: growth, isLoading: isLoadingGrowth } = useGetGrowthData();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Neural Overview</h1>
            <p className="text-muted-foreground">System status and recent developments across your timeline.</p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Total Memories" 
            value={summary?.totalMemories} 
            icon={Brain} 
            color="text-primary" 
            loading={isLoadingSummary} 
          />
          <StatCard 
            title="Decisions Tracked" 
            value={summary?.totalDecisions} 
            icon={GitBranch} 
            color="text-yellow-500" 
            loading={isLoadingSummary} 
          />
          <StatCard 
            title="Growth Score" 
            value={summary?.growthScore} 
            icon={Activity} 
            color="text-green-500" 
            loading={isLoadingSummary} 
          />
          <StatCard 
            title="Insights Generated" 
            value={summary?.totalInsights} 
            icon={Lightbulb} 
            color="text-secondary" 
            loading={isLoadingSummary} 
          />
          <StatCard 
            title="Timeline Events" 
            value={summary?.totalTimelineEvents} 
            icon={Clock} 
            color="text-orange-500" 
            loading={isLoadingSummary} 
          />
          <StatCard 
            title="Voice Sessions" 
            value={summary?.totalCalls} 
            icon={Phone} 
            color="text-blue-400" 
            loading={isLoadingSummary} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Growth Trajectory
            </h2>
            <Card className="glass-panel border-white/10 bg-black/20">
              <CardContent className="p-6">
                {isLoadingGrowth ? (
                  <Skeleton className="w-full h-[300px] bg-white/5" />
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={growth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMemories" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorInsights" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="memories" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMemories)" strokeWidth={2} />
                        <Area type="monotone" dataKey="insights" stroke="hsl(var(--secondary))" fillOpacity={1} fill="url(#colorInsights)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" /> Recent Neural Activity
            </h2>
            <Card className="glass-panel border-white/10 bg-black/20 h-[calc(100%-40px)]">
              <CardContent className="p-0 overflow-y-auto max-h-[350px]">
                {isLoadingActivity ? (
                  <div className="p-6 space-y-4">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="w-full h-16 bg-white/5" />)}
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {activity?.length === 0 && (
                      <div className="p-6 text-center text-muted-foreground">No recent activity detected.</div>
                    )}
                    {activity?.map((item) => (
                      <motion.div 
                        key={item.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-mono text-primary uppercase">{item.type}</span>
                          <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, color, loading }: { title: string, value?: number, icon: any, color: string, loading: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glass-panel border-white/10 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon className={`w-16 h-16 ${color}`} />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-24 bg-white/5" />
          ) : (
            <div className={`text-4xl font-bold ${color} drop-shadow-[0_0_10px_currentColor]`}>
              {value || 0}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}