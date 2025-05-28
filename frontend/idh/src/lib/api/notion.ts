// AutoPlanner에서 바로 노션 연동창 열림
export async function requestNotionRedirect() {
  const token = sessionStorage.getItem('token');
  const userId = sessionStorage.getItem('userId');

  if (!token || !userId) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`https://advanced-programming.onrender.com/auth/notion/redirect?userId=${userId}`);
  if (!res.ok) throw new Error('Notion 인증 URL 요청 실패');

  const notionAuthUrl = await res.text();
  window.location.href = notionAuthUrl;
}

// 새 창으로 노션 연동
export async function getNotionAuthUrl(): Promise<string> {
  const token = sessionStorage.getItem('token');
  const userId = sessionStorage.getItem('userId');

  if (!token || !userId) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`https://advanced-programming.onrender.com/auth/notion/redirect?userId=${userId}`);
  if (!res.ok) throw new Error('Notion 인증 URL 요청 실패');

  return await res.text();
}

// 노션 연동 상태 확인
const BASE_URL = 'https://advanced-programming.onrender.com';

export async function checkNotionConnected(): Promise<boolean> {
  const token = sessionStorage.getItem('token');
  const userId = sessionStorage.getItem('userId');

  if (!token || !userId) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`${BASE_URL}/auth/notion/status?userId=${userId}`);
  if (!res.ok) return false;

  const data = await res.json();
  return data.connected === true;
}
