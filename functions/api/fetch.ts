interface Env {
  FETCH_PROXY_TOKEN?: string;
  KV?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Fetch-Proxy-Token',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Retrieve token from request headers
  const clientToken = request.headers.get('X-Fetch-Proxy-Token') || '';
  const serverToken = env.FETCH_PROXY_TOKEN || '';

  // Validate token configuration
  if (!serverToken) {
    return new Response(
      JSON.stringify({
        error: 'Cloudflare Pages Functions 环境变量 FETCH_PROXY_TOKEN 未设置。请前往 Cloudflare Pages Dashboard 控制面板进行设置。',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // Validate client token
  if (clientToken !== serverToken) {
    return new Response(
      JSON.stringify({
        error: '未授权：X-Fetch-Proxy-Token 密钥不正确，请在前端页面设置中核对。',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: '仅支持 POST 请求。' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    const body = (await request.json()) as { url?: string };
    const targetUrlStr = body.url || '';

    if (!targetUrlStr) {
      return new Response(
        JSON.stringify({ error: '请求体中缺少 url 参数。' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(targetUrlStr);
    } catch {
      return new Response(
        JSON.stringify({ error: '订阅链接格式不正确。' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Fetch subscription using Cloudflare global fetch (avoid CORS)
    const remoteResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'clash',
        'Accept': '*/*',
      },
    });

    if (!remoteResponse.ok) {
      return new Response(
        JSON.stringify({
          error: `远程服务器返回了错误状态码: ${remoteResponse.status} ${remoteResponse.statusText}`,
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const text = await remoteResponse.text();

    // If Cloudflare KV is bound, generate a unique ID and store the mapping
    let id: string | undefined;
    if (env.KV) {
      id = crypto.randomUUID();
      await env.KV.put(id, targetUrl.toString());
    }

    return new Response(
      JSON.stringify({
        text,
        id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `代理抓取失败：${err.message}` }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
