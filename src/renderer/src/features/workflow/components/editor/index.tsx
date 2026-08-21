import { ReactFlowProvider } from '@xyflow/react';
import CanvasEditor from './CanvasEditor';
import type { Workflow } from '../../types';

interface CanvasEditorProps {
  workflow: Workflow;
  onUpdateWorkflow: (updates: Partial<Workflow>) => void;
  onBack: () => void;
}

const CanvasEditorWrapper = (props: CanvasEditorProps) => {
  return (
    <ReactFlowProvider>
      <CanvasEditor {...props} />
    </ReactFlowProvider>
  );
};

export default CanvasEditorWrapper;
