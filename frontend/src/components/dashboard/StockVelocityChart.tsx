import { useMemo, useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { StockTransaction } from '../../types/inventory';
import { Activity } from 'lucide-react';

interface Props {
  transactions: StockTransaction[];
}

export function StockVelocityChart({ transactions }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const sorted = [...transactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let currentLevel = 0;
    return sorted.map((t) => {
      currentLevel += t.quantityChange;
      return {
        time: new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: 'numeric'
        }).format(new Date(t.createdAt)),
        quantity: currentLevel,
      };
    });
  }, [transactions]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-full flex flex-col min-h-[500px]">
      <div className="flex justify-between items-center mb-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-900 leading-none">Stock Velocity</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">Net Inventory Flow</p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[400px] relative">
        {isMounted && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                fontSize={10}
                tickMargin={15}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontWeight: 800 }}
              />
              <YAxis
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                tick={{ fill: '#94a3b8', fontWeight: 800 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px 16px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}
                labelStyle={{ fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}
              />
              <Area
                type="monotone"
                dataKey="quantity"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorQty)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : !isMounted ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-pulse text-slate-400 text-xs font-black uppercase tracking-widest">Initialising Chart...</div>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
             <div className="text-slate-400 text-xs font-black uppercase tracking-widest">No activity data yet</div>
          </div>
        )}
      </div>
    </div>
  );
}