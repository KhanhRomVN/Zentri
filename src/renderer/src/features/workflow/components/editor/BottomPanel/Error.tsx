import { AlertCircle, Layers } from 'lucide-react';
import type { WorkflowNode } from '../../../types';

interface ValidationErrors {
  unconfiguredNodes: string[];
  duplicateEdges: string[];
}

interface ErrorProps {
  errors: ValidationErrors;
  nodes: WorkflowNode[];
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

export const Error = ({ errors, nodes, onNodeClick, onEdgeClick }: ErrorProps) => {
  const totalErrors = errors.unconfiguredNodes.length + errors.duplicateEdges.length;

  const getNodeTitle = (nodeId: string): string => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return nodeId;
    return node.title || node.type || nodeId;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">
            {totalErrors} {totalErrors === 1 ? 'error' : 'errors'}
          </span>
        </div>
      </div>

      {/* Error Content */}
      <div className="overflow-y-auto flex-1 p-4">
        {totalErrors === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-success/30 mx-auto mb-3" />
              <div className="text-sm text-text-secondary">No errors found in workflow</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unconfigured Nodes */}
            {errors.unconfiguredNodes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-warning" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Unconfigured Nodes ({errors.unconfiguredNodes.length})
                  </h3>
                </div>
                <div className="space-y-1">
                  {errors.unconfiguredNodes.map((nodeId) => (
                    <button
                      key={nodeId}
                      onClick={() => onNodeClick?.(nodeId)}
                      className="w-full text-left px-3 py-2 rounded bg-warning/10 border border-warning/20 hover:bg-warning/20 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-text-primary font-medium">
                            {getNodeTitle(nodeId)}
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            Node ID: {nodeId} - Missing configuration (title or action data)
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Duplicate Edges */}
            {errors.duplicateEdges.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-error" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Invalid Connections ({errors.duplicateEdges.length})
                  </h3>
                </div>
                <div className="space-y-1">
                  {errors.duplicateEdges.map((edgeId) => (
                    <button
                      key={edgeId}
                      onClick={() => onEdgeClick?.(edgeId)}
                      className="w-full text-left px-3 py-2 rounded bg-error/10 border border-error/20 hover:bg-error/20 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-text-primary font-medium">
                            Duplicate Connection
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            Connection ID: {edgeId} - Multiple edges from same source handle
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
