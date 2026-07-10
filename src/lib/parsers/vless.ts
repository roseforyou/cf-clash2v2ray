/**
 * VLESS Protocol Parser
 * Format: vless://{uuid}@{server}:{port}?encryption=none&security=...&type=...#{urlEncode(name)}
 */
export function parseVLESS(proxy: any): string {
  const uuid = proxy.uuid || proxy.id || '';
  const server = proxy.server || '';
  const port = proxy.port || '';
  const name = proxy.name || '';

  if (!uuid || !server || !port) {
    throw new Error('Missing uuid, server, or port for VLESS');
  }

  const queryParams = new URLSearchParams();
  queryParams.set('encryption', proxy.encryption || 'none');

  // Network / transport type
  const net = proxy.network || 'tcp';
  queryParams.set('type', net);

  // Security (TLS / Reality / None)
  const isTls = !!proxy.tls;
  const realityOpts = proxy['reality-opts'] || null;

  if (realityOpts) {
    queryParams.set('security', 'reality');
    if (realityOpts['public-key']) {
      queryParams.set('pbk', realityOpts['public-key']);
    }
    if (realityOpts['short-id']) {
      queryParams.set('sid', realityOpts['short-id']);
    }
    if (realityOpts['spider-x']) {
      queryParams.set('spx', realityOpts['spider-x']);
    }
    queryParams.set('fp', proxy['client-fingerprint'] || 'chrome');
  } else if (isTls) {
    queryParams.set('security', 'tls');
  } else {
    queryParams.set('security', 'none');
  }

  // SNI / Servername
  const sni = proxy.servername || proxy.sni || '';
  if (sni) {
    queryParams.set('sni', sni);
  }

  // Flow control (e.g. xtls-rprx-vision)
  if (proxy.flow) {
    queryParams.set('flow', proxy.flow);
  }

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
  return `vless://${uuid}@${server}:${port}?${queryStr}#${encodeURIComponent(name)}`;
}
