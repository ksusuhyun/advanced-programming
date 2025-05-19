// src/lib/api/auth.ts
export async function login(credentials: { userId: string; password: string }) {
  const res = await fetch('https://advanced-programming.onrender.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  // ❗ 실패 응답 처리 필수
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || '로그인 실패');
  }

  return await res.json();
}
  