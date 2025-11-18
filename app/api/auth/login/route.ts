import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '请输入邮箱和密码' },
        { status: 400 }
      );
    }

    const apiUrl = `${API_BASE_URL}/api/auth/login`;
    console.log('[Login API] 请求URL:', apiUrl);
    console.log('[Login API] 请求数据:', { email, password: '***' });

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[Login API] 响应状态:', response.status, response.statusText);
    } catch (fetchError: any) {
      console.error('[Login API] Fetch错误:', fetchError);
      return NextResponse.json(
        { error: `网络连接失败: ${fetchError?.message || '未知错误'}` },
        { status: 500 }
      );
    }

    // 读取响应数据
    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
      console.log('[Login API] 响应数据:', data);
    } catch {
      data = { code: 500, message: text || '登录失败', data: [] };
    }

    // 根据API响应格式处理
    if (!response.ok || (data.code && data.code !== 200)) {
      return NextResponse.json(
        { error: data.message || '登录失败' },
        { status: response.ok ? 400 : response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('登录API错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

