export interface ParsedResponse {
  thinking: string | null;
  markdown: string | null;
  tools: ToolCall[];
  tables: { headers: string[]; rows: string[][] }[];
  isThinkingClosed: boolean;
}

export interface ToolCall {
  name: string;
  params: Record<string, string>;
  rawXml: string;
  isClosed: boolean;
}

const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

const extractParamValue = (content: string, paramName: string): string | null => {
  const regex = new RegExp(`<${paramName}>([\\s\\S]*?)<\\/${paramName}>`, 'i');
  const match = content.match(regex);
  if (match) {
    return decodeHtmlEntities(match[1].trim());
  }
  return null;
};

/**
 * Robustly parses AI responses during streaming.
 * Uses a surgical "peel" approach to isolate tags without bleeding.
 */
export const parseResponse = (content: string): ParsedResponse => {
  const result: ParsedResponse = {
    thinking: null,
    markdown: null,
    tools: [],
    tables: [],
    isThinkingClosed: true,
  };

  if (!content) return result;

  let leftover = content;

  // 1. Extract <thinking> blocks (surgical peel)
  const thinkingRegex = /<thinking>([\s\S]*?)(?:<\/thinking>|$)/gi;
  let tMatch;
  const thinkingParts: string[] = [];
  while ((tMatch = thinkingRegex.exec(content)) !== null) {
    thinkingParts.push(tMatch[1].trim());
    if (tMatch[0].toLowerCase().includes('</thinking>')) {
      result.isThinkingClosed = true;
    } else {
      result.isThinkingClosed = false;
    }
  }
  if (thinkingParts.length > 0) {
    result.thinking = thinkingParts.join('\n---\n');
    // Remove ALL thinking blocks from leftover to prevent leakage
    leftover = leftover.replace(/<thinking>[\s\S]*?(?:<\/thinking>|$)/gi, '');
  }

  // 2. Extract Tools first (to prevent them from being treated as markdown fallback)
  const toolPatterns = [
    'list_emails',
    'get_email_details',
    'create_email',
    'list_services',
    'list_email_services',
    'link_email_to_service',
    'open_browser',
  ];

  for (const toolName of toolPatterns) {
    const regex = new RegExp(`<${toolName}(?:\\s+[^>]*)?>([\\s\\S]*?)(?:<\\/${toolName}>|$)`, 'gi');
    let m;
    while ((m = regex.exec(content)) !== null) {
      const innerContent = m[1];
      const params: Record<string, string> = {};
      const paramNames = [
        'page',
        'limit',
        'email_id_or_address',
        'email_id',
        'service_id',
        'username',
        'url',
      ];
      paramNames.forEach((p) => {
        const val = extractParamValue(innerContent, p);
        if (val) params[p] = val;
      });

      result.tools.push({
        name: toolName,
        params,
        rawXml: m[0],
        isClosed: m[0].toLowerCase().includes(`</${toolName}>`),
      });
    }
    // Remove tool blocks from leftover
    const stripRegex = new RegExp(
      `<${toolName}(?:\\s+[^>]*)?>[\\s\\S]*?(?:<\\/${toolName}>|$)`,
      'gi',
    );
    leftover = leftover.replace(stripRegex, '');
  }

  // 3. Extract <markdown> blocks explicitly
  const markdownRegex = /<markdown>([\s\S]*?)(?:<\/markdown>|$)/gi;
  const markdownParts: string[] = [];
  let mMatch;
  while ((mMatch = markdownRegex.exec(content)) !== null) {
    markdownParts.push(mMatch[1].trim());
  }

  if (markdownParts.length > 0) {
    result.markdown = markdownParts.join('\n\n');
    // For specific isolation, also strip markdown blocks from fallback
    leftover = leftover.replace(/<markdown>[\s\S]*?(?:<\/markdown>|$)/gi, '');
  }

  // 4. Fallback for any other text (excluding tool technical bits)
  // Stripping remaining technical tags but KEEPING their inner content if it's not a known tool
  const technicalTags = [
    /<\/thinking>/gi,
    /<\/?markdown>/gi,
    /<\/?tool_call>/gi,
    /<\/?tool_result[^>]*>/gi,
    /<\/?tool_error[^>]*>/gi,
  ];
  technicalTags.forEach((tagRef) => {
    leftover = leftover.replace(tagRef, '');
  });

  if (!result.markdown && leftover.trim()) {
    result.markdown = leftover.trim();
  }

  // 5. Extract Tables from the finalized markdown
  if (result.markdown) {
    const tableLines = result.markdown.split('\n');
    let currentHeaders: string[] = [];
    let currentRows: string[][] = [];
    let inTable = false;

    tableLines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const parts = trimmed
          .split('|')
          .filter((_, i, arr) => i > 0 && i < arr.length - 1)
          .map((p) => p.trim());

        if (parts.length > 0 && parts.every((p) => p.match(/^[- :]+$/))) {
          inTable = true;
        } else if (!inTable) {
          currentHeaders = parts;
          inTable = true;
        } else {
          currentRows.push(parts);
        }
      } else {
        if (inTable && currentHeaders.length > 0) {
          result.tables.push({ headers: [...currentHeaders], rows: [...currentRows] });
        }
        inTable = false;
        currentHeaders = [];
        currentRows = [];
      }
    });
    if (inTable && currentHeaders.length > 0) {
      result.tables.push({ headers: currentHeaders, rows: currentRows });
    }

    // Surgical strip of table lines from markdown output
    result.markdown =
      result.markdown
        .split('\n')
        .filter((l) => !l.trim().startsWith('|'))
        .join('\n')
        .trim() || (leftover.trim() ? leftover.trim() : null);
  }

  return result;
};
