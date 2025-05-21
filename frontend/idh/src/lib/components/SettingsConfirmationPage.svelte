<script>
  import Header from '$lib/components/Header.svelte';
  import SettingsSummary from '$lib/components/SettingsSummary.svelte'; 

  // Props or data for SettingsSummary can be passed here later
</script>

<div class="page-container">
  <Header />
  <main class="content-area">
    <SettingsSummary />
  </main>
</div>

<style>
  .page-container {
    width: 100%;
    max-width: 1440px;
    height: 100vh;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    border: 1px solid #ced4da;
    background-color: #ffffff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .content-area {
    flex-grow: 1;
    padding: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: auto;
    background-color: #f3f4f6;
  }

  :global(body) {
    background-color: #e5e5e5; 
    margin: 0;
    font-family: 'Inter', sans-serif;
  }
</style> 