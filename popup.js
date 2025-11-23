// Configuration
const API_ENDPOINT = 'http://localhost:3000/api';
const API_KEY = 'your-api-key'; // TODO: 環境変数化

// DOM Elements
const fileSelect = document.getElementById('fileSelect');
const contentInput = document.getElementById('content');
const addBtn = document.getElementById('addBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusDiv = document.getElementById('status');
const recentList = document.getElementById('recentList');

// Status message
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status status-${type}`;
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, 3000);
}

// Add content
addBtn.addEventListener('click', async () => {
  const file = fileSelect.value;
  const content = contentInput.value.trim();

  if (!content) {
    showStatus('内容を入力してください', 'error');
    return;
  }

  try {
    addBtn.disabled = true;
    showStatus('追加中...', 'info');

    const response = await fetch(`${API_ENDPOINT}/${file}/append`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) throw new Error('Failed to add content');

    const result = await response.json();
    showStatus('✓ 追加しました', 'success');
    contentInput.value = '';
    
    // Save to recent
    saveToRecent(file, content);
    loadRecent();

  } catch (error) {
    console.error(error);
    showStatus('エラーが発生しました', 'error');
  } finally {
    addBtn.disabled = false;
  }
});

// Save to recent (local storage)
function saveToRecent(file, content) {
  chrome.storage.local.get(['recent'], (result) => {
    const recent = result.recent || [];
    recent.unshift({
      file,
      content: content.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10
    chrome.storage.local.set({ recent: recent.slice(0, 10) });
  });
}

// Load recent items
function loadRecent() {
  chrome.storage.local.get(['recent'], (result) => {
    const recent = result.recent || [];
    
    if (recent.length === 0) {
      recentList.innerHTML = '<p class="empty">履歴がありません</p>';
      return;
    }

    recentList.innerHTML = recent.map(item => `
      <div class="recent-item">
        <span class="recent-file">${item.file}</span>
        <span class="recent-content">${item.content}</span>
      </div>
    `).join('');
  });
}

// Refresh
refreshBtn.addEventListener('click', () => {
  loadRecent();
  showStatus('更新しました', 'success');
});

// Initialize
loadRecent();
