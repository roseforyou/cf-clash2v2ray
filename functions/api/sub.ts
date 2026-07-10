import { convertClashToV2Ray } from '../../src/lib/convert';

interface Env {
  FETCH_PROXY_TOKEN?: string;
  KV?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const urlParams = new URL(request.url).searchParams;

  const id = urlParams.get('id') || '';
  const clientToken = urlParams.get('token') || '';
  const serverToken = env.FETCH_PROXY_TOKEN || '';
  let clashUrl = urlParams.get('url') || '';

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // 1. Resolve Clash URL: either from KV (by ID) or directly from url parameter
  if (id) {
    if (!env.KV) {
      return new Response(
        '请求错误：此 Cloudflare Pages 实例未配置/绑定 KV 数据库，无法通过 ID 获取订阅。',
        {
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }
    
    const storedUrl = await env.KV.get(id);
    if (!storedUrl) {
      return new Response(
        '错误：订阅配置未找到。可能已过期或不存在。',
        {
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }
    clashUrl = storedUrl;
  } else {
    // If not using KV ID, must validate FETCH_PROXY_TOKEN
    if (!serverToken) {
      return new Response(
        'Cloudflare Pages Functions 环境变量 FETCH_PROXY_TOKEN 未在控制面板配置，无法提供在线订阅服务。',
        { 
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    if (clientToken !== serverToken) {
      return new Response(
        '未授权：token 密钥不正确，请在订阅二维码生成的链接中检查参数。',
        { 
          status: 401,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    if (!clashUrl) {
      return new Response(
        '请求错误：缺少目标订阅 url 参数。',
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }
  }

  try {
    // 2. Fetch the remote subscription
    const remoteResponse = await fetch(clashUrl, {
      method: 'GET',
      headers: {
        // Crucial: Use 'clash' User-Agent because some subscription conversion services
        // require a recognized User-Agent to output raw Clash configurations.
        'User-Agent': 'clash',
        'Accept': '*/*',
      },
    });

    if (!remoteResponse.ok) {
      return new Response(
        `远程服务器拉取失败，状态码: ${remoteResponse.status}`,
        { 
          status: 502,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    const yamlText = await remoteResponse.text();

    // 3. Convert to V2Ray subscription
    const convResult = convertClashToV2Ray(yamlText);

    // 4. Return Base64 subscription text directly
    return new Response(convResult.subscriptionText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      `转换失败: ${err.message}`,
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
};
