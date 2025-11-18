import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: '请输入验证码' },
        { status: 400 }
      );
    }

    const apiUrl = `${API_BASE_URL}/api/auth/activation`;
    console.log('[Activation API] 请求URL:', apiUrl);
    console.log('[Activation API] 验证码:', code);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = { code: 500, message: text || '验证失败', data: [] };
    }

    console.log('[Activation API] 响应数据:', data);

    // 根据API响应格式处理
    if (!response.ok || (data.code && data.code !== 200)) {
      return NextResponse.json(
        { error: data.message || '验证失败' },
        { status: response.ok ? 400 : response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('验证API错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

