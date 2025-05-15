// src/lib/api/auth.ts
const BASE_URL = 'http://localhost:3000'; // ✅ 백엔드 포트

export async function login({ id, password }: { id: string; password: string }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password })
  });

  if (!res.ok) throw new Error('로그인 실패');
  return res.json(); // { access_token: "...", user: {...} }
}
