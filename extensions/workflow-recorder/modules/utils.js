// Zentri Workflow Recorder - Utilities Module
// Helper functions for node data formatting and communication

/**
 * Send node data to Electron app via background script
 */
export function sendNodeToApp(action, selector, element, config = {}) {
  // Map action to node type
  const typeMap = {
    click: 'click_web',
    type: 'input_web',
    assert: 'element_check',
    hover: 'hover_web',
    extract: 'extract_web',
    scroll: 'scroll_web',
  };

  const titleMap = {
    click: 'Click',
    type: 'Type Text',
    assert: 'Assert Visible',
    hover: 'Hover',
    extract: 'Extract Text',
    scroll: 'Scroll To',
  };

  const nodeData = {
    type: typeMap[action] || 'click_web',
    category: 'interact',
    title: config.nodeName || titleMap[action] || 'Action',
    subtitle: selector.value,
    note: JSON.stringify(
      {
        url: window.location.href,
        element: element.tagName.toLowerCase(),
        selectorType: config.selectorType || selector.type,
        config: {
          action,
          condition: config.condition,
          skipNotFound: config.skipNotFound,
          retryCount: config.retryCount,
          delay: config.delay,
          screenshot: config.screenshot,
        },
      },
      null,
      2,
    ),
  };

  console.log('[Zentri Recorder] Sending node:', nodeData);

  // Send to background script
  chrome.runtime.sendMessage({ type: 'RECORD_NODE', data: nodeData });
}
