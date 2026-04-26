import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ZapOff, Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] delay-700 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full text-center relative z-10"
      >
        <div className="relative inline-block mb-8">
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 0],
              y: [0, -5, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="p-6 bg-card/40 backdrop-blur-2xl rounded-3xl border border-border/50 shadow-2xl relative z-10"
          >
            <ZapOff className="w-16 h-16 text-primary" />
          </motion.div>
          {/* Glowing ring */}
          <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl -z-10 animate-pulse" />
        </div>

        <h1 className="text-8xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/40 leading-none">
          404
        </h1>

        <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-foreground mb-4">
          Node Unreachable
        </h2>

        <p className="text-muted-foreground text-sm mb-10 max-w-[280px] mx-auto leading-relaxed">
          The transmission has been terminated. The sector you are looking for does not exist or has
          been decommissioned.
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/">
            <button className="w-full h-12 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group active:scale-95 shadow-lg shadow-primary/20">
              <Home className="w-4 h-4" />
              Return to Nexus
            </button>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full h-12 bg-card/40 backdrop-blur-md border border-border text-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-card/60 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Sector
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
