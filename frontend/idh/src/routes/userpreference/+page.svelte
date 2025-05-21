<script>
  import Header from '$lib/components/Header.svelte';
  import MainSection from '$lib/components/MainSection.svelte';
</script>

<div class="page-wrapper">
  <Header />
  <div class="main-wrapper">
    <MainSection />
  </div>
</div>

<style>
  .page-wrapper {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f3f4f6;
  }

  .main-wrapper {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  :global(body) {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: #f3f4f6;
  }
</style>
