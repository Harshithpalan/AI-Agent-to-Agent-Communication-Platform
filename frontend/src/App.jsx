import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3001');

function App() {
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState('general');
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('broadcast');
  const [inputMessage, setInputMessage] = useState('');
  const [typingAgents, setTypingAgents] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Listen for agent join events
    socket.on('agent_joined', (agent) => {
      setAgents((prev) => [...prev, agent]);
    });

    // Listen for agent leave events
    socket.on('agent_left', (agent) => {
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      setTypingAgents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(agent.id);
        return newSet;
      });
    });

    // Listen for agents list
    socket.on('agents_list', (agentList) => {
      setAgents(agentList);
    });

    // Listen for incoming messages
    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicators
    socket.on('user_typing', ({ agentId, agentName, isTyping }) => {
      setTypingAgents((prev) => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(agentId);
        } else {
          newSet.delete(agentId);
        }
        return newSet;
      });
    });

    return () => {
      socket.off('agent_joined');
      socket.off('agent_left');
      socket.off('agents_list');
      socket.off('receive_message');
      socket.off('user_typing');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!agentName.trim()) return;

    socket.emit('register_agent', { name: agentName, type: agentType });
    setCurrentAgent({ name: agentName, type: agentType });
    setIsRegistered(true);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const targetAgent = selectedAgent === 'broadcast' ? 'broadcast' : selectedAgent;
    const targetAgentName = selectedAgent === 'broadcast' ? 'broadcast' : agents.find(a => a.id === selectedAgent)?.name;

    socket.emit('send_message', {
      to: targetAgent,
      toName: targetAgentName,
      content: inputMessage
    });

    setInputMessage('');
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);

    const targetAgent = selectedAgent === 'broadcast' ? 'broadcast' : selectedAgent;
    
    socket.emit('typing', {
      to: targetAgent,
      isTyping: true
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        to: targetAgent,
        isTyping: false
      });
    }, 1000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isRegistered) {
    return (
      <div className="register-container">
        <div className="register-card">
          <h1>AI Agent Communication Platform</h1>
          <p>Register your agent to start communicating</p>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="agentName">Agent Name</label>
              <input
                type="text"
                id="agentName"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Enter agent name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="agentType">Agent Type</label>
              <select
                id="agentType"
                value={agentType}
                onChange={(e) => setAgentType(e.target.value)}
              >
                <option value="general">General</option>
                <option value="assistant">Assistant</option>
                <option value="analyst">Analyst</option>
                <option value="orchestrator">Orchestrator</option>
              </select>
            </div>
            <button type="submit" className="register-btn">
              Register Agent
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Agents</h2>
          <span className="agent-count">{agents.length} online</span>
        </div>
        <div className="agent-list">
          <div
            className={`agent-item ${selectedAgent === 'broadcast' ? 'selected' : ''}`}
            onClick={() => setSelectedAgent('broadcast')}
          >
            <div className="agent-avatar broadcast">
              <span>📡</span>
            </div>
            <div className="agent-info">
              <div className="agent-name">Broadcast</div>
              <div className="agent-status">Send to all agents</div>
            </div>
          </div>
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`agent-item ${selectedAgent === agent.id ? 'selected' : ''}`}
              onClick={() => setSelectedAgent(agent.id)}
            >
              <div className="agent-avatar">
                <span>{agent.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-status">
                  {agent.type} • {agent.status}
                </div>
              </div>
              {typingAgents.has(agent.id) && (
                <div className="typing-indicator">...</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        <div className="chat-header">
          <h3>
            {selectedAgent === 'broadcast' 
              ? 'Broadcast Channel' 
              : agents.find(a => a.id === selectedAgent)?.name || 'Select an agent'}
          </h3>
          <div className="current-agent">
            You: {currentAgent.name} ({currentAgent.type})
          </div>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="no-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.from === socket.id ? 'sent' : 'received'}`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    {message.from === socket.id ? 'You' : message.fromName}
                  </span>
                  {message.to !== 'broadcast' && (
                    <span className="message-recipient">
                      → {message.toName}
                    </span>
                  )}
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
                <div className="message-content">{message.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="message-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={handleTyping}
            placeholder={`Message ${selectedAgent === 'broadcast' ? 'everyone' : agents.find(a => a.id === selectedAgent)?.name}...`}
          />
          <button type="submit" disabled={!inputMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
