import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

export async function GET(request: NextRequest) {
  try {
    // 从 Header 获取 Authorization
    const authorization = request.headers.get('authorization') || request.headers.get('Authorization');
    
    if (!authorization) {
      return NextResponse.json({ error: '未提供授权信息' }, { status: 401 });
    }

    const apiUrl = `${API_BASE_URL}/api/user/bean`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'authorization': authorization,
      },
    });

    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = { code: 500, message: text || '获取钱包信息失败', data: [] };
    }

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(
      { error: data.message || '获取钱包信息失败' },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}


