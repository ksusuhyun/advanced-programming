<script>
  import Header from '$lib/components/Header.svelte';
  import MainSection from '$lib/components/MainSection.svelte';
</script>

<div class="main-wrapper">
  <div class="app-container">
    <Header />
    <MainSection />
  </div>
</div>

<style>

  /* 전체 화면을 100vh로 고정 */
  .main-wrapper {
    height: calc(100vh - 64px); /* 헤더(64px)를 제외한 나머지 영역 */
    background-color: #f3f4f6;
    display: flex;
    justify-content: center;
    overflow-y: hidden;
  }

  .app-container {
    width: 1440px; /* Figma Frame width */
    height: calc(100vh - 64px);
    background-color: #f3f4f6; /* Figma Frame fill color */
    border: 1px solid #ced4da; /* Figma Frame stroke color */
    border-radius: 8px; /* Figma Frame cornerRadius */
    margin: 0 auto; /* Center the container */
    overflow: hidden; /* Prevent content overflow if children are larger */
    display: flex;
    flex-direction: column;
  }

  /* Basic reset or global styles can be added here or in a global CSS file */
  :global(body) {
    margin: 0;
    font-family: 'Inter', sans-serif; /* Assuming Inter based on Figma, good to have a fallback */
    background-color: #f3f4f6; /* A common background for the page body */
  }
</style> 