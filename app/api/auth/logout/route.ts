import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

export async function POST(request: NextRequest) {
  try {
    // 从 header 中获取 authorization token
    const authorization = request.headers.get('authorization');
    
    if (!authorization) {
      return NextResponse.json({ error: '缺少 token' }, { status: 401 });
    }

    const apiUrl = `${API_BASE_URL}/api/auth/logout`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = { code: 500, message: text || '退出登录失败', data: [] };
    }

    // 如果 HTTP 状态码是 200，就认为成功
    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    }

    // HTTP 状态码不是 200，返回错误
    return NextResponse.json(
      { error: data.message || '退出登录失败' },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}


