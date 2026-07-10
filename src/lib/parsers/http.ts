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
    // HTTP & SOCKS URIs use plain-text (percent-encoded) credentials, not base64.
    authPart = `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
  }

  let finalScheme: string = scheme;
  if (scheme === 'http' && !!proxy.tls) {
    finalScheme = 'https';
  }

  return `${finalScheme}://${authPart}${server}:${port}#${encodeURIComponent(name)}`;
}
