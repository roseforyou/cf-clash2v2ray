import { convertClashToV2Ray } from '../../src/lib/convert';

interface Env {
  FETCH_PROXY_TOKEN?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const urlParams = new URL(request.url).searchParams;

  const clientToken = urlParams.get('token') || '';
  const serverToken = env.FETCH_PROXY_TOKEN || '';
  const clashUrl = urlParams.get('url') || '';

  // Handle CORS preflight if any client requests it
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

  // 1. Validate token configuration
  if (!serverToken) {
    return new Response(
      'Cloudflare Pages Functions 环境变量 FETCH_PROXY_TOKEN 未在控制面板配置，无法提供在线订阅服务。',
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }

  // 2. Validate client token
  if (clientToken !== serverToken) {
    return new Response(
      '未授权：token 密钥不正确，请在订阅二维码生成的链接中检查参数。',
      { 
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }

  // 3. Validate target Clash URL
  if (!clashUrl) {
    return new Response(
      '请求错误：缺少目标订阅 url 参数。',
      { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }

  try {
    // 4. Fetch the remote subscription
    const remoteResponse = await fetch(clashUrl, {
      method: 'GET',
      headers: {
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

    // 5. Convert to V2Ray subscription
    const convResult = convertClashToV2Ray(yamlText);

    // 6. Return Base64 subscription text directly (GET Subscription API standard)
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
