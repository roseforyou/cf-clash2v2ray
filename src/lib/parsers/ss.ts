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

  // Legacy format: ss://base64(cipher:password@server:port)#name
  const ssConfig = `${cipher}:${password}@${server}:${port}`;
  const base64Config = btoa(unescape(encodeURIComponent(ssConfig)));

  return `ss://${base64Config}#${encodeURIComponent(name)}`;
}
