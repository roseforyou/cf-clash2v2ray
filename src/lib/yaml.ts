import yaml from 'js-yaml';

export interface ClashConfig {
  proxies?: any[];
  [key: string]: any;
}

/**
 * Safely decodes a base64 string, handling UTF-8 characters correctly.
 */
export function safeBase64Decode(str: string): string {
  // Remove whitespace and newlines
  const cleanStr = str.replace(/\s/g, '');
  const decoded = atob(cleanStr);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Encodes a string to base64, handling UTF-8 characters correctly.
 */
export function safeBase64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Parse a raw string which could be base64-encoded or raw YAML.
 */
export function parseClashYaml(rawText: string): ClashConfig {
  let textToParse = rawText.trim();

  // Try to check if it's base64 encoded subscription first
  // Usually, a base64 encoded subscription doesn't contain spaces, colons, or dashes.
  if (textToParse && !textToParse.includes(':') && !textToParse.includes(' - ')) {
    try {
      const decoded = safeBase64Decode(textToParse);
      // If the decoded content looks like a configuration file (contains colon/newlines)
      if (decoded && (decoded.includes(':') || decoded.includes('proxies'))) {
        textToParse = decoded.trim();
      }
    } catch (e) {
      // Ignore and treat as raw YAML
    }
  }

  // Parse YAML content
  try {
    const config = yaml.load(textToParse) as ClashConfig;
    if (!config || typeof config !== 'object') {
      throw new Error('Parsed result is not an object');
    }
    return config;
  } catch (err: any) {
    throw new Error(`YAML 解析失败: ${err.message}`);
  }
}
