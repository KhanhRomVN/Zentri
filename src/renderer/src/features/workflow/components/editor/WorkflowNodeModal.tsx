import { memo, useState, useEffect, useCallback } from 'react';
import Modal from '../../../../components/ui/Modal/Modal';
import ModalHeader from '../../../../components/ui/Modal/ModalHeader';
import ModalBody from '../../../../components/ui/Modal/ModalBody';
import ModalFooter from '../../../../components/ui/Modal/ModalFooter';
import { Switch } from '../../../../components/ui/Switch/Switch';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../components/ui/Dropdown';
import { ChevronDown } from 'lucide-react';
import type { WorkflowNode } from '../../types';
import { CATEGORY_META } from '../../constants';
import { ConfirmActionTypeChangeModal } from './ConfirmActionTypeChangeModal';

interface WorkflowNodeModalProps {
  node: WorkflowNode;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<WorkflowNode>) => void;
}

interface NodeConfig {
  url?: string;
  element?: string;
  selectorType?: string;
  config?: {
    action?: string;
    executionMode?: 'sequential' | 'conditional';
    maxRetries?: number;
    skipNotFound?: boolean;
    retryCount?: number;
    delay?: number;
    screenshot?: boolean;
    timeout?: number;
    waitElement?: boolean;
    clickType?: string;
    clearBefore?: boolean;
    typingDelay?: number;
    assertType?: string;
  };
}

export const WorkflowNodeModal = memo(
  ({ node, isOpen, onClose, onUpdate }: WorkflowNodeModalProps) => {
    const [title, setTitle] = useState(node.title);
    const [subtitle, setSubtitle] = useState(node.subtitle);
    const [note, setNote] = useState(node.note || '');
    const [parsedConfig, setParsedConfig] = useState<NodeConfig | null>(null);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [elementBounds, setElementBounds] = useState<any>(null);

    // Action type state
    const [actionType, setActionType] = useState('click');
    const [pendingActionType, setPendingActionType] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    // Config states
    const [selectorType, setSelectorType] = useState('id');
    const [executionMode, setExecutionMode] = useState<'sequential' | 'conditional'>('sequential');
    const [maxRetries, setMaxRetries] = useState(0);
    const [skipNotFound, setSkipNotFound] = useState(false);
    const [retryCount, setRetryCount] = useState(2);
    const [delay, setDelay] = useState(1000); // Default 1 second
    const [timeout, setTimeout] = useState(3000);
    const [waitElement, setWaitElement] = useState(true);
    const [clickType, setClickType] = useState('Left click');
    const [clearBefore, setClearBefore] = useState(true);
    const [typingDelay, setTypingDelay] = useState(50);
    const [assertType, setAssertType] = useState('Is Visible');

    // Track initial values to detect changes
    const [initialValues, setInitialValues] = useState<any>(null);

    useEffect(() => {
      if (isOpen) {
        setTitle(node.title);
        setSubtitle(node.subtitle);
        setNote(node.note || '');

        // Parse config from note if it's JSON
        try {
          const parsed = JSON.parse(node.note || '{}');
          setParsedConfig(parsed);

          // Extract screenshot and element bounds
          if (parsed.screenshot) {
            setScreenshot(parsed.screenshot);
          }
          if (parsed.elementBounds) {
            setElementBounds(parsed.elementBounds);
          }

          // Load config values
          if (parsed.selectorType) setSelectorType(parsed.selectorType);
          if (parsed.config) {
            const cfg = parsed.config;
            if (cfg.action) setActionType(cfg.action);
            if (cfg.executionMode) setExecutionMode(cfg.executionMode);
            if (typeof cfg.maxRetries === 'number') setMaxRetries(cfg.maxRetries);
            if (typeof cfg.skipNotFound === 'boolean') setSkipNotFound(cfg.skipNotFound);
            if (typeof cfg.retryCount === 'number') setRetryCount(cfg.retryCount);
            if (typeof cfg.delay === 'number') setDelay(cfg.delay);
            if (typeof cfg.timeout === 'number') setTimeout(cfg.timeout);
            if (typeof cfg.waitElement === 'boolean') setWaitElement(cfg.waitElement);
            if (cfg.clickType) setClickType(cfg.clickType);
            if (typeof cfg.clearBefore === 'boolean') setClearBefore(cfg.clearBefore);
            if (typeof cfg.typingDelay === 'number') setTypingDelay(cfg.typingDelay);
            if (cfg.assertType) setAssertType(cfg.assertType);
          }
        } catch {
          setParsedConfig(null);
          setScreenshot(null);
          setElementBounds(null);
        }

        // Save initial values for change detection
        setInitialValues({
          title: node.title,
          subtitle: node.subtitle,
          note: node.note || '',
        });
      }
    }, [isOpen, node]);

    // Check if current action has any configured values
    const hasConfiguredValues = useCallback(() => {
      // Check if selector has value
      if (subtitle && subtitle.trim() !== '') return true;

      // Check if any config has been changed from defaults
      if (selectorType !== 'id') return true;
      if (executionMode !== 'sequential') return true;
      if (maxRetries !== 0) return true;
      if (skipNotFound !== false) return true;
      if (retryCount !== 2) return true;
      if (delay !== 1000) return true;
      if (timeout !== 3000) return true;
      if (waitElement !== true) return true;
      if (clickType !== 'Left click') return true;
      if (clearBefore !== true) return true;
      if (typingDelay !== 50) return true;
      if (assertType !== 'Is Visible') return true;

      return false;
    }, [
      subtitle,
      selectorType,
      executionMode,
      maxRetries,
      skipNotFound,
      retryCount,
      delay,
      timeout,
      waitElement,
      clickType,
      clearBefore,
      typingDelay,
      assertType,
    ]);

    // Handle action type change with confirmation
    const handleActionTypeChange = useCallback(
      (newActionType: string) => {
        if (newActionType === actionType) return;

        // Check if current action has configured values
        if (hasConfiguredValues()) {
          setPendingActionType(newActionType);
          setShowConfirmDialog(true);
        } else {
          setActionType(newActionType);
        }
      },
      [actionType, hasConfiguredValues],
    );

    // Confirm action type change
    const handleConfirmActionTypeChange = useCallback(() => {
      if (pendingActionType) {
        setActionType(pendingActionType);
        setPendingActionType(null);
      }
      setShowConfirmDialog(false);
    }, [pendingActionType]);

    // Cancel action type change
    const handleCancelActionTypeChange = useCallback(() => {
      setPendingActionType(null);
      setShowConfirmDialog(false);
    }, []);

    // Check if there are unsaved changes
    const hasUnsavedChanges = useCallback(() => {
      if (!initialValues) return false;

      // Build current config
      const currentConfig: NodeConfig = {
        ...parsedConfig,
        selectorType,
        config: {
          ...parsedConfig?.config,
          action: actionType,
          executionMode,
          maxRetries,
          skipNotFound,
          retryCount,
          delay,
          timeout,
          waitElement,
          clickType,
          clearBefore,
          typingDelay,
          assertType,
        },
      };

      const currentNote = JSON.stringify(currentConfig, null, 2);

      return (
        title !== initialValues.title ||
        subtitle !== initialValues.subtitle ||
        currentNote !== initialValues.note
      );
    }, [
      initialValues,
      title,
      subtitle,
      parsedConfig,
      selectorType,
      actionType,
      executionMode,
      maxRetries,
      skipNotFound,
      retryCount,
      delay,
      timeout,
      waitElement,
      clickType,
      clearBefore,
      typingDelay,
      assertType,
    ]);

    // Handle close with unsaved changes check
    const handleClose = useCallback(() => {
      if (hasUnsavedChanges()) {
        setShowUnsavedDialog(true);
      } else {
        onClose();
      }
    }, [hasUnsavedChanges, onClose]);

    // Confirm discard changes
    const handleDiscardChanges = useCallback(() => {
      setShowUnsavedDialog(false);
      onClose();
    }, [onClose]);

    // Cancel close (continue editing)
    const handleCancelClose = useCallback(() => {
      setShowUnsavedDialog(false);
    }, []);

    const handleSave = () => {
      // Build updated config
      const updatedConfig: NodeConfig = {
        ...parsedConfig,
        selectorType,
        config: {
          ...parsedConfig?.config,
          action: actionType, // Save the action type
          executionMode,
          maxRetries,
          skipNotFound,
          retryCount,
          delay,
          timeout,
          waitElement,
          clickType,
          clearBefore,
          typingDelay,
          assertType,
        },
      };

      const updatedNote = JSON.stringify(updatedConfig, null, 2);

      // Determine title based on action type
      let nodeTitle = title;
      if (!title || title.trim() === '') {
        // Auto-generate title based on action type
        const titleMap: Record<string, string> = {
          click: 'Click',
          type: 'Type Text',
          hover: 'Hover',
          scroll: 'Scroll To',
          assert: 'Assert Visible',
          go_to_url: 'Go to URL',
          wait: 'Wait',
          screenshot: 'Take Screenshot',
          extract: 'Extract Text',
          reload: 'Reload Page',
          go_back: 'Go Back',
          go_forward: 'Go Forward',
          close_tab: 'Close Tab',
          new_tab: 'New Tab',
        };
        nodeTitle = titleMap[actionType] || actionType;
      }

      onUpdate(node.id, {
        title: nodeTitle,
        subtitle,
        note: updatedNote,
        executionMode,
        maxRetries,
      });
      onClose();
    };

    const category = CATEGORY_META[node.category];
    const action = parsedConfig?.config?.action || actionType;
    const isInteractNode = node.category === 'interact';

    // Determine which actions need selector
    const needsSelector = ['click', 'type', 'hover', 'scroll', 'assert', 'extract'].includes(
      actionType,
    );
    const needsConfiguration = ['click', 'type', 'assert'].includes(actionType);
    const needsUrlInput = ['go_to_url', 'new_tab'].includes(actionType);

    return (
      <>
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl" hideCloseButton>
          <ModalHeader
            title="Edit Node"
            description={`${category.label} • ${node.type}`}
            onClose={handleClose}
          />
          <ModalBody className="max-h-[70vh] space-y-5 overflow-y-auto">
            {/* Action Type Selector - First */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Action Type
              </label>
              <Dropdown className="w-full" searchable>
                <DropdownTrigger>
                  <button className="w-full flex items-center gap-3 rounded-lg border border-border bg-input-background px-3 py-2 text-sm hover:border-primary transition-colors">
                    {/* Badge Icon */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        actionType === 'click'
                          ? 'bg-blue-500/10'
                          : actionType === 'type'
                            ? 'bg-green-500/10'
                            : actionType === 'hover'
                              ? 'bg-purple-500/10'
                              : actionType === 'scroll'
                                ? 'bg-orange-500/10'
                                : actionType === 'assert'
                                  ? 'bg-emerald-500/10'
                                  : actionType === 'go_to_url'
                                    ? 'bg-cyan-500/10'
                                    : actionType === 'wait'
                                      ? 'bg-amber-500/10'
                                      : actionType === 'screenshot'
                                        ? 'bg-pink-500/10'
                                        : actionType === 'extract'
                                          ? 'bg-indigo-500/10'
                                          : actionType === 'reload'
                                            ? 'bg-teal-500/10'
                                            : actionType === 'go_back'
                                              ? 'bg-slate-500/10'
                                              : actionType === 'go_forward'
                                                ? 'bg-slate-500/10'
                                                : actionType === 'close_tab'
                                                  ? 'bg-red-500/10'
                                                  : actionType === 'new_tab'
                                                    ? 'bg-violet-500/10'
                                                    : 'bg-gray-500/10'
                      }`}
                    >
                      <svg
                        className={`h-4 w-4 ${
                          actionType === 'click'
                            ? 'text-blue-500'
                            : actionType === 'type'
                              ? 'text-green-500'
                              : actionType === 'hover'
                                ? 'text-purple-500'
                                : actionType === 'scroll'
                                  ? 'text-orange-500'
                                  : actionType === 'assert'
                                    ? 'text-emerald-500'
                                    : actionType === 'go_to_url'
                                      ? 'text-cyan-500'
                                      : actionType === 'wait'
                                        ? 'text-amber-500'
                                        : actionType === 'screenshot'
                                          ? 'text-pink-500'
                                          : actionType === 'extract'
                                            ? 'text-indigo-500'
                                            : actionType === 'reload'
                                              ? 'text-teal-500'
                                              : actionType === 'go_back'
                                                ? 'text-slate-500'
                                                : actionType === 'go_forward'
                                                  ? 'text-slate-500'
                                                  : actionType === 'close_tab'
                                                    ? 'text-red-500'
                                                    : actionType === 'new_tab'
                                                      ? 'text-violet-500'
                                                      : 'text-gray-500'
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {actionType === 'click' && <path d="M9 9l6 12 2-6 6-2z" />}
                        {actionType === 'type' && <path d="M4 6h16M4 12h10M4 18h7" />}
                        {actionType === 'hover' && (
                          <>
                            <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                        {actionType === 'scroll' && <path d="M12 5v14M5 12l7 7 7-7" />}
                        {actionType === 'assert' && <path d="M20 6L9 17l-5-5" />}
                        {actionType === 'go_to_url' && (
                          <>
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </>
                        )}
                        {actionType === 'wait' && (
                          <>
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </>
                        )}
                        {actionType === 'screenshot' && (
                          <>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </>
                        )}
                        {actionType === 'extract' && (
                          <>
                            <rect x="4" y="4" width="16" height="6" />
                            <rect x="4" y="14" width="10" height="6" />
                          </>
                        )}
                        {actionType === 'reload' && (
                          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        )}
                        {actionType === 'go_back' && <path d="M19 12H5M12 19l-7-7 7-7" />}
                        {actionType === 'go_forward' && <path d="M5 12h14M12 5l7 7-7 7" />}
                        {actionType === 'close_tab' && <path d="M18 6L6 18M6 6l12 12" />}
                        {actionType === 'new_tab' && <path d="M12 5v14M5 12h14" />}
                      </svg>
                    </div>
                    {/* Text Content */}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-text-primary">
                        {actionType === 'click' && 'Click'}
                        {actionType === 'type' && 'Type Text'}
                        {actionType === 'hover' && 'Hover'}
                        {actionType === 'scroll' && 'Scroll To'}
                        {actionType === 'assert' && 'Assert Visible'}
                        {actionType === 'go_to_url' && 'Go to URL'}
                        {actionType === 'wait' && 'Wait'}
                        {actionType === 'screenshot' && 'Take Screenshot'}
                        {actionType === 'extract' && 'Extract Text'}
                        {actionType === 'reload' && 'Reload Page'}
                        {actionType === 'go_back' && 'Go Back'}
                        {actionType === 'go_forward' && 'Go Forward'}
                        {actionType === 'close_tab' && 'Close Tab'}
                        {actionType === 'new_tab' && 'New Tab'}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {actionType === 'click' && 'Click on element'}
                        {actionType === 'type' && 'Enter text input'}
                        {actionType === 'hover' && 'Mouse over element'}
                        {actionType === 'scroll' && 'Scroll to position'}
                        {actionType === 'assert' && 'Check visibility'}
                        {actionType === 'go_to_url' && 'Visit URL in current tab'}
                        {actionType === 'wait' && 'Pause execution'}
                        {actionType === 'screenshot' && 'Capture page screenshot'}
                        {actionType === 'extract' && 'Extract element content'}
                        {actionType === 'reload' && 'Refresh current page'}
                        {actionType === 'go_back' && 'Navigate backward'}
                        {actionType === 'go_forward' && 'Navigate forward'}
                        {actionType === 'close_tab' && 'Close current tab'}
                        {actionType === 'new_tab' && 'Open new browser tab'}
                      </div>
                    </div>
                    {/* Arrow Icon */}
                    <ChevronDown className="h-4 w-4 text-text-secondary" />
                  </button>
                </DropdownTrigger>
                <DropdownContent className="min-w-[280px]">
                  <DropdownItem
                    onClick={() => handleActionTypeChange('click')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
                      <svg
                        className="h-4 w-4 text-blue-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 9l6 12 2-6 6-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Click</div>
                      <div className="text-xs text-text-secondary">Click on element</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('type')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-500/10">
                      <svg
                        className="h-4 w-4 text-green-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 6h16M4 12h10M4 18h7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Type Text</div>
                      <div className="text-xs text-text-secondary">Enter text input</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('hover')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-500/10">
                      <svg
                        className="h-4 w-4 text-purple-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Hover</div>
                      <div className="text-xs text-text-secondary">Mouse over element</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('scroll')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-orange-500/10">
                      <svg
                        className="h-4 w-4 text-orange-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Scroll To</div>
                      <div className="text-xs text-text-secondary">Scroll to position</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('assert')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
                      <svg
                        className="h-4 w-4 text-emerald-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Assert Visible</div>
                      <div className="text-xs text-text-secondary">Check visibility</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('go_to_url')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/10">
                      <svg
                        className="h-4 w-4 text-cyan-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Go to URL</div>
                      <div className="text-xs text-text-secondary">Visit URL in current tab</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('wait')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
                      <svg
                        className="h-4 w-4 text-amber-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Wait</div>
                      <div className="text-xs text-text-secondary">Pause execution</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('screenshot')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-pink-500/10">
                      <svg
                        className="h-4 w-4 text-pink-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Take Screenshot</div>
                      <div className="text-xs text-text-secondary">Capture page screenshot</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('extract')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-500/10">
                      <svg
                        className="h-4 w-4 text-indigo-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="4" y="4" width="16" height="6" />
                        <rect x="4" y="14" width="10" height="6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Extract Text</div>
                      <div className="text-xs text-text-secondary">Extract element content</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('reload')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-500/10">
                      <svg
                        className="h-4 w-4 text-teal-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Reload Page</div>
                      <div className="text-xs text-text-secondary">Refresh current page</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('go_back')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-500/10">
                      <svg
                        className="h-4 w-4 text-slate-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Go Back</div>
                      <div className="text-xs text-text-secondary">Navigate backward</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('go_forward')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-500/10">
                      <svg
                        className="h-4 w-4 text-slate-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Go Forward</div>
                      <div className="text-xs text-text-secondary">Navigate forward</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('close_tab')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-500/10">
                      <svg
                        className="h-4 w-4 text-red-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">Close Tab</div>
                      <div className="text-xs text-text-secondary">Close current tab</div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleActionTypeChange('new_tab')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-500/10">
                      <svg
                        className="h-4 w-4 text-violet-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">New Tab</div>
                      <div className="text-xs text-text-secondary">Open new browser tab</div>
                    </div>
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>

            {/* Delay After Execution - Always show */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Delay After Execution
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDelay(Math.max(0, delay - 1000))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                >
                  −
                </button>
                <div className="flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-center text-sm font-mono text-text-primary">
                  {delay}ms
                </div>
                <button
                  onClick={() => setDelay(Math.min(10000, delay + 1000))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                >
                  +
                </button>
              </div>
              <div className="mt-1.5 text-xs text-text-tertiary">
                Thời gian chờ sau khi node này thực thi xong, trước khi chuyển sang node tiếp theo
              </div>
            </div>

            {/* URL Input - Show for go_to_url and new_tab */}
            {needsUrlInput && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  URL
                </label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="font-mono w-full rounded-lg border border-border bg-input-background px-3 py-2 text-xs text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="https://example.com"
                />
                <div className="mt-1.5 text-xs text-text-tertiary">
                  {actionType === 'go_to_url'
                    ? 'URL để truy cập trong tab hiện tại'
                    : 'URL để mở trong tab mới'}
                </div>
              </div>
            )}

            {/* Screenshot Preview - Only show if screenshot exists and needs selector */}
            {needsSelector && screenshot && elementBounds && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Visual Preview
                </label>
                <div
                  className="relative bg-background border border-border rounded-lg overflow-hidden"
                  style={{
                    aspectRatio: '16/9',
                  }}
                >
                  <img
                    src={screenshot}
                    alt="Page screenshot"
                    className="w-full h-full object-contain"
                  />
                  {/* Element outline overlay */}
                  <div
                    className="absolute border-2 border-primary bg-primary/10 rounded"
                    style={{
                      left: `${(elementBounds.x / elementBounds.viewportWidth) * 100}%`,
                      top: `${(elementBounds.y / elementBounds.viewportHeight) * 100}%`,
                      width: `${(elementBounds.width / elementBounds.viewportWidth) * 100}%`,
                      height: `${(elementBounds.height / elementBounds.viewportHeight) * 100}%`,
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                <div className="mt-1.5 text-xs text-text-tertiary">
                  Element highlighted in screenshot
                </div>
              </div>
            )}

            {/* Selector - Only show for actions that need it */}
            {needsSelector && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Selector
                  </label>
                  <input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="font-mono w-full rounded-lg border border-border bg-input-background px-3 py-2 text-xs text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="CSS selector, XPath, etc..."
                  />
                </div>
              </div>
            )}

            {isInteractNode && parsedConfig && (
              <>
                {/* Selector Strategy - Only show for actions that need selector */}
                {needsSelector && (
                  <div className="space-y-3 border-t border-border pt-5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                        Selector Strategy
                      </label>
                      <span className="text-xs text-text-tertiary">
                        {parsedConfig.element || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['id', 'xpath', 'css', 'testid', 'class'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectorType(type)}
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                            selectorType === type
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background text-text-secondary hover:border-text-tertiary hover:text-text-primary'
                          }`}
                        >
                          {type === 'testid' ? 'data-testid' : type === 'xpath' ? 'XPath' : type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Configuration - Only show for actions that need it */}
                {needsConfiguration && action === 'click' && (
                  <div className="space-y-4 border-t border-border pt-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      Configuration
                    </label>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                        Click Type
                      </label>
                      <select
                        value={clickType}
                        onChange={(e) => setClickType(e.target.value)}
                        className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                      >
                        <option>Left click</option>
                        <option>Double click</option>
                        <option>Right click</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          Wait for Element
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Wait for element to appear before executing
                        </div>
                      </div>
                      <Switch checked={waitElement} onCheckedChange={setWaitElement} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                        Timeout
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTimeout(Math.max(0, timeout - 500))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                        >
                          −
                        </button>
                        <div className="flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-center text-sm font-mono text-text-primary">
                          {timeout}ms
                        </div>
                        <button
                          onClick={() => setTimeout(Math.min(30000, timeout + 500))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {needsConfiguration && action === 'type' && (
                  <div className="space-y-4 border-t border-border pt-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      Configuration
                    </label>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          Clear before typing
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Clear field before entering text
                        </div>
                      </div>
                      <Switch checked={clearBefore} onCheckedChange={setClearBefore} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                        Typing delay
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTypingDelay(Math.max(0, typingDelay - 10))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                        >
                          −
                        </button>
                        <div className="flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-center text-sm font-mono text-text-primary">
                          {typingDelay}ms
                        </div>
                        <button
                          onClick={() => setTypingDelay(Math.min(500, typingDelay + 10))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {needsConfiguration && action === 'assert' && (
                  <div className="space-y-4 border-t border-border pt-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      Configuration
                    </label>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                        Assertion Type
                      </label>
                      <select
                        value={assertType}
                        onChange={(e) => setAssertType(e.target.value)}
                        className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                      >
                        <option>Is Visible</option>
                        <option>Is Hidden</option>
                        <option>Contains Text</option>
                        <option>Has Attribute</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                        Timeout
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTimeout(Math.max(0, timeout - 500))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                        >
                          −
                        </button>
                        <div className="flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-center text-sm font-mono text-text-primary">
                          {timeout}ms
                        </div>
                        <button
                          onClick={() => setTimeout(Math.min(30000, timeout + 500))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 border-t border-border pt-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Execution Mode
                  </label>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Mode
                    </label>
                    <Dropdown className="w-full">
                      <DropdownTrigger>
                        <button className="w-full flex items-center justify-between rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-text-primary hover:border-primary transition-colors">
                          <div className="flex items-center gap-2">
                            {executionMode === 'sequential' ? (
                              <>
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span>Sequential - Chạy tuần tự</span>
                              </>
                            ) : (
                              <>
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 rounded-full bg-success" />
                                  <div className="w-2 h-2 rounded-full bg-error" />
                                </div>
                                <span>Conditional - Có điều kiện</span>
                              </>
                            )}
                          </div>
                          <ChevronDown className="h-4 w-4 text-text-secondary" />
                        </button>
                      </DropdownTrigger>
                      <DropdownContent className="min-w-[280px]">
                        <DropdownItem
                          onClick={() => setExecutionMode('sequential')}
                          className="flex items-center gap-3 py-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <div>
                            <div className="text-sm font-medium">Sequential</div>
                            <div className="text-xs text-text-tertiary">
                              Chạy xong node trước → chạy node sau ngay
                            </div>
                          </div>
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => setExecutionMode('conditional')}
                          className="flex items-center gap-3 py-2"
                        >
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-success" />
                            <div className="w-2 h-2 rounded-full bg-error" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">Conditional</div>
                            <div className="text-xs text-text-tertiary">
                              Có 2 đường đi: thành công (xanh) và thất bại (đỏ)
                            </div>
                          </div>
                        </DropdownItem>
                      </DropdownContent>
                    </Dropdown>
                  </div>

                  {/* Show max retries only for conditional mode */}
                  {executionMode === 'conditional' && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                        Max Retries (khi thất bại)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMaxRetries(Math.max(0, maxRetries - 1))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                        >
                          −
                        </button>
                        <div className="flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-center text-sm font-mono text-text-primary">
                          {maxRetries}
                        </div>
                        <button
                          onClick={() => setMaxRetries(Math.min(10, maxRetries + 1))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                        >
                          +
                        </button>
                      </div>
                      <div className="mt-1.5 text-xs text-text-tertiary">
                        Số lần thử lại tối đa khi node thất bại. Sau đó sẽ đi theo đường error (đỏ).
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        Skip if Element Not Found
                      </div>
                      <div className="text-xs text-text-tertiary">
                        Do not stop workflow when selector does not match
                      </div>
                    </div>
                    <Switch checked={skipNotFound} onCheckedChange={setSkipNotFound} />
                  </div>
                </div>

                {/* Advanced */}
                {executionMode === 'conditional' && (
                  <div className="space-y-4 border-t border-border pt-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      Advanced
                    </label>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                        Retry Count
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRetryCount(Math.max(0, retryCount - 1))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                        >
                          −
                        </button>
                        <div className="flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-center text-sm font-mono text-text-primary">
                          {retryCount}
                        </div>
                        <button
                          onClick={() => setRetryCount(Math.min(10, retryCount + 1))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text-primary hover:bg-sidebar-item-hover"
                        >
                          +
                        </button>
                      </div>
                      <div className="mt-1.5 text-xs text-text-tertiary">
                        Số lần thử lại khi node thất bại trong quá trình thực thi
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Simple note for non-interact nodes */}
            {!isInteractNode && (
              <div className="border-t border-border pt-5">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add internal notes..."
                  className="w-full resize-none rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <button
              onClick={handleClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Save Changes
            </button>
          </ModalFooter>
        </Modal>

        {/* Unsaved Changes Dialog */}
        {showUnsavedDialog && (
          <Modal isOpen={showUnsavedDialog} onClose={handleCancelClose} className="max-w-md">
            <ModalHeader title="Unsaved Changes" onClose={handleCancelClose} />
            <ModalBody>
              <p className="text-sm text-text-secondary">
                You have unsaved changes. Do you want to save them before closing?
              </p>
            </ModalBody>
            <ModalFooter>
              <button
                onClick={handleDiscardChanges}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
              >
                Discard
              </button>
              <button
                onClick={handleCancelClose}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
              >
                Continue Editing
              </button>
              <button
                onClick={() => {
                  handleSave();
                  setShowUnsavedDialog(false);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Save
              </button>
            </ModalFooter>
          </Modal>
        )}

        {/* Confirm Dialog for Action Type Change */}
        <ConfirmActionTypeChangeModal
          isOpen={showConfirmDialog}
          currentActionType={actionType}
          newActionType={pendingActionType || ''}
          onConfirm={handleConfirmActionTypeChange}
          onCancel={handleCancelActionTypeChange}
        />
      </>
    );
  },
);

WorkflowNodeModal.displayName = 'WorkflowNodeModal';
