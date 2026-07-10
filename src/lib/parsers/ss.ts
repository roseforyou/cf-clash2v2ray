/**
 * Shadowsocks (SS) Protocol Parser
 * Format: ss://{base64(cipher:password)}@{server}:{port}#{urlEncode(name)}
 */
export function parseSS(proxy: any): string {
  const cipher = proxy.cipher || '';
  const password = proxy.password || '';
  const server = proxy.server || '';
  const port = proxy.port || '';
  const name = proxy.name || '';

  if (!server || !port) {
    throw new Error('Missing server or port for Shadowsocks');
  }

  // Safe base64 encoding in browser / JavaScript environment
  const credentials = `${cipher}:${password}`;
  const base64Credentials = btoa(unescape(encodeURIComponent(credentials)));

  return `ss://${base64Credentials}@${server}:${port}#${encodeURIComponent(name)}`;
}
