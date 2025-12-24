import { redirect } from 'next/navigation';

export default function DrawPage() {
  // 抽奖页面入口暂时关闭：直接重定向，避免任何方式进入 /draw
  redirect('/');
}


