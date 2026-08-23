// Zentri Workflow Recorder - Selector Generation Module
// Handles selector generation strategies (ID, XPath, CSS, data-testid)

/**
 * Generate selector based on priority: id > data-testid > unique class > xpath
 */
export function generateSelector(element) {
  // 1. Try ID
  if (element.id) {
    return { type: 'id', value: `#${element.id}`, priority: 1 };
  }

  // 2. Try data-testid
  const testId = element.getAttribute('data-testid');
  if (testId) {
    return { type: 'data-testid', value: `[data-testid="${testId}"]`, priority: 2 };
  }

  // 3. Try unique class
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter((c) => c.trim());
    for (const cls of classes) {
      const selector = `.${cls}`;
      try {
        if (document.querySelectorAll(selector).length === 1) {
          return { type: 'class', value: selector, priority: 3 };
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }
  }

  // 4. Generate XPath
  const xpath = getXPath(element);
  return { type: 'xpath', value: xpath, priority: 4 };
}

/**
 * Generate XPath for an element
 */
export function getXPath(element) {
  if (element.id) return `//*[@id="${element.id}"]`;
  if (element === document.body) return '/html/body';

  let path = '';
  for (; element && element.nodeType === 1; element = element.parentNode) {
    let index = 0;
    for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
      if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) continue;
      if (sibling.nodeName === element.nodeName) ++index;
    }
    const tagName = element.nodeName.toLowerCase();
    const pathIndex = index ? `[${index + 1}]` : '';
    path = `/${tagName}${pathIndex}${path}`;
  }
  return path;
}

/**
 * Generate all possible selector types for an element
 */
export function generateAllSelectors(element) {
  const selectors = {};

  // ID
  if (element.id) {
    selectors.id = { type: 'id', value: `#${element.id}` };
  }

  // data-testid
  const testId = element.getAttribute('data-testid');
  if (testId) {
    selectors.testid = { type: 'testid', value: `[data-testid="${testId}"]` };
  }

  // CSS selector
  const cssSelector = generateCSSSelector(element);
  selectors.css = { type: 'css', value: cssSelector };

  // XPath
  selectors.xpath = { type: 'xpath', value: getXPath(element) };

  return selectors;
}

/**
 * Generate CSS selector path
 */
export function generateCSSSelector(element) {
  if (element.id) return `#${element.id}`;

  const path = [];
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(' ').filter((c) => c.trim());
      if (classes.length) {
        selector += `.${classes[0]}`;
      }
    }

    // Add nth-child if needed for uniqueness
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;

    if (path.length > 5) break; // Limit depth
  }

  return path.join(' > ');
}
