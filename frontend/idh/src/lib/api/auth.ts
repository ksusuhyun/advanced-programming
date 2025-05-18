const API_BASE = 'https://advanced-programming.onrender.com/auth/login';

export async function login({ userId, password }: { userId: string; password: string }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '로그인 실패');
  }

  return await response.json(); // { access_token: "..." }
}