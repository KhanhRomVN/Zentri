import { memo, useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Smartphone,
  Mail,
  Globe,
  Lock,
  Database,
  CreditCard,
  User,
  Tag,
} from 'lucide-react';
import { Account, ServiceItem, ProfileMetadata } from '../../mock/accounts';
import { cn } from '../../../../../shared/lib/utils';

interface DiagramTabProps {
  account: Account;
  services?: ServiceItem[];
  profiles?: ProfileMetadata[];
}

interface NodeData {
  id: string;
  label: string;
  type: 'email' | '2fa' | 'service' | 'secret' | 'property';
  icon?: string;
  color?: string;
  val?: number;
}

interface LinkData {
  source: string;
  target: string;
  label?: string;
}

const DiagramTab = memo(({ account, services = [], profiles: _profiles }: DiagramTabProps) => {
  const fgRef = useRef<any>();

  // Filter services for this account
  const accountServices = useMemo(
    () => services.filter((s) => s.emailId === account.id),
    [services, account.id],
  );

  // Get 2FA methods for this email
  const email2FAMethods = useMemo(() => {
    return account.twoFactorMethods || [];
  }, [account.twoFactorMethods]);

  // Build nodes and links for the graph
  const graphData = useMemo(() => {
    const nodes: NodeData[] = [];
    const links: LinkData[] = [];

    // Central Email Node
    nodes.push({
      id: account.id,
      label: account.email,
      type: 'email',
      color: '#3b82f6',
      val: 30,
    });

    // Email Properties Node (grouped)
    const propertiesNodeId = `${account.id}-properties`;
    nodes.push({
      id: propertiesNodeId,
      label: 'Properties',
      type: 'property',
      color: '#8b5cf6',
      val: 20,
    });
    links.push({
      source: account.id,
      target: propertiesNodeId,
      label: 'has',
    });

    // 2FA Methods Nodes
    email2FAMethods.forEach((method) => {
      const methodNodeId = `${account.id}-2fa-${method.id}`;
      const typeConfig = get2FATypeConfig(method.type);

      nodes.push({
        id: methodNodeId,
        label: `${typeConfig.label}`,
        type: '2fa',
        color: typeConfig.color,
        val: 18,
      });

      links.push({
        source: account.id,
        target: methodNodeId,
        label: 'protected by',
      });
    });

    // Linked Services Nodes
    accountServices.forEach((service) => {
      const serviceNodeId = service.id;
      const serviceConfig = getServiceTypeConfig(service);

      nodes.push({
        id: serviceNodeId,
        label: service.serviceProviderId,
        type: 'service',
        color: serviceConfig.color,
        val: 22,
      });

      links.push({
        source: account.id,
        target: serviceNodeId,
        label: 'linked to',
      });

      // Service 2FA Methods
      if (service.twoFactorMethods && service.twoFactorMethods.length > 0) {
        service.twoFactorMethods.forEach((svc2fa) => {
          const svc2faNodeId = `${service.id}-2fa-${svc2fa.id}`;
          const typeConfig = get2FATypeConfig(svc2fa.type);

          nodes.push({
            id: svc2faNodeId,
            label: `2FA ${svc2fa.type}`,
            type: '2fa',
            color: typeConfig.color,
            val: 15,
          });

          links.push({
            source: serviceNodeId,
            target: svc2faNodeId,
            label: 'protected by',
          });
        });
      }

      // Service Secret Keys
      if (service.secretKeys && service.secretKeys.length > 0) {
        service.secretKeys.forEach((secret) => {
          const secretNodeId = `${service.id}-secret-${secret.id}`;

          nodes.push({
            id: secretNodeId,
            label: secret.key.substring(0, 12) + '...',
            type: 'secret',
            color: '#f59e0b',
            val: 12,
          });

          links.push({
            source: serviceNodeId,
            target: secretNodeId,
            label: 'has',
          });
        });
      }
    });

    return { nodes, links };
  }, [account, accountServices, email2FAMethods]);

  // Custom node rendering with icons
  const renderNode = (node: NodeData, ctx: CanvasRenderingContext2D) => {
    const { label, color, val = 20 } = node;
    const radius = val;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = `${color}40`;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw label
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = label.length > 15 ? [label.substring(0, 13) + '...', label.substring(13, 26)] : [label];
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * 12);
    });
  };

  return (
    <div className="h-full flex flex-col bg-background/50 relative overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">Account Diagram</h2>
        <p className="text-xs text-muted-foreground">
          Visual representation of {account.email} and its relationships
        </p>
      </div>

      {/* Graph Container */}
      <div className="flex-1 relative overflow-hidden">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="label"
          nodeColor={(node: NodeData) => node.color || '#3b82f6'}
          nodeVal={(node: NodeData) => node.val || 20}
          linkLabel="label"
          linkColor={() => '#4b5563'}
          linkWidth={1.5}
          backgroundColor="transparent"
          nodeCanvasObject={renderNode}
          onNodeClick={(node: NodeData) => {
            console.log('Node clicked:', node);
          }}
          cooldownTicks={100}
          warmupTicks={100}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-background/90 backdrop-blur-sm border border-border shadow-lg">
          <h3 className="text-xs font-semibold text-foreground mb-2">Legend</h3>
          <div className="space-y-1.5">
            <LegendItem color="#3b82f6" label="Email Account" />
            <LegendItem color="#8b5cf6" label="Properties" />
            <LegendItem color="#10b981" label="2FA Method" />
            <LegendItem color="#f97316" label="Linked Service" />
            <LegendItem color="#f59e0b" label="Secret Key" />
          </div>
        </div>

        {/* Info Panel */}
        <div className="absolute top-4 right-4 p-4 rounded-lg bg-background/90 backdrop-blur-sm border border-border shadow-lg max-w-xs">
          <h3 className="text-sm font-semibold text-foreground mb-3">Account Overview</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>2FA Methods:</span>
              <span className="text-foreground font-medium">{email2FAMethods.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Linked Services:</span>
              <span className="text-foreground font-medium">{accountServices.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Secrets:</span>
              <span className="text-foreground font-medium">
                {accountServices.reduce(
                  (acc, s) => acc + (s.secretKeys?.length || 0),
                  0,
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={cn(
                  'font-medium',
                  account.status === 'active'
                    ? 'text-emerald-500'
                    : 'text-yellow-500',
                )}
              >
                {account.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DiagramTab.displayName = 'DiagramTab';

// Helper functions for type configurations
function get2FATypeConfig(type: string) {
  const configs: Record<string, { color: string; label: string }> = {
    totp: { color: '#10b981', label: 'TOTP' },
    otp_phone: { color: '#f59e0b', label: 'Phone' },
    recovery_email: { color: '#3b82f6', label: 'Recovery' },
    backup_code: { color: '#8b5cf6', label: 'Backup' },
  };
  return configs[type] || { color: '#6b7280', label: 'Unknown' };
}

function getServiceTypeConfig(service: ServiceItem) {
  const category = service.categories?.[0] || 'default';
  const configs: Record<string, { color: string }> = {
    social: { color: '#ec4899' },
    finance: { color: '#22c55e' },
    cloud: { color: '#06b6d4' },
    development: { color: '#f97316' },
    email: { color: '#3b82f6' },
    default: { color: '#f97316' },
  };
  return configs[category] || configs.default;
}

// Legend Item Component
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default DiagramTab;
