// Zentri Workflow Recorder - Modal HTML Template Module
// Contains the action configuration modal HTML and styles

/**
 * Generate modal HTML template
 */
export function generateModalHTML(element, allSelectors, selector, elementContent, maxModalHeight) {
  return `
    <style>
      @keyframes zentri-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes zentri-modal-in { from { opacity: 0; transform: scale(.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      #zentri-action-popup * { box-sizing: border-box; }
      #zentri-action-popup::-webkit-scrollbar { width: 6px; }
      #zentri-action-popup::-webkit-scrollbar-track { background: transparent; }
      #zentri-action-popup::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
      #zentri-action-popup::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      .zentri-action-card { transition: all 0.15s; }
      .zentri-action-card:hover { border-color: #9aa7b8; background: #1c222d; }
      .zentri-action-card.selected { border-color: #22d3ee; background: rgba(34,211,238,.14); box-shadow: 0 0 0 1px #22d3ee inset; }
      .zentri-action-card.selected .a-icon { background: #22d3ee; color: #0a0d12; }
      .zentri-switch { position: relative; width: 36px; height: 20px; background: #171c25; border: 1px solid #232a36; border-radius: 20px; cursor: pointer; transition: .15s; }
      .zentri-switch.on { background: rgba(34,211,238,.14); border-color: #22d3ee; }
      .zentri-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #5b6675; transition: .15s; }
      .zentri-switch.on::after { background: #22d3ee; transform: translateX(16px); }
      .zentri-strategy-pill { transition: all 0.15s; }
      .zentri-strategy-pill:hover:not(.active) { color: #9aa7b8; border-color: #5b6675; }
      .zentri-strategy-pill.active { border-color: #22d3ee; color: #22d3ee; background: rgba(34,211,238,.14); }
      #zentri-element-content::-webkit-scrollbar { width: 4px; }
      #zentri-element-content::-webkit-scrollbar-track { background: transparent; }
      #zentri-element-content::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
    </style>
    
    <!-- Header -->
    <div style="display: flex; align-items: flex-start; gap: 12px; padding: 20px 20px 16px; border-bottom: 1px solid #1a2029;">
      <div style="width: 40px; height: 40px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(34,211,238,.14); border: 1px solid rgba(34,211,238,.3); color: #22d3ee; flex-shrink: 0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="21" height="21"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h1 style="font-size: 17px; font-weight: 600; letter-spacing: .1px; color: #e6edf3; margin: 0;">Element Selected</h1>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 3px 9px; border-radius: 5px; background: rgba(167,139,250,.14); color: #a78bfa; border: 1px solid rgba(167,139,250,.3);">&lt;${element.tagName.toLowerCase()}&gt;</span>
        </div>
        <div style="margin-top: 4px; font-size: 14px; color: #5b6675;">Configure interaction step before adding to workflow</div>
      </div>
      <button class="zentri-close-btn" style="width: 30px; height: 30px; border-radius: 7px; border: 1px solid transparent; background: transparent; color: #5b6675; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Element Content Preview -->
    <div style="padding: 14px 18px; border-bottom: 1px solid #1a2029;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 8px;">Element Content</div>
      <div id="zentri-element-content" style="max-height: 120px; overflow-y: auto; padding: 10px 12px; background: #0a0d12; border: 1px solid #1a2029; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #9aa7b8; word-break: break-all; line-height: 1.6;">${elementContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>

    <!-- Selector Strategy -->
    <div style="padding: 14px 18px; border-bottom: 1px solid #1a2029;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
        <span>Selector Strategy</span>
        <button class="zentri-copy-selector" style="display: flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #5b6675; background: none; border: none; cursor: pointer; padding: 3px 6px; border-radius: 5px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>
          Copy Selector
        </button>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 7px;">
        ${Object.keys(allSelectors)
          .map(
            (type) => `
          <span class="zentri-strategy-pill ${type === selector.type ? 'active' : ''}" data-selector-type="${type}" style="font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 7px 13px; border-radius: 20px; border: 1px solid #232a36; color: #5b6675; cursor: pointer; background: #11151c;">${type === 'xpath' ? 'XPath' : type === 'css' ? 'CSS Selector' : type === 'testid' ? 'data-testid' : type}</span>
        `,
          )
          .join('')}
      </div>
      <div style="margin-top: 10px; padding: 11px 13px; background: #0a0d12; border: 1px solid #1a2029; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #9aa7b8; word-break: break-all; line-height: 1.6;">
        ${allSelectors[selector.type]?.value || selector.value}
      </div>
    </div>

    <!-- Actions Grid -->
    <div style="padding: 18px 20px;">
      <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 11px;">Select Action</div>
      <div id="zentri-action-grid" style="display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 18px;">
        <div class="zentri-action-card selected" data-action="click" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 9l6 12 2-6 6-2z"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Click</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Click on element</div>
        </div>
        <div class="zentri-action-card" data-action="type" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 6h16M4 12h10M4 18h7"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Type Text</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Enter text input</div>
        </div>
        <div class="zentri-action-card" data-action="assert" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Assert Visible</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Check visibility</div>
        </div>
        <div class="zentri-action-card" data-action="hover" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M12 5v2M12 17v2M5 12h2M17 12h2"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Hover</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Mouse over element</div>
        </div>
        <div class="zentri-action-card" data-action="extract" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 4h16v6H4zM4 14h10v6H4z"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Extract Text</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Extract content</div>
        </div>
        <div class="zentri-action-card" data-action="scroll" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 13px; border-radius: 10px; border: 1px solid #232a36; background: #11151c; cursor: pointer;">
          <div class="a-icon" style="width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: #171c25; color: #9aa7b8;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div>
          <div style="font-size: 14px; font-weight: 500; color: #e6edf3;">Scroll To</div>
          <div style="font-size: 12px; color: #5b6675; line-height: 1.3;">Scroll to position</div>
        </div>
      </div>
      
      <!-- Config panel -->
      <div id="zentri-config-panel">
        <!-- Config content will be injected here based on selected action -->
      </div>
    </div>

    <!-- Node naming -->
    <div style="display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-top: 1px solid #1a2029; background: #11151c;">
      <span style="width: 9px; height: 9px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 8px #22d3ee; flex-shrink: 0;"></span>
      <input id="zentri-node-name" type="text" value="${generateDefaultNodeName(element)}" placeholder="Node Name..." style="flex: 1; background: none; border: none; outline: none; font-weight: 600; font-size: 15px; color: #e6edf3;">
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #5b6675; background: #171c25; padding: 3px 7px; border-radius: 5px;">#${String(Date.now()).slice(-3)}</span>
    </div>

    <!-- Footer -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 20px 18px;">
      <button class="zentri-cancel-btn" style="font-size: 14px; font-weight: 600; border-radius: 9px; padding: 11px 20px; cursor: pointer; border: 1px solid #232a36; background: transparent; color: #9aa7b8; display: flex; align-items: center; gap: 6px;">Cancel</button>
      <button class="zentri-add-btn" style="font-size: 14px; font-weight: 600; border-radius: 9px; padding: 11px 20px; cursor: pointer; border: 1px solid transparent; background: linear-gradient(135deg, #22d3ee, #0ea5c9); color: #03222b; box-shadow: 0 4px 16px -4px rgba(34,211,238,.5); flex: 1; justify-content: center; display: flex; align-items: center; gap: 6px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg>
        Add to Workflow
      </button>
    </div>
  `;
}

/**
 * Generate default node name from element
 */
export function generateDefaultNodeName(element) {
  const tag = element.tagName.toLowerCase();
  const text = element.textContent?.trim().substring(0, 30) || '';
  const placeholder = element.getAttribute('placeholder');

  if (text) return `${tag}: ${text}`;
  if (placeholder) return `${tag}: ${placeholder}`;
  if (element.id) return `${tag}#${element.id}`;

  return `${tag} element`;
}
