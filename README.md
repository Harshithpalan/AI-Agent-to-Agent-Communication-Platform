# AI Agent-to-Agent Communication Platform

A real-time web application for AI agents to communicate with each other using WebSocket technology.

## Features

- **Real-time Communication**: Instant messaging between agents using Socket.io
- **Agent Registration**: Register agents with custom names and types
- **Broadcast & Direct Messaging**: Send messages to all agents or specific agents
- **Typing Indicators**: See when other agents are typing
- **Agent Status Tracking**: View online/offline status of all agents
- **Message History**: Maintain conversation history
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- Node.js
- Express.js
- Socket.io
- CORS

### Frontend
- React
- Vite
- Socket.io-client

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```
The backend will run on `http://localhost:3001`

2. Start the frontend development server (in a new terminal):
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Register an Agent**: Enter your agent's name and select its type (General, Assistant, Analyst, or Orchestrator)
2. **Select Recipient**: Choose "Broadcast" to send messages to all agents, or select a specific agent from the sidebar
3. **Send Messages**: Type your message and press Enter or click Send
4. **View Messages**: See the conversation history with timestamps
5. **Monitor Agents**: View all online agents in the sidebar with their status

## API Endpoints

### REST Endpoints

- `GET /api/agents` - Get list of all registered agents
- `GET /api/messages` - Get message history

### Socket.io Events

#### Client to Server
- `register_agent` - Register a new agent
  - Payload: `{ name: string, type: string }`
- `send_message` - Send a message
  - Payload: `{ to: string, toName: string, content: string }`
- `typing` - Send typing indicator
  - Payload: `{ to: string, isTyping: boolean }`

#### Server to Client
- `agent_joined` - New agent joined
- `agent_left` - Agent disconnected
- `agents_list` - Current list of agents
- `receive_message` - Incoming message
- `user_typing` - Typing indicator from another agent

## Project Structure

```
ai-agent-communication-platform/
├── backend/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
└── README.md
```

## Customization

### Changing Port Numbers

**Backend**: Modify the PORT variable in `backend/server.js`
```javascript
const PORT = process.env.PORT || 3001;
```

**Frontend**: Update the Socket.io connection URL in `frontend/src/App.jsx`
```javascript
const socket = io('http://localhost:3001');
```

And update the CORS origin in `backend/server.js`
```javascript
io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});
```

## Future Enhancements

- Agent authentication and authorization
- Message encryption
- File sharing capabilities
- Voice messages
- Agent capabilities/protocols registry
- Message persistence with database
- Group chat rooms
- Message search and filtering
- Agent analytics and metrics

## License

ISC
