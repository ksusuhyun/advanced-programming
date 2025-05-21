<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let subjectTitle = '과목 1'; // Default or could be a prop
  let subjectName = '';
  let startDate = '';
  let endDate = '';
  let importance = 3; // Default value (1-5 scale)
  
  let units = [
    { unitName: '', studyAmount: '', difficulty: '선택' },
  ];

  function addUnit() {
    units = [...units, { unitName: '', studyAmount: '', difficulty: '선택' }];
  }

  function removeUnit(index) {
    if (units.length > 1) {
      units = units.filter((_, i) => i !== index);
    }
  }

  function handleAddSubject() {
    // Logic to add another subject (could involve parent component or a list here)
    console.log('Add new subject clicked');
    // For now, let's just clear the form as an example or dispatch an event
    // dispatch('addSubject', { subjectName, startDate, endDate, importance, units });
  }

  function handleCreatePlan() {
    console.log('Create study plan:', {
      subjectTitle,
      subjectName,
      startDate,
      endDate,
      importance,
      units
    });
    // dispatch('createPlan', { subjectName, startDate, endDate, importance, units });
    // 실제 계획 생성 로직 또는 이벤트 dispatch
  }

  const difficultyOptions = ['선택', '쉬움', '보통', '어려움'];

</script>

<div class="form-container">
  <div class="subject-card">
    <h2 class="subject-card-title">{subjectTitle}</h2>
    
    <div class="form-group">
      <label for="subject-name">과목명</label>
      <input type="text" id="subject-name" placeholder="과목명을 입력하세요" bind:value={subjectName}>
    </div>

    <div class="date-group">
      <div class="form-group">
        <label for="start-date">시작일</label>
        <input type="date" id="start-date" bind:value={startDate} placeholder="mm/dd/yyyy">
      </div>
      <div class="form-group">
        <label for="end-date">종료일</label>
        <input type="date" id="end-date" bind:value={endDate} placeholder="mm/dd/yyyy">
      </div>
    </div>

    <div class="form-group">
      <label for="importance-slider">중요도: {importance}</label>
      <input type="range" id="importance-slider" min="1" max="5" bind:value={importance} class="slider">
    </div>

    <div class="units-section">
      <h3 class="units-title">학습 단원</h3>
      {#each units as unit, i (i)}
        <div class="unit-entry">
          <input type="text" placeholder="단원명" bind:value={unit.unitName} class="unit-input">
          <input type="text" placeholder="학습량" bind:value={unit.studyAmount} class="unit-input">
          <select bind:value={unit.difficulty} class="unit-select">
            {#each difficultyOptions as option}
              <option value={option.toLowerCase() === '선택' ? '' : option}>{option}</option>
            {/each}
          </select>
          {#if units.length > 1}
            <button type="button" on:click={() => removeUnit(i)} class="remove-unit-btn">-</button>
          {/if}
        </div>
      {/each}
      <button type="button" on:click={addUnit} class="add-unit-btn">
        <!-- Placeholder for plus icon from 6:661 -->
        <span class="icon-placeholder">+</span> 단원 추가
      </button>
    </div>
  </div>

  <button type="button" class="add-subject-btn" on:click={handleAddSubject}>
     <!-- Placeholder for plus icon from 6:585 -->
    <span class="icon-placeholder">+</span> 과목 추가
  </button>
  <button type="button" class="create-plan-btn" on:click={handleCreatePlan}>학습 계획 생성하기</button>

</div>

<style>
  .form-container {
    width: 896px; /* Figma div 6:562 width */
    display: flex;
    flex-direction: column;
    gap: 24px; /* Spacing between subject-card, add-subject-btn, create-plan-btn */
    padding: 20px; /* Padding around the entire form area */
    box-sizing: border-box;
  }

  .subject-card {
    background-color: #ffffff; /* Figma div 6:566 fill */
    border-radius: 12px; /* Figma div 6:566 cornerRadius */
    border: 1px solid #e5e7eb; /* Figma div 6:566 stroke */
    padding: 32px; /* Figma div 6:581 padding approx */
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .subject-card-title {
    font-family: 'Inter', sans-serif;
    font-size: 20px; /* Figma text 6:632 */
    color: #1f2937; /* Figma text 6:632 */
    margin: 0 0 8px 0; /* Added some bottom margin */
    font-weight: 400;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-family: 'Inter', sans-serif;
    font-size: 16px; /* Figma text e.g. 6:648 */
    color: #374151; /* Figma text e.g. 6:648 */
    font-weight: 400;
  }

  .form-group input[type="text"],
  .form-group input[type="date"],
  .form-group select {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    padding: 12px;
    border: 1px solid #d1d5db; /* Figma input stroke 6:638 */
    border-radius: 8px; /* Figma input cornerRadius 6:638 */
    box-sizing: border-box;
    height: 50px; /* Figma input height 6:638 */
  }
  .form-group input[type="date"] {
    color: #adaebc; /* Placeholder color like in Figma, actual date will be darker */
  }
  /* Fix for date placeholder not showing in some browsers */
  input[type="date"]:required:invalid::-webkit-datetime-edit {
      color: transparent;
  }
  input[type="date"]:focus::-webkit-datetime-edit {
      color: black !important;
  }


  .date-group {
    display: flex;
    gap: 16px;
  }
  .date-group .form-group {
    flex: 1;
  }

  .slider {
    width: 100%;
    height: 8px; /* Figma input 6:657 height */
    background: #e5e5e5; /* Figma input 6:657 track color */
    border-radius: 9999px;
    -webkit-appearance: none;
    appearance: none;
    margin-top: 8px; /* Align with label */
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px; /* Figma svg 6:689 approx size */
    height: 18px;
    background: #0075ff; /* Figma div 6:681 fill */
    border-radius: 50%;
    cursor: pointer;
  }
  .slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: #0075ff;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .units-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .units-title {
    font-family: 'Inter', sans-serif;
    font-size: 18px; /* Figma text 6:644 */
    color: #1f2937; /* Figma text 6:644 */
    font-weight: 400;
    margin: 0;
  }
  .unit-entry {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .unit-input {
    flex: 1;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    padding: 12px;
    border: 1px solid #d1d5db; /* Figma input 6:682 */
    border-radius: 8px; /* Figma input 6:682 */
    height: 50px; /* Figma input 6:682 */
    box-sizing: border-box;
  }
  .unit-select {
    flex-basis: 150px; /* Give select a base width */
    height: 50px;
    padding: 0 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    color: #1f2937; /* Figma text 6:685 */
    background-color: #ffffff;
  }
  .remove-unit-btn {
    background-color: #ef4444; /* Red for removal */
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .add-unit-btn {
    font-family: 'Inter', sans-serif;
    font-size: 16px; /* Figma text 6:665 */
    color: #4b5563; /* Figma text 6:665 */
    background-color: transparent;
    border: 1px dashed #d1d5db; /* Dashed border for add buttons usually */
    border-radius: 8px;
    padding: 10px 16px;
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .icon-placeholder {
    /* Basic styling for the plus icon placeholder */
    display: inline-block;
    width: 14px; /* Figma frame 6:661 */
    height: 16px; /* Figma frame 6:661 */
    /* background-color: #4b5563; For actual icon or SVG */
    text-align: center;
    line-height: 16px;
  }

  .add-subject-btn {
    font-family: 'Inter', sans-serif;
    font-size: 16px; /* Figma text 6:584 */
    color: #4b5563; /* Figma text 6:584 */
    background-color: #ffffff; /* Figma button 6:567 background (assuming white if not specified transparent) */
    border: 1px solid #d1d5db; /* Figma button 6:567 stroke */
    border-radius: 12px; /* Figma button 6:567 cornerRadius */
    padding: 18px 0; /* Height 60px -> approx 18px padding if text is ~20px */
    cursor: pointer;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .create-plan-btn {
    font-family: 'Inter', sans-serif;
    font-size: 16px; /* Figma text 6:589 */
    color: #ffffff; /* Figma text 6:589 */
    background-color: #1f2937; /* Figma button 6:568 fill */
    border: 1px solid #1f2937; /* Figma button 6:568 stroke - assuming same as fill */
    border-radius: 8px; /* Figma button 6:568 cornerRadius */
    padding: 16px 0; /* Height 56px -> approx 16px padding */
    cursor: pointer;
    text-align: center;
    font-weight: 400;
  }
</style> 