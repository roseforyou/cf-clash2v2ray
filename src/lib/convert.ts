import { parseSS } from './parsers/ss';
import { parseVMess } from './parsers/vmess';
import { parseVLESS } from './parsers/vless';
import { parseTrojan } from './parsers/trojan';
import { parseHttp } from './parsers/http';
import { parseClashYaml, safeBase64Encode } from './yaml';

export interface SkippedNode {
  name: string;
  type: string;
  reason: string;
}

export interface ConvertedNode {
  name: string;
  type: string;
  uri: string;
  warning?: string;
}

export interface ConversionResult {
  success: boolean;
  nodes: ConvertedNode[];
  skipped: SkippedNode[];
  subscriptionText: string;
}

/**
 * Parses ShadowsocksR (SSR) node config to URI.
 */
export function parseSSR(proxy: any): string {
  const server = proxy.server || '';
  const port = proxy.port || '';
  const protocol = proxy.protocol || 'origin';
  const method = proxy.cipher || 'aes-256-cfb';
  const obfs = proxy.obfs || 'plain';
  const password = proxy.password || '';
  const name = proxy.name || '';
  const protoparam = proxy['protocol-param'] || '';
  const obfsparam = proxy['obfs-param'] || '';

  if (!server || !port || !password) {
    throw new Error('Missing server, port, or password for SSR');
  }

  const b64Password = safeBase64Encode(password).replace(/=/g, '');
  const b64Name = safeBase64Encode(name).replace(/=/g, '');
  const b64ProtoParam = protoparam ? safeBase64Encode(protoparam).replace(/=/g, '') : '';
  const b64ObfsParam = obfsparam ? safeBase64Encode(obfsparam).replace(/=/g, '') : '';

  const mainPart = `${server}:${port}:${protocol}:${method}:${obfs}:${b64Password}`;
  
  const params: string[] = [];
  if (b64Name) params.push(`remarks=${b64Name}`);
  if (b64ProtoParam) params.push(`protoparam=${b64ProtoParam}`);
  if (b64ObfsParam) params.push(`obfsparam=${b64ObfsParam}`);
  
  const queryStr = params.length > 0 ? `/?${params.join('&')}` : '';
  
  return `ssr://${safeBase64Encode(mainPart + queryStr).replace(/=/g, '')}`;
}

/**
 * Parses Hysteria2 node config to URI.
 */
export function parseHysteria2(proxy: any): string {
  const server = proxy.server || '';
  const password = proxy.password || proxy.auth || '';
  const name = proxy.name || '';
  
  // Resolve port supporting port ranges/lists and the `ports` parameter (common in Hysteria2)
  let port = '';
  if (proxy.port) {
    port = String(proxy.port);
  } else if (proxy.ports) {
    const portsStr = String(proxy.ports);
    if (portsStr.includes('-')) {
      port = portsStr.split('-')[0];
    } else if (portsStr.includes(',')) {
      port = portsStr.split(',')[0];
    } else {
      port = portsStr;
    }
  }

  if (!server || !port) {
    throw new Error('Missing server or port for Hysteria2');
  }

  const queryParams = new URLSearchParams();
  const sni = proxy.servername || proxy.sni || '';
  if (sni) {
    queryParams.set('sni', sni);
  }
  if (proxy.insecure) {
    queryParams.set('insecure', '1');
  }

  // Support up/down bandwidth configurations
  const up = proxy.up || proxy.up_mbps || '';
  if (up) {
    queryParams.set('up', String(up).replace(/\s*[M|m]bps/g, ''));
  }
  const down = proxy.down || proxy.down_mbps || '';
  if (down) {
    queryParams.set('down', String(down).replace(/\s*[M|m]bps/g, ''));
  }

  const queryStr = queryParams.toString();
  const queryPart = queryStr ? `?${queryStr}` : '';
  
  return `hysteria2://${password}@${server}:${port}${queryPart}#${encodeURIComponent(name)}`;
}

/**
 * Converts a raw Clash YAML string to V2Ray Subscription content.
 */
export function convertClashToV2Ray(rawText: string): ConversionResult {
  const config = parseClashYaml(rawText);

  // CRITICAL REQUIREMENT: Check if proxies field is a non-empty array
  if (!config.proxies || !Array.isArray(config.proxies) || config.proxies.length === 0) {
    throw new Error('未找到 proxies 字段,可能不是标准 Clash 配置。请确保配置文件包含至少一个节点配置。');
  }

  const nodes: ConvertedNode[] = [];
  const skipped: SkippedNode[] = [];

  for (const proxy of config.proxies) {
    const name = proxy.name || 'Unnamed Node';
    const type = String(proxy.type || '').toLowerCase();

    if (!proxy.type) {
      skipped.push({
        name,
        type: 'unknown',
        reason: 'Missing type field'
      });
      continue;
    }

    try {
      let uri = '';
      let warning: string | undefined;

      switch (type) {
        case 'ss':
          uri = parseSS(proxy);
          break;
        case 'ssr':
          uri = parseSSR(proxy);
          break;
        case 'vmess':
          uri = parseVMess(proxy);
          break;
        case 'vless':
          uri = parseVLESS(proxy);
          break;
        case 'trojan':
          uri = parseTrojan(proxy);
          break;
        case 'hysteria2':
        case 'hy2':
          uri = parseHysteria2(proxy);
          warning = '仅供参考,V2Ray 核心本身不原生支持 Hysteria 2(取决于客户端是否带自定义核心/插件)';
          break;
        case 'http':
          uri = parseHttp(proxy, 'http');
          break;
        case 'socks':
        case 'socks5':
          uri = parseHttp(proxy, 'socks');
          break;
        default:
          skipped.push({
            name,
            type,
            reason: `不支持的协议类型: ${type}`
          });
          continue;
      }

      nodes.push({
        name,
        type,
        uri,
        warning
      });
    } catch (err: any) {
      skipped.push({
        name,
        type,
        reason: `节点解析出错: ${err.message}`
      });
    }
  }

  if (nodes.length === 0) {
    throw new Error('全部节点都转换失败,未生成任何有效的订阅链接。');
  }

  // Combine successfully converted URIs and encode with Base64
  const subscriptionContent = nodes.map(n => n.uri).join('\n');
  const subscriptionText = safeBase64Encode(subscriptionContent);

  return {
    success: true,
    nodes,
    skipped,
    subscriptionText
  };
}
