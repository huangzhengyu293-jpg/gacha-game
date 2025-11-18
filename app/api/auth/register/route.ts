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
    const apiUrl = `${API_BASE_URL}/api/auth/register`;
    console.log('\n========================================');
    console.log('🔄 [注册API] 开始代理请求');
    console.log('📍 目标URL:', apiUrl);
    console.log('📦 请求数据:', { name, email, password: '***隐藏***' });
    console.log('========================================\n');

    let response: Response;
    let data: any;

    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      console.log('\n========================================');
      console.log('✅ [注册API] 成功连接到服务器！');
      console.log('📊 HTTP状态码:', response.status, response.statusText);
      console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));
      console.log('========================================\n');

    } catch (fetchError: any) {
      console.error('\n========================================');
      console.error('❌ [注册API] 无法连接到服务器！');
      console.error('🔗 请求URL:', apiUrl);
      console.error('⚠️  错误类型:', fetchError?.name);
      console.error('💬 错误消息:', fetchError?.message);
      console.error('🔍 错误代码:', fetchError?.code);
      console.error('📚 错误堆栈:', fetchError?.stack);
      console.error('========================================\n');
      
      return NextResponse.json(
        { error: `网络连接失败: ${fetchError?.message || '未知错误'}` },
        { status: 500 }
      );
    }

    // 读取响应数据
    try {
      const text = await response.text();
      console.log('📄 [注册API] 原始响应:', text);
      
      try {
        data = JSON.parse(text);
        console.log('📦 [注册API] 解析后的JSON:', data);
      } catch (parseError) {
        console.error('❌ [注册API] JSON解析失败:', parseError);
        data = { message: text || '注册失败' };
      }
    } catch (readError) {
      console.error('❌ [注册API] 读取响应失败:', readError);
      return NextResponse.json(
        { error: '读取服务器响应失败' },
        { status: 500 }
      );
    }

    // 判断响应状态
    console.log('\n========================================');
    if (!response.ok) {
      console.log('⚠️  [注册API] 服务器返回错误状态');
      console.log('📊 状态码:', response.status);
      console.log('💬 错误信息:', data.message || data.error || '未知错误');
      console.log('========================================\n');
      
      return NextResponse.json(
        { error: data.message || data.error || '注册失败' },
        { status: response.status }
      );
    }

    console.log('✅ [注册API] 注册成功！');
    console.log('📦 返回数据:', data);
    console.log('========================================\n');

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('注册API错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

