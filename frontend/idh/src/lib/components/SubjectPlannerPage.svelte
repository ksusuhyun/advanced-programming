<script>
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import SubjectForm from '$lib/components/SubjectForm.svelte';
	import { User } from 'lucide-svelte';
  import { deleteAllExams } from '$lib/api/exam';
  import { checkNotionConnected } from '$lib/api/notion'; 
  import { goto } from '$app/navigation'; 

  const token = sessionStorage.getItem('token');
  const userId = sessionStorage.getItem('userId');

  let subjects = [];

  // ✅ 저장된 과목 불러오기
  onMount(async () => {
    try {
      const res = await fetch(`https://advanced-programming.onrender.com/exam/${userId}`);
      if (!res.ok) throw new Error('과목 정보 불러오기 실패');
      const data = await res.json();

      if (data.exams.length === 0) {
        subjects = [getEmptySubject()];
      } else {
        subjects = data.exams.map((exam) => ({
          subjectName: exam.subject,
          startDate: exam.startDate.slice(0, 10),
          endDate: exam.endDate.slice(0, 10),
          importance: exam.importance,
          units: exam.chapters.map(ch => ({
            unitName: ch.chapterTitle,
            studyAmount: String(ch.contentVolume),
            difficulty: ch.difficulty,
          }))
        }));
      }
    } catch (err) {
      console.error(err);
      subjects = [getEmptySubject()]; // 오류 시 빈 폼 하나라도 렌더링
    }
  });

  // ✅ 빈 과목 양식 생성 함수
  function getEmptySubject() {
    return {
      subjectName: '',
      startDate: '',
      endDate: '',
      importance: 3,
      units: [{ unitName: '', studyAmount: '', difficulty: '난이도 선택' }]
    };
  }

async function resetSubjects() {
  const ok = confirm('⚠️ 모든 과목 정보를 삭제하고 초기화할까요?');
  if (!ok) return;

  try {
    await deleteAllExams(userId, token); // ✅ DB 전체 삭제
    subjects = [getEmptySubject()];      // ✅ 화면 초기화
    alert('✅ 모든 과목이 초기화되었습니다.');
  } catch (err) {
    alert(`❌ 초기화 실패: ${err.message}`);
  }
}


  function handleSubjectChange(index, updatedSubject) {
    subjects[index] = { ...updatedSubject };
    subjects = [...subjects];
  }

  function addSubject() {
    subjects = [...subjects, getEmptySubject()];
  }

  function removeSubject(index) {
    if (subjects.length > 1) {
      subjects = subjects.filter((_, i) => i !== index);
    }
  }

  async function handleCreatePlan() {
    try {
      const isConnected = await checkNotionConnected();

      if (!isConnected) {
        alert('⚠️ 노션 연동이 필요합니다. 연동 페이지로 이동합니다.');
        goto('/main'); // ✅ 노션 연동 버튼 있는 페이지로 이동
        return;
      }

      // ✅ 노션 연동되어 있다면 계속 진행
      console.log('✅ 최종 계획:', subjects);
      // 여기서 계획 저장 로직 이어가면 됨
    } catch (err) {
      alert(`노션 연동 상태 확인 중 오류 발생: ${err.message}`);
    }
  }
</script>


<div class="page-wrapper">
  <Header />
  <main class="content-area">
    <div class="form-wrapper">
      {#each subjects as subject, i (i)}
        <SubjectForm
          index={i}
          subjectData={subject}
          onChange={handleSubjectChange}
          onRemove={removeSubject}
          token={token} 
          userId={userId}
        />
      {/each}

      <div class="button-pair">
        <button class="wide-button add-subject-btn" on:click={addSubject}>+ 과목 추가</button>
        <button class="wide-button reset-subject-btn" on:click={resetSubjects}>↺ 초기화</button>
      </div>
      <button class="create-plan-btn" on:click={handleCreatePlan}>학습 계획 생성하기</button>
    </div>
  </main>
</div>

<style>
  .page-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: #f3f4f6;
    overflow-x: hidden; /* ✅ 가로 스크롤 제거 */
  }

  .content-area {
    flex-grow: 1;
    padding: 40px 20px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .form-wrapper {
    width: 100%;
    max-width: 896px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .add-subject-btn,
  .create-plan-btn {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    height: 56px;
    border-radius: 8px;
    cursor: pointer;
  }

  .add-subject-btn {
    background-color: #ffffff;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .button-pair {
    display: flex;
    gap: 16px; /* 두 버튼 사이 간격 */
  }

  .wide-button {
    flex: 1;
    height: 56px;
    font-size: 16px;
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    border: none;
  }

  /* 과목 추가 버튼 */
  .add-subject-btn {
    background-color: #ffffff;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  /* 초기화 버튼 */
  .reset-subject-btn {
    background-color: #f87171;
    color: #ffffff;
    transition: background-color 0.2s ease;
  }

  .reset-subject-btn:hover {
    background-color: #ef4444;
  }

  /* 생성 버튼 */
  .create-plan-btn {
    width: 100%;
    margin-top: 20px;
    height: 56px;
    font-size: 16px;
    font-family: 'Inter', sans-serif;
    background-color: #1f2937;
    color: #ffffff;
    border: none;
    border-radius: 12px;
    cursor: pointer;
  }



  :global(body) {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: #e5e5e5;
    overflow-x: hidden;
  }
</style>
