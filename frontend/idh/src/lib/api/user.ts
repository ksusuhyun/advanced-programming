// src/lib/api/user.ts
const BASE_URL = 'https://advanced-programming.onrender.com';

export async function checkUserExists(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/user/${userId}`);
    if (res.ok) return true; // 이미 존재
    if (res.status === 404) return false; // 존재하지 않음
    throw new Error('사용자 조회 실패');
  } catch (e) {
    console.error(e);
    throw new Error('네트워크 오류');
  }
}
