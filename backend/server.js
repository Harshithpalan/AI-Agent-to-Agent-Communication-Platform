const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Store connected agents
const agents = new Map();
// Store message history
const messageHistory = [];

// REST endpoint to get all registered agents
app.get('/api/agents', (req, res) => {
  const agentList = Array.from(agents.values()).map(agent => ({
    id: agent.id,
    name: agent.name,
    type: agent.type,
    status: agent.status
  }));
  res.json(agentList);
});

// REST endpoint to get message history
app.get('/api/messages', (req, res) => {
  res.json(messageHistory);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Agent connected:', socket.id);

  // Agent registration
  socket.on('register_agent', (agentData) => {
    const agent = {
      id: socket.id,
      name: agentData.name || `Agent-${socket.id.substring(0, 8)}`,
      type: agentData.type || 'general',
      status: 'online',
      joinedAt: new Date().toISOString()
    };
    agents.set(socket.id, agent);
    
    // Notify all agents about new agent
    io.emit('agent_joined', agent);
    console.log('Agent registered:', agent.name);
    
    // Send current agent list to the new agent
    const agentList = Array.from(agents.values());
    socket.emit('agents_list', agentList);
  });

  // Handle incoming messages
  socket.on('send_message', (data) => {
    const sender = agents.get(socket.id);
    if (!sender) return;

    const message = {
      id: Date.now().toString(),
      from: sender.id,
      fromName: sender.name,
      to: data.to,
      toName: data.toName,
      content: data.content,
      timestamp: new Date().toISOString()
    };

    // Store in history
    messageHistory.push(message);
    
    // Keep only last 100 messages
    if (messageHistory.length > 100) {
      messageHistory.shift();
    }

    // Send to target agent
    if (data.to === 'broadcast') {
      io.emit('receive_message', message);
    } else {
      io.to(data.to).emit('receive_message', message);
      // Also send back to sender for confirmation
      socket.emit('receive_message', message);
    }

    console.log(`Message from ${sender.name} to ${data.toName || 'broadcast'}: ${data.content}`);
  });

  // Handle agent typing indicator
  socket.on('typing', (data) => {
    const sender = agents.get(socket.id);
    if (!sender) return;

    if (data.to === 'broadcast') {
      socket.broadcast.emit('user_typing', {
        agentId: sender.id,
        agentName: sender.name,
        isTyping: data.isTyping
      });
    } else {
      io.to(data.to).emit('user_typing', {
        agentId: sender.id,
        agentName: sender.name,
        isTyping: data.isTyping
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const agent = agents.get(socket.id);
    if (agent) {
      agent.status = 'offline';
      agents.delete(socket.id);
      io.emit('agent_left', agent);
      console.log('Agent disconnected:', agent.name);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
