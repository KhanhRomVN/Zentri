// Zentri Workflow Recorder - Configuration Panel Templates Module
// Contains HTML templates for different action configurations

/**
 * Get common sections (Conditions + Advanced) for all actions
 */
export function getCommonSections() {
  return `
    <!-- Conditions Section -->
    <div style="margin-top: 18px; padding-top: 18px; border-top: 1px solid #1a2029;">
      <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Conditions</div>
      <div style="margin-bottom: 14px;">
        <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Run When</div>
        <select id="zentri-condition" style="width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer;">
          <option value="always">Always</option>
          <option value="success">Previous Node Succeeded</option>
          <option value="fail">Previous Node Failed</option>
        </select>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 2px;">
        <div>
          <div style="font-size: 14px; color: #9aa7b8;">Skip if Element Not Found</div>
          <div style="font-size: 13px; color: #5b6675; margin-top: 3px;">Do not stop workflow when selector does not match</div>
        </div>
        <div class="zentri-switch" id="zentri-skip-not-found"></div>
      </div>
    </div>

    <!-- Advanced Section -->
    <div style="margin-top: 18px; padding-top: 18px; border-top: 1px solid #1a2029;">
      <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Advanced</div>
      <div style="margin-bottom: 14px;">
        <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Retry Count</div>
        <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
          <button id="zentri-retry-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
          <div id="zentri-retry-val" style="width: 55px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">2</div>
          <button id="zentri-retry-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
        </div>
      </div>
      <div style="margin-bottom: 14px;">
        <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Delay Between Steps</div>
        <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
          <button id="zentri-delay-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
          <div id="zentri-delay-val" style="width: 90px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">500<span style="color: #5b6675; font-size: 13px;">ms</span></div>
          <button id="zentri-delay-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 2px;">
        <div>
          <div style="font-size: 14px; color: #9aa7b8;">Screenshot on Error</div>
          <div style="font-size: 13px; color: #5b6675; margin-top: 3px;">Save debug screenshot if node fails</div>
        </div>
        <div class="zentri-switch on" id="zentri-screenshot"></div>
      </div>
    </div>
  `;
}

/**
 * Get config template for click action
 */
export function getClickConfig() {
  return `
    <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
    <div style="margin-bottom: 14px;">
      <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
        <span>Click Type</span>
        <span style="font-size: 13px; color: #5b6675; font-family: 'JetBrains Mono', monospace;">optional</span>
      </div>
      <select id="zentri-click-type" style="width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer;">
        <option>Left click</option>
        <option>Double click</option>
        <option>Right click</option>
      </select>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 2px; margin-bottom: 14px;">
      <div>
        <div style="font-size: 14px; color: #9aa7b8;">Wait for Element</div>
        <div style="font-size: 13px; color: #5b6675; margin-top: 3px;">Wait for element to appear before executing</div>
      </div>
      <div class="zentri-switch on" id="zentri-wait-element"></div>
    </div>
    <div>
      <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Timeout</div>
      <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
        <button id="zentri-timeout-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
        <div id="zentri-timeout-val" style="width: 90px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">3000<span style="color: #5b6675; font-size: 13px;">ms</span></div>
        <button id="zentri-timeout-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
      </div>
    </div>
    ${getCommonSections()}
  `;
}

/**
 * Get config template for type action
 */
export function getTypeConfig() {
  return `
    <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
    <div style="margin-bottom: 14px;">
      <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Text to Enter</div>
      <input id="zentri-type-text" type="text" placeholder="Enter text..." style="width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; outline: none;">
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 2px; margin-bottom: 14px;">
      <div>
        <div style="font-size: 14px; color: #9aa7b8;">Clear before typing</div>
        <div style="font-size: 13px; color: #5b6675; margin-top: 3px;">Clear field before entering text</div>
      </div>
      <div class="zentri-switch on" id="zentri-clear-before"></div>
    </div>
    <div>
      <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Typing delay</div>
      <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
        <button id="zentri-typing-delay-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
        <div id="zentri-typing-delay-val" style="width: 90px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">50<span style="color: #5b6675; font-size: 13px;">ms</span></div>
        <button id="zentri-typing-delay-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
      </div>
    </div>
    ${getCommonSections()}
  `;
}

/**
 * Get config template for assert action
 */
export function getAssertConfig() {
  return `
    <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
    <div style="margin-bottom: 14px;">
      <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Assertion Type</div>
      <select id="zentri-assert-type" style="width: 100%; background: #11151c; border: 1px solid #232a36; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e6edf3; cursor: pointer;">
        <option>Is Visible</option>
        <option>Is Hidden</option>
        <option>Contains Text</option>
        <option>Has Attribute</option>
      </select>
    </div>
    <div>
      <div style="font-size: 14px; color: #9aa7b8; margin-bottom: 8px;">Timeout</div>
      <div style="display: flex; align-items: center; border: 1px solid #232a36; border-radius: 8px; overflow: hidden; width: fit-content;">
        <button id="zentri-assert-timeout-minus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">−</button>
        <div id="zentri-assert-timeout-val" style="width: 90px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; background: #0a0d12; color: #e6edf3; padding: 0 4px; line-height: 36px;">5000<span style="color: #5b6675; font-size: 13px;">ms</span></div>
        <button id="zentri-assert-timeout-plus" style="width: 32px; height: 36px; background: #11151c; border: none; color: #9aa7b8; cursor: pointer; font-size: 16px;">+</button>
      </div>
    </div>
    ${getCommonSections()}
  `;
}

/**
 * Get default config template for actions without specific configuration
 */
export function getDefaultConfig() {
  return `
    <div style="font-size: 13px; text-transform: uppercase; letter-spacing: .09em; color: #5b6675; margin-bottom: 12px;">Configuration</div>
    <div style="color: #5b6675; font-size: 14px; text-align: center; padding: 20px 0;">
      No special configuration for this action
    </div>
    ${getCommonSections()}
  `;
}
