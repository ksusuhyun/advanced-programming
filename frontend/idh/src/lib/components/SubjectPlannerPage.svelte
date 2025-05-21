<script>
  import Header from '$lib/components/Header.svelte'; 
  import SubjectForm from '$lib/components/SubjectForm.svelte'; 
</script>

<div class="page-container">
  <Header />
  <main class="content-area">
    <SubjectForm />
  </main>
</div>

<style>
  .page-container {
    width: 100%;
    max-width: 1440px;       /* 최대 너비 제한 */
    height: 100vh;           /* 전체 화면 높이 */
    background-color: #ffffff;
    border: 1px solid #ced4da;
    border-radius: 8px;
    margin: 0 auto;          /* 상단 여백 제거하고 중앙 정렬만 유지 */
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .content-area {
    flex-grow: 1;
    background-color: #f3f4f6;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  :global(body) {
    background-color: #e5e5e5;
    margin: 0;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden; /* ✅ 가로 스크롤 제거 */
  }
</style>
