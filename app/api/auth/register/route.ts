import { NextRequest, NextResponse } from 'next/server';

// 从环境变量读取API基础URL，方便在不同环境切换
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.flamedraw.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // 验证必填字段
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 基础参数验证
    if (name.trim().length < 3) {
      return NextResponse.json(
        { error: '用户名至少需要3个字符' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: '密码至少需要8个字符' },
        { status: 400 }
      );
    }

    // 代理请求到外部API
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 如果后端需要API Key，可以在这里添加（前端不可见）
        // 'X-API-Key': process.env.API_SECRET_KEY || '',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // 处理后端返回的错误信息
      return NextResponse.json(
        { error: data.message || data.error || '注册失败' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('注册API错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

