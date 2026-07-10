/**
 * VMess Protocol Parser
 * Format: vmess:// + base64(JSON.stringify(vmessConfig))
 */
export function parseVMess(proxy: any): string {
  const server = proxy.server || '';
  const port = proxy.port || '';
  const uuid = proxy.uuid || proxy.id || '';
  const alterId = proxy.alterId !== undefined ? proxy.alterId : 0;
  const cipher = proxy.cipher || 'auto';
  const name = proxy.name || '';
  
  if (!server || !port || !uuid) {
    throw new Error('Missing server, port, or uuid for VMess');
  }

  // Network type. Default to 'tcp' if not specified
  const net = proxy.network || 'tcp';
  
  // Handlers for websocket, grpc, etc.
  let path = '';
  let host = '';

  if (net === 'ws') {
    const wsOpts = proxy['ws-opts'] || {};
    path = wsOpts.path || '';
    if (wsOpts.headers && wsOpts.headers.Host) {
      host = wsOpts.headers.Host;
    } else if (wsOpts.headers && wsOpts.headers.host) {
      host = wsOpts.headers.host;
    }
  } else if (net === 'grpc') {
    const grpcOpts = proxy['grpc-opts'] || {};
    path = grpcOpts['grpc-service-name'] || '';
  } else if (net === 'h2' || net === 'http') {
    const h2Opts = proxy['h2-opts'] || proxy['http-opts'] || {};
    path = h2Opts.path || '';
    if (h2Opts.host) {
      host = Array.isArray(h2Opts.host) ? h2Opts.host[0] : h2Opts.host;
    }
  }

  // TLS settings
  const tlsEnabled = !!proxy.tls;
  const tlsVal = tlsEnabled ? 'tls' : '';
  const sni = proxy.servername || proxy.sni || '';

  // V2Ray VMess JSON Structure
  const vmessJson = {
    v: '2',
    ps: name,
    add: server,
    port: String(port), // Must be a string
    id: uuid,
    aid: String(alterId), // Must be a string
    scy: cipher,
    net: net,
    type: 'none',
    host: host,
    path: path,
    tls: tlsVal,
    sni: sni,
    alpn: proxy.alpn ? (Array.isArray(proxy.alpn) ? proxy.alpn.join(',') : proxy.alpn) : ''
  };

  const jsonStr = JSON.stringify(vmessJson, null, 2);
  const base64Json = btoa(unescape(encodeURIComponent(jsonStr)));

  return `vmess://${base64Json}`;
}
