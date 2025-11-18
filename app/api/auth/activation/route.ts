import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: '请输入验证码' }, { status: 400 });
    }

    const apiUrl = `${API_BASE_URL}/api/auth/activation`;

    // 使用 URLSearchParams 发送 form-data 格式
    const formData = new URLSearchParams();
    formData.append('code', code);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = { code: 500, message: text || '验证失败', data: [] };
    }

    // 如果 HTTP 状态码是 200，就认为成功
    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    }

    // HTTP 状态码不是 200，返回错误
    return NextResponse.json(
      { error: data.message || '验证失败' },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}
