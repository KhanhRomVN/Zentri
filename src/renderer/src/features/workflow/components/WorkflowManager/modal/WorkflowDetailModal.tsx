import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../../components/ui/Modal';
import { Button } from '../../../../../components/ui/Button';
import type { Workflow } from '../../../types';
import { STATUS_META, DEVICE_TYPE_META } from '../../../constants';

interface WorkflowDetailModalProps {
  workflow: Workflow;
  open: boolean;
  onClose: () => void;
  onOpenEditor: () => void;
}

export const WorkflowDetailModal = ({
  workflow,
  open,
  onClose,
  onOpenEditor,
}: WorkflowDetailModalProps) => {
  const status = STATUS_META[workflow.status];
  const device = DEVICE_TYPE_META[workflow.deviceType];

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl">
      <ModalHeader
        title={workflow.name}
        description={workflow.description || 'Workflow details'}
        onClose={onClose}
      />

      <ModalBody>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold"
              style={{ background: status.bg, color: status.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
              {status.label}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold"
              style={{ background: device.bg, color: device.color }}
            >
              {device.label}
            </span>
            <span className="text-[10px] text-text-secondary">
              {workflow.owner.name} · {workflow.tags.map((t) => `#${t}`).join(' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-card-background p-3">
              <div className="text-[10px] uppercase text-text-secondary">Nodes</div>
              <div className="mt-1 text-base font-semibold text-text-primary">
                {workflow.nodes.length}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card-background p-3">
              <div className="text-[10px] uppercase text-text-secondary">Success Rate</div>
              <div className="mt-1 text-base font-semibold text-text-primary">
                {workflow.successRate}%
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card-background p-3">
              <div className="text-[10px] uppercase text-text-secondary">Last Run</div>
              <div className="mt-1 text-base font-semibold text-text-primary">
                {workflow.lastRun.time}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card-background p-3">
              <div className="text-[10px] uppercase text-text-secondary">Runs</div>
              <div className="mt-1 text-base font-semibold text-text-primary">
                {workflow.history.length}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold text-text-primary">Danh sách nodes</h3>
            <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-lg border border-border bg-card-background p-3">
              {workflow.nodes.length === 0 ? (
                <div className="text-xs text-text-secondary">Chưa có node nào.</div>
              ) : (
                workflow.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 bg-sidebar-item-hover/40"
                  >
                    <span className="text-[10px] text-text-secondary">{node.type}</span>
                    <span className="text-xs text-text-primary truncate">
                      {node.title || node.subtitle || '(chưa đặt tên)'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
        <Button variant="solid" onClick={onOpenEditor}>
          Mở Workflow Editor
        </Button>
      </ModalFooter>
    </Modal>
  );
};