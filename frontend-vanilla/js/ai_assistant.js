/**
 * FleetMind AI — AI Assistant Controller
 * ChatGPT-like UI with RAG citation tags, ML prediction cards, and prompt suggestions
 */

function initAIAssistant() {
  setupChatListeners();
}

function setupChatListeners() {
  const sendBtn = document.getElementById('aiChatSendBtn');
  const chatInput = document.getElementById('aiChatInput');

  if (sendBtn && chatInput) {
    sendBtn.onclick = () => window.sendChatMessage();
    chatInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        window.sendChatMessage();
      }
    };
  }
}

window.sendChatMessage = async function() {
  const input = document.getElementById('aiChatInput');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  appendUserMessage(message);

  const typingId = appendTypingIndicator();

  try {
    const res = await window.api.sendAIChat(message);
    removeTypingIndicator(typingId);
    appendAIResponse(res);
  } catch (e) {
    removeTypingIndicator(typingId);
    appendAIResponse({
      response: "Connection error: Unable to contact AI service. Ensure Ollama is running or use cached telemetry.",
      sources: []
    });
  }
};

window.sendPrompt = function(promptText) {
  const input = document.getElementById('aiChatInput');
  if (input) {
    input.value = promptText;
    window.sendChatMessage();
  }
};

function appendUserMessage(text) {
  const area = document.getElementById('aiChatMessagesArea');
  if (!area) return;

  const div = document.createElement('div');
  div.className = 'chat-bubble chat-bubble-user';
  div.textContent = text;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function appendTypingIndicator() {
  const area = document.getElementById('aiChatMessagesArea');
  if (!area) return null;

  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'chat-bubble chat-bubble-ai';
  div.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 13px;">
      <span style="display: inline-block; width: 6px; height: 6px; background: var(--primary); border-radius: 50%; animation: pulse 1s infinite;"></span>
      FleetMind AI is retrieving knowledge chunks & running ML models...
    </div>
  `;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.remove();
}

function appendAIResponse(res) {
  const area = document.getElementById('aiChatMessagesArea');
  if (!area) return;

  const div = document.createElement('div');
  div.className = 'chat-bubble chat-bubble-ai';

  let mlBlockHtml = '';
  if (res.ml_prediction) {
    const p = res.ml_prediction;
    mlBlockHtml = `
      <div style="
        background: #fee2e2;
        border: 1px solid #fca5a5;
        border-radius: var(--radius-md);
        padding: 12px 14px;
        margin-bottom: 12px;
        font-size: 13px;
      ">
        <div style="font-weight: 800; color: #ef4444; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          ⚡ ML Prediction: Vehicle ${p.vehicle_id} Risk = ${p.risk_score}% (${p.risk_level})
        </div>
        <div style="color: #4b5563; font-size: 12px;">
          Maintenance Risk: ${p.maintenance_risk}% • Fuel Risk: ${p.fuel_risk}% • Delay Risk: ${p.delay_risk}%
        </div>
      </div>
    `;
  }

  // Format message lines
  const formattedText = res.response
    .replace(/\n\n/g, '<br><br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/• /g, '• ');

  let sourcesHtml = '';
  if (res.sources && res.sources.length > 0) {
    const badges = res.sources.map(s => `
      <span class="pill-badge badge-blue" style="font-size: 11px;">
        📄 ${s.doc_title} (${s.section})
      </span>
    `).join(' ');
    sourcesHtml = `
      <div class="chat-sources-tag">
        <strong style="color: var(--text-secondary); display: block; margin-bottom: 4px;">RAG Verified Sources:</strong>
        ${badges}
      </div>
    `;
  }

  div.innerHTML = `
    ${mlBlockHtml}
    <div style="color: var(--text-main); font-size: 14px; line-height: 1.6;">
      ${formattedText}
    </div>
    ${sourcesHtml}
  `;

  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}
