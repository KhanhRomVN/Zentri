import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Chrome, Facebook, Instagram, ShieldCheck, Music, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RegisSidebar from './components/RegisSidebar';
import RegisGridView from './components/RegisGridView';
import RegisAccountTable from './components/RegisAccountTable';
import { Breadcrumb, BreadcrumbItem } from '../../shared/components/ui/breadcumb';
import { Drawer } from '../../shared/components/ui/drawer';
import Input from '../../shared/components/ui/input/Input';

export type ServiceType = {
  id: string;
  name: string;
  domain: string;
  color: string;
  count: number;
  icon?: any;
};

export type BatchType = {
  id: string;
  serviceId: string;
  name: string;
  createdAt: string;
  accountCount: number;
  successCount: number;
  failedCount: number;
  ageDays: number;
  sessionID: string;
};

const DEFAULT_SERVICES: ServiceType[] = [
  { id: 'google', name: 'Google', domain: 'google.com', color: '#4285F4', count: 0, icon: Chrome },
  {
    id: 'facebook',
    name: 'Facebook',
    domain: 'facebook.com',
    color: '#1877F2',
    count: 0,
    icon: Facebook,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    domain: 'instagram.com',
    color: '#E4405F',
    count: 0,
    icon: Instagram,
  },
];

const PRESET_COLORS = [
  '#4285F4',
  '#1877F2',
  '#E4405F',
  '#22C55E',
  '#F59E0B',
  '#6366F1',
  '#EC4899',
  '#06B6D4',
  '#64748B',
  '#090909',
  '#FF4B2B',
  '#A855F7',
  '#F43F5E',
  '#10B981',
  '#3B82F6',
  '#F97316',
  '#2DD4BF',
  '#FACC15',
  '#60A5FA',
  '#C084FC',
  '#FB7185',
  '#4ADE80',
  '#0EA5E9',
  '#D946EF',
  '#84CC16',
  '#FB923C',
  '#22D3EE',
  '#818CF8',
  '#A78BFA',
  '#F472B6',
];

const RegisManager = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceType[]>(DEFAULT_SERVICES);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchType | null>(null);

  // Drawer State
  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    domain: '',
    color: PRESET_COLORS[0],
  });

  const selectedService = services.find((s) => s.id === selectedServiceId);

  const handleAddService = () => {
    if (!serviceForm.name || !serviceForm.domain) return;

    const newService: ServiceType = {
      id: serviceForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: serviceForm.name,
      domain: serviceForm.domain,
      color: serviceForm.color,
      count: 0,
      icon: Chrome,
    };

    setServices([...services, newService]);
    setIsServiceDrawerOpen(false);
    setServiceForm({ name: '', domain: '', color: PRESET_COLORS[0] });
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
    setSelectedServiceId(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative selection:bg-primary/10">
      {/* Top Navbar - Standardized with Email module style */}
      <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
        <div className="flex items-center gap-4">
          <Breadcrumb className="mb-0" size={120}>
            <BreadcrumbItem
              icon={LayoutGrid}
              className="hover:text-foreground text-muted-foreground/50 transition-colors"
              text={''}
              onClick={() => {
                setSelectedServiceId(null);
                setSelectedBatch(null);
              }}
            />
            <BreadcrumbItem
              text={t('common.regis')}
              onClick={() => {
                setSelectedServiceId(null);
                setSelectedBatch(null);
              }}
            />
            {selectedService && (
              <BreadcrumbItem text={selectedService.name} onClick={() => setSelectedBatch(null)} />
            )}
            {selectedBatch && <BreadcrumbItem text={selectedBatch.name} />}
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Section */}
        <RegisSidebar
          services={services}
          selectedServiceId={selectedServiceId}
          onSelectService={(id) => {
            setSelectedServiceId(id);
            setSelectedBatch(null);
          }}
          onOpenAddService={() => setIsServiceDrawerOpen(true)}
        />

        {/* Main Content Section */}
        <div className="flex-1 flex flex-col min-w-0 bg-card/5 backdrop-blur-sm relative z-10 transition-all duration-500">
          <main className="flex-1 overflow-y-auto custom-scrollbar relative text-foreground">
            <AnimatePresence mode="wait">
              {!selectedBatch ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col"
                >
                  <RegisGridView
                    selectedService={selectedService}
                    onSelectBatch={setSelectedBatch}
                    onDeleteService={handleDeleteService}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="table"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full p-6"
                >
                  <RegisAccountTable batch={selectedBatch} onBack={() => setSelectedBatch(null)} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Add Service Drawer */}
      <Drawer
        isOpen={isServiceDrawerOpen}
        onClose={() => setIsServiceDrawerOpen(false)}
        direction="right"
        width={400}
        title="Add Service Node"
        subtitle="Provision a new registration target"
        footerActions={
          <div className="flex gap-3 w-full p-4 border-t border-border bg-card/50">
            <button
              onClick={() => setIsServiceDrawerOpen(false)}
              className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-semibold border border-border text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleAddService}
              disabled={!serviceForm.name || !serviceForm.domain}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold text-xs shadow-lg shadow-primary/10 disabled:opacity-50"
            >
              Provision Node
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-8 h-full overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                Service Name
              </label>
              <Input
                placeholder="e.g. Google"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                Domain URL
              </label>
              <Input
                placeholder="e.g. google.com"
                value={serviceForm.domain}
                onChange={(e) => setServiceForm({ ...serviceForm, domain: e.target.value })}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              Color Identity
            </label>
            <div className="grid grid-cols-6 gap-2 bg-muted/20 p-4 rounded-2xl border border-border/50">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setServiceForm({ ...serviceForm, color })}
                  className="group relative aspect-square rounded-full transition-all active:scale-95 border border-white/5"
                  style={{ backgroundColor: color }}
                >
                  {serviceForm.color === color && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full scale-110 ring-2 ring-primary transition-all">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default RegisManager;
