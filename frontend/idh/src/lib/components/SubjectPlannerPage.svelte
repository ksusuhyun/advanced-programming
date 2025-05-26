<script>
  import Header from '$lib/components/Header.svelte';
  import SubjectForm from '$lib/components/SubjectForm.svelte';
	import { User } from 'lucide-svelte';

  // 로그인 시 저장된 토큰을 sessionStorage에서 가져옴
  const token = sessionStorage.getItem('token');
  const userId = sessionStorage.getItem('userId');

  let subjects = [
    {
      subjectName: '',
      startDate: '',
      endDate: '',
      importance: 3,
      units: [{ unitName: '', studyAmount: '', difficulty: '선택' }]
    }
  ];

  function handleSubjectChange(index, updatedSubject) {
    subjects[index] = { ...updatedSubject };
  }

  function addSubject() {
    subjects = [
      ...subjects,
      {
        subjectName: '',
        startDate: '',
        endDate: '',
        importance: 3,
        units: [{ unitName: '', studyAmount: '', difficulty: '선택' }]
      }
    ];
  }

  function removeSubject(index) {
    if (subjects.length > 1) {
      subjects = subjects.filter((_, i) => i !== index);
    }
  }

  function handleCreatePlan() {
    console.log('✅ 최종 계획:', subjects);
    // TODO: API 호출 또는 페이지 이동
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

      <button class="add-subject-btn" on:click={addSubject}>+ 과목 추가</button>
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

  .create-plan-btn {
    background-color: #1f2937;
    color: #ffffff;
    border: 1px solid #1f2937;
  }

  :global(body) {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: #e5e5e5;
    overflow-x: hidden;
  }
</style>
