/**
 * 특정 사용자의 특정 과목 시험 정보를 서버에서 삭제.
 * @param userId - 사용자 ID
 * @param subject - 과목명
 * @returns 삭제 결과 메시지
 */
export async function deleteExam(userId: string, subject: string): Promise<{ message: string }> {
  const encodedSubject = encodeURIComponent(subject); // URL 인코딩 (공백, 특수문자 대응)

  const res = await fetch(`http://localhost:3000/exam/${userId}/${encodedSubject}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      // Authorization 헤더 필요 시 여기에 추가
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || '시험 삭제 실패');
  }

  return res.json(); // { message: "삭제되었습니다." }
}
