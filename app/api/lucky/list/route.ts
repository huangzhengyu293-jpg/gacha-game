import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // 构造 form-data 格式的请求体
    const formData = new URLSearchParams();
    formData.append('name', body.name || '');
    formData.append('price_sort', String(body.price_sort || '1'));
    formData.append('price_min', String(body.price_min || '200'));
    formData.append('price_max', String(body.price_max || '5888'));

    const apiUrl = `${API_BASE_URL}/api/lucky/list`;

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
      data = { code: 500, message: text || '获取商品列表失败', data: [] };
    }

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(
      { error: data.message || '获取商品列表失败' },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}


