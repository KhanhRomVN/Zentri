/**
 * Get CSS color classes for log level
 */
export function getLevelColor(level: string): string {
  switch (level) {
    case 'node_start':
      return 'text-blue-400';
    case 'node_end':
      return 'text-green-400';
    case 'info':
      return 'text-primary';
    case 'success':
      return 'text-success';
    case 'error':
      return 'text-error';
    case 'warning':
      return 'text-warning';
    default:
      return 'text-text-secondary';
  }
}

/**
 * Get CSS background classes for log level
 */
export function getLevelBg(level: string): string {
  switch (level) {
    case 'node_start':
      return 'bg-blue-500/20 border-l-4 border-blue-500';
    case 'node_end':
      return 'bg-green-500/20 border-l-4 border-green-500';
    case 'info':
      return 'bg-primary/10';
    case 'success':
      return 'bg-success/10';
    case 'error':
      return 'bg-error/10';
    case 'warning':
      return 'bg-warning/10';
    default:
      return 'bg-sidebar-item-hover';
  }
}

/**
 * Get display label for log level
 */
export function getLevelLabel(level: string): string {
  switch (level) {
    case 'node_start':
      return 'START';
    case 'node_end':
      return 'END';
    default:
      return level.toUpperCase();
  }
}

/**
 * Check if level is a node marker
 */
export function isNodeMarker(level: string): boolean {
  return level === 'node_start' || level === 'node_end';
}

/**
 * Get color classes for workflow run status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
    case 'completed':
      return 'text-success bg-success/10 border-success/30';
    case 'failed':
      return 'text-error bg-error/10 border-error/30';
    case 'running':
      return 'text-primary bg-primary/10 border-primary/30 animate-pulse';
    default:
      return 'text-text-secondary bg-sidebar-item-hover border-border';
  }
}
