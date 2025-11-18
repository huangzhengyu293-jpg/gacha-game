import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

export async function POST(request: NextRequest) {
  try {
    // 从 Header 获取 Authorization
    const authorization = request.headers.get('authorization') || request.headers.get('Authorization');
    
    if (!authorization) {
      return NextResponse.json({ error: '未提供授权信息' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // 构造 form-data 格式的请求体
    const formData = new URLSearchParams();
    formData.append('id', String(body.id || ''));
    formData.append('type', String(body.type || '0'));
    formData.append('percent', String(body.percent || '0'));

    const apiUrl = `${API_BASE_URL}/api/lucky/go`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'authorization': authorization,
      },
      body: formData.toString(),
    });

    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = { code: 500, message: text || '转动失败', data: [] };
    }

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(
      { error: data.message || '转动失败' },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}


