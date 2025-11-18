import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, type } = body;

    if (!to || !type) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const apiUrl = `${API_BASE_URL}/api/index/sendemail`;
    console.log('[SendEmail API] 请求URL:', apiUrl);
    console.log('[SendEmail API] 请求数据:', { to, type });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ to, type }),
    });

    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = { code: 500, message: text || '发送失败', data: [] };
    }

    console.log('[SendEmail API] 响应数据:', data);

    // 根据API响应格式处理
    if (!response.ok || (data.code && data.code !== 200)) {
      return NextResponse.json(
        { error: data.message || '发送邮件失败' },
        { status: response.ok ? 400 : response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('发送邮件API错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

