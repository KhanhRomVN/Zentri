import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  DollarSign,
  Activity,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';

const data = [
  { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
  { name: 'Aug', uv: 2490, pv: 4300, amt: 2100 },
  { name: 'Sep', uv: 3490, pv: 4300, amt: 2100 },
  { name: 'Oct', uv: 2340, pv: 3800, amt: 2500 },
  { name: 'Nov', uv: 3190, pv: 4300, amt: 2100 },
  { name: 'Dec', uv: 3490, pv: 4300, amt: 2100 },
];

const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
}) => (
  <div className="p-6 rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-bold">{value}</span>
      <span
        className={cn(
          'text-xs flex items-center gap-0.5',
          trend === 'up' ? 'text-emerald-500' : 'text-rose-500',
        )}
      >
        {change}
        {trend === 'up' ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
      </span>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="text-sm text-muted-foreground">Overview</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$45,231.89"
          change="+20.1%"
          trend="up"
          icon={DollarSign}
        />
        <StatCard title="Subscriptions" value="+2350" change="+180.1%" trend="up" icon={Users} />
        <StatCard title="Sales" value="+12,234" change="+19%" trend="up" icon={ShoppingCart} />
        <StatCard title="Active Now" value="+573" change="+201" trend="up" icon={Activity} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-6">Revenue Over Time</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area
                  type="monotone"
                  dataKey="uv"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUv)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-3 rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-6">Recent Sales</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  OM
                </div>
                <div className="space-y-1 overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate">Olivia Martin</p>
                  <p className="text-xs text-muted-foreground truncate">olivia.martin@email.com</p>
                </div>
                <div className="ml-auto font-medium text-sm">+$1,999.00</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
