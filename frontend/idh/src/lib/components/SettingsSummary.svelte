<script lang='ts'>
  export let userEmail: string;
  export let learningStyle: string;
  export let studyDays: string[];
  export let studySessions: number;

  import { goto } from '$app/navigation';

  function handleEditSettings() {
    goto('/userpreference');
  }

  function handleStartPlan() {
    goto('/exam');
  }
</script>

<div class="summary-card">
  <div class="greeting-section">
    <!-- Placeholder for icon 49:46 -->
    <div class="icon-placeholder check-icon"></div> 
    <div class="greeting-text">
      <p class="welcome-message">안녕하세요, {userEmail}!</p>
      <p class="status-message">학습 설정이 저장되었습니다</p>
    </div>
  </div>

  <div class="settings-details">
    <div class="detail-item">
      <!-- Placeholder for icon 49:99 -->
      <div class="icon-placeholder list-icon"></div>
      <div class="detail-text">
        <p class="detail-title">학습 스타일</p>
        <p class="detail-value">{learningStyle}</p>
      </div>
    </div>

    <div class="detail-item">
      <!-- Placeholder for icon 49:103 -->
      <div class="icon-placeholder calendar-icon"></div>
      <div class="detail-text">
        <p class="detail-title">학습 요일</p>
        <div class="days-badges">
          {#each studyDays as day}
            <span class="day-badge">{day}</span>
          {/each}
        </div>
      </div>
    </div>

    <div class="detail-item">
      <!-- Placeholder for icon 49:107 -->
      <div class="icon-placeholder sessions-icon"></div>
      <div class="detail-text">
        <p class="detail-title">하루 학습 세션</p>
        <!-- Figma shows a visual slider (49:137), here just text for simplicity -->
        <div class="session-display">
          <div class="session-slider-track">
             <div class="session-slider-thumb" style="width: { (studySessions / 5) * 100 }%;"></div>
          </div>
          <p class="detail-value session-count">{studySessions} 회</p>
        </div>
      </div>
    </div>
  </div>

  <div class="action-buttons">
    <button type="button" class="button secondary-button" on:click={handleEditSettings}>
      <!-- Placeholder for icon 49:113 -->
      <span class="icon-placeholder edit-icon"></span> 설정 수정
    </button>
    <button type="button" class="button primary-button" on:click={handleStartPlan}>
      계획 시작 
      <!-- Placeholder for icon 49:129 (arrow or similar) -->
      <span class="icon-placeholder arrow-icon"></span>
    </button>
  </div>
</div>

<style>
  .summary-card {
    width: 726px; /* Figma div 49:27 width */
    min-height: 590px; /* Figma div 49:27 height, use min-height for flexibility */
    background-color: #ffffff; /* Figma div 49:27 fill */
    border-radius: 12px; /* Figma div 49:27 cornerRadius */
    border: 1px solid #e5e7eb; /* Figma div 49:27 stroke */
    padding: 40px; /* Approximate padding based on inner elements */
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 32px; /* Spacing between major sections */
  }

  .greeting-section {
    display: flex;
    align-items: center;
    gap: 16px; /* Space between icon and text (49:46 to 49:49) */
  }

  .icon-placeholder {
    width: 36px; /* Default icon size based on 49:46 */
    height: 36px;
    background-color: #d1d5db; /* Placeholder color */
    border-radius: 4px; /* General rounded corners for icons */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #6b7280;
  }
  .check-icon::before { content: '✓'; /* Simple checkmark */ }
  .list-icon { width: 22.5px; height: 20px; } /* from 49:99 */
  .list-icon::before { content: '📋'; }
  .calendar-icon { width: 17.5px; height: 20px; } /* from 49:103 */
  .calendar-icon::before { content: '📅'; }
  .sessions-icon { width: 20px; height: 20px; } /* from 49:107 */
  .sessions-icon::before { content: '📊'; }
  .edit-icon { width: 14px; height: 16px; font-size: 12px; } /* from 49:113 */
  .edit-icon::before { content: '✏️'; }
  .arrow-icon { width: 14px; height: 16px; font-size: 12px; } /* from 49:129 */
  .arrow-icon::before { content: '→'; }


  .greeting-text .welcome-message {
    font-family: 'Inter', sans-serif;
    font-size: 24px; /* Figma text 49:96 */
    color: #1f2937; /* Figma text 49:96 */
    margin: 0 0 4px 0;
    font-weight: 400;
  }

  .greeting-text .status-message {
    font-family: 'Inter', sans-serif;
    font-size: 16px; /* Figma text 49:98 */
    color: #4b5563; /* Figma text 49:98 */
    margin: 0;
    font-weight: 400;
  }

  .settings-details {
    display: flex;
    flex-direction: column;
    gap: 24px; /* Spacing between detail items (e.g. 49:50, 49:51, 49:52) */
    padding-left: 16px; /* Align with text from greeting section */
  }

  .detail-item {
    display: flex;
    align-items: flex-start; /* Align icon with the top of the text block */
    gap: 16px; /* Space between icon and text content */
  }

  .detail-text .detail-title {
    font-family: 'Inter', sans-serif;
    font-size: 18px; /* Figma text e.g. 49:120 */
    color: #1f2937; /* Figma text e.g. 49:120 */
    margin: 0 0 4px 0;
    font-weight: 400;
  }

  .detail-text .detail-value {
    font-family: 'Inter', sans-serif;
    font-size: 16px; /* Figma text e.g. 49:122 */
    color: #4b5563; /* Figma text e.g. 49:122 */
    margin: 0;
    font-weight: 400;
  }
  
  .days-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .day-badge {
    font-family: 'Inter', sans-serif;
    font-size: 16px; /* Figma text 49:142 */
    color: #ffffff; /* Figma text 49:142 */
    background-color: #1f2937; /* Figma span 49:132 fill */
    border-radius: 4px; /* Figma span 49:132 cornerRadius */
    padding: 6px 12px; /* Adjusted for better appearance */
    line-height: 1;
  }

  .session-display {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 4px;
  }

  .session-slider-track {
    width: 89.75px; /* Figma div 49:137 width */
    height: 8px; /* Figma div 49:137 height */
    background-color: #e5e7eb; /* Figma div 49:137 fill */
    border-radius: 9999px; /* Figma div 49:137 cornerRadius */
    position: relative;
    overflow: hidden;
  }

  .session-slider-thumb {
    height: 100%;
    background-color: #1f2937; /* Figma div 49:151 fill */
    border-radius: 9999px;
    /* width is set by style attribute based on studySessions */
  }

  .session-count {
     color: #374151; /* Figma text 49:140 */
  }

  .action-buttons {
    display: flex;
    gap: 16px; /* Spacing between buttons (49:53, 49:54) */
    margin-top: auto; /* Push buttons to the bottom if card has extra space */
    padding-top: 24px; /* Add some space before buttons */
  }

  .button {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    border-radius: 8px; /* Figma button cornerRadius */
    padding: 12px 24px; /* Adjusted for 50px height with text */
    cursor: pointer;
    flex-grow: 1; /* Make buttons take equal width */
    height: 50px; /* Figma button height */
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 400;
  }

  .secondary-button {
    background-color: #ffffff; /* Transparent fill means use card bg or a light color */
    color: #374151; /* Figma text 49:112 */
    border: 1px solid #d1d5db; /* Figma stroke 49:53 */
  }

  .primary-button {
    background-color: #1f2937; /* Figma fill 49:54 */
    color: #ffffff; /* Figma text 49:117 */
    border: 1px solid #1f2937; /* Assuming border matches fill */
  }
</style> 