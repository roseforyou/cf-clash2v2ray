/**
 * HTTP & SOCKS Protocol Parser
 * Format: http(s)://{base64(username:password)}@{server}:{port}#{urlEncode(name)}
 */
export function parseHttp(proxy: any, scheme: 'http' | 'socks' = 'http'): string {
  const username = proxy.username || '';
  const password = proxy.password || '';
  const server = proxy.server || '';
  const port = proxy.port || '';
  const name = proxy.name || '';

  if (!server || !port) {
    throw new Error(`Missing server or port for ${scheme.toUpperCase()}`);
  }

  let authPart = '';
  if (username || password) {
    const credentials = `${username}:${password}`;
    const base64Credentials = btoa(unescape(encodeURIComponent(credentials)));
    authPart = `${base64Credentials}@`;
  }

  return `${scheme}://${authPart}${server}:${port}#${encodeURIComponent(name)}`;
}
