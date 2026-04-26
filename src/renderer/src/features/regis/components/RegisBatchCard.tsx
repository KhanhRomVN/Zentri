import { FC } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Zap, Skull, Hash } from 'lucide-react';
import { BatchType } from '../index';

interface RegisBatchCardProps {
  batch: BatchType;
  onClick: () => void;
}

const RegisBatchCard: FC<RegisBatchCardProps> = ({ batch, onClick }) => {
  const successRate = Math.round((batch.successCount / batch.accountCount) * 100);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="group bg-card/60 backdrop-blur-2xl border border-border/50 rounded-[32px] p-6 cursor-pointer hover:shadow-2xl hover:shadow-primary/5 transition-all overflow-hidden relative"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] -z-10 group-hover:bg-primary/10 transition-all duration-500" />

      {/* Header: Batch Name & Status */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex flex-col gap-1.5 min-w-0">
          <h3 className="text-[15px] font-black text-foreground group-hover:text-primary transition-colors truncate pr-2">
            {batch.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
              Live Transmission
            </span>
          </div>
        </div>
        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black tracking-widest uppercase">
          {successRate}%
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-muted/40 rounded-2xl flex flex-col gap-2 group-hover:bg-muted/60 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground/50">
            <Users className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Population</span>
          </div>
          <span className="text-xl font-black text-foreground tabular-nums">
            {batch.accountCount}
          </span>
        </div>

        <div className="p-4 bg-muted/40 rounded-2xl flex flex-col gap-2 group-hover:bg-muted/60 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground/50">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Maturation</span>
          </div>
          <span className="text-xl font-black text-foreground tabular-nums">{batch.ageDays}d</span>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="space-y-4 mb-8">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest px-1">
            <div className="flex items-center gap-2 text-emerald-400">
              <Zap className="w-3 h-3" />
              <span>Success Nodes</span>
            </div>
            <span className="text-foreground">{batch.successCount}</span>
          </div>
          <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000"
              style={{ width: `${(batch.successCount / batch.accountCount) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest px-1">
            <div className="flex items-center gap-2 text-rose-400">
              <Skull className="w-3 h-3" />
              <span>Decommissioned</span>
            </div>
            <span className="text-foreground">{batch.failedCount}</span>
          </div>
          <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-1000"
              style={{ width: `${(batch.failedCount / batch.accountCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50 text-muted-foreground/40">
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black font-mono tracking-tighter uppercase">
            {batch.sessionID}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-tighter">
          {new Date(batch.createdAt).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
};

export default RegisBatchCard;
