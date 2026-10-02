import { useState, useRef, useEffect } from 'react';
import { agentAPI } from '../api';
import { useApp } from '../context/AppContext';
import { Send, Bot, Trash2, Loader } from 'lucide-react';
import { format } from 'date-fns';

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={14} color="#fff" />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>AI Planner</span>
        </div>
      )}
      <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}
        style={{ whiteSpace: 'pre-wrap' }}>
        {msg.content}
      </div>
      <span style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>
        {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : ''}
      </span>
    </div>
  );
}

export default function ChatPanel({ date, onScheduleUpdate }) {
  const { addToast } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Load chat history
  useEffect(() => {
    setHistLoading(true);
    agentAPI.history(date)
      .then(res => setMessages(res.data.messages || []))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [date]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await agentAPI.chat(text, date);
      const aiMsg = { role: 'model', content: res.data.message, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);

      // If the agent made tool calls, immediately refresh the schedule timeline
      if (res.data.toolCalls?.length > 0) {
        onScheduleUpdate?.();
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Agent error. Try again.', 'error');
      setMessages(prev => prev.slice(0, -1)); // Remove optimistic user msg
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = async () => {
    await agentAPI.clearHistory(date);
    setMessages([]);
    addToast('Chat cleared.', 'info');
  };

  const suggestions = [
    'What should I do today?',
    'I missed my last block, replan the day',
    'Add a 30-min break after lunch',
    'Commit my schedule',
  ];

  return (
    <div className="chat-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={16} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '14px' }}>AI Planner</p>
            <p style={{ fontSize: '11px', color: 'var(--success)' }}>● Online</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={clearChat} title="Clear chat">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1 }}>
        {histLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <span className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="chat-bubble assistant" style={{ alignSelf: 'flex-start' }}>
              👋 Hey! I'm your AI planner. Tell me what you want to accomplish today and I'll build a schedule for you. You can say things like:<br /><br />
              • "I need to study DBMS (2h), do DSA (1.5h), and attend gym (1h)"<br />
              • "Move my coding session to evening"<br />
              • "I missed the 3 PM block, replan the rest"
            </div>

            {/* Suggestion chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 0' }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  className="tag"
                  style={{ cursor: 'pointer', transition: 'all var(--transition)' }}
                  onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <MessageBubble key={i} msg={m} />)
        )}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px' }}>
              <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Tell me about your day or ask for changes…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ height: 'auto' }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          className="btn btn-primary btn-icon"
          onClick={send}
          disabled={!input.trim() || loading}
          style={{ flexShrink: 0, borderRadius: 'var(--radius-md)' }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
