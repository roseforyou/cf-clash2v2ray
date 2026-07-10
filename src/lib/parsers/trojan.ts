/**
 * Trojan Protocol Parser
 * Format: trojan://{password}@{server}:{port}?sni={sni}&type={network}#{urlEncode(name)}
 */
export function parseTrojan(proxy: any): string {
  const password = proxy.password || '';
  const server = proxy.server || '';
  const port = proxy.port || '';
  const name = proxy.name || '';

  if (!password || !server || !port) {
    throw new Error('Missing password, server, or port for Trojan');
  }

  const queryParams = new URLSearchParams();

  // SNI / Servername
  const sni = proxy.servername || proxy.sni || '';
  if (sni) {
    queryParams.set('sni', sni);
  }

  // Network / Transport Type
  const net = proxy.network || 'tcp';
  queryParams.set('type', net);

  // Transport-specific options
  if (net === 'ws') {
    const wsOpts = proxy['ws-opts'] || {};
    if (wsOpts.path) {
      queryParams.set('path', wsOpts.path);
    }
    if (wsOpts.headers && wsOpts.headers.Host) {
      queryParams.set('host', wsOpts.headers.Host);
    } else if (wsOpts.headers && wsOpts.headers.host) {
      queryParams.set('host', wsOpts.headers.host);
    }
  } else if (net === 'grpc') {
    const grpcOpts = proxy['grpc-opts'] || {};
    if (grpcOpts['grpc-service-name']) {
      queryParams.set('serviceName', grpcOpts['grpc-service-name']);
    }
  } else if (net === 'h2' || net === 'http') {
    const h2Opts = proxy['h2-opts'] || proxy['http-opts'] || {};
    if (h2Opts.path) {
      queryParams.set('path', h2Opts.path);
    }
    if (h2Opts.host) {
      const hostVal = Array.isArray(h2Opts.host) ? h2Opts.host[0] : h2Opts.host;
      queryParams.set('host', hostVal);
    }
  }

  const queryStr = queryParams.toString();
  const queryPart = queryStr ? `?${queryStr}` : '';

  return `trojan://${password}@${server}:${port}${queryPart}#${encodeURIComponent(name)}`;
}
