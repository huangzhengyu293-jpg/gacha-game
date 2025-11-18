import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    if (name.trim().length < 3) {
      return NextResponse.json({ error: '用户名至少需要3个字符' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少需要8个字符' }, { status: 400 });
    }

    const apiUrl = `${API_BASE_URL}/api/auth/register`;

    // 使用 URLSearchParams 发送 form-data 格式
    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);

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
      data = { code: response.status, message: text || '注册失败', data: [] };
    }

    // 如果 HTTP 状态码是 200，就认为成功
    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    }

    // HTTP 状态码不是 200，返回错误
    return NextResponse.json(
      { error: data.message || '注册失败' },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}
