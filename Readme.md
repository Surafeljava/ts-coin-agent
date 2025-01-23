# Task Blockchain

This project is a simple blockchain application using Truffle, Flask and React.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- Truffle
- Ganache (for local development)

### Installation

Clone the repository:
```sh
git clone https://github.com/Surafeljava/ts-coin-agent
cd ts-coin-agent
```

### Compile the Smart Contracts

To compile the smart contracts, run:
```sh
truffle compile
```

### Deploy the Smart Contracts

To deploy the smart contracts to the network, run:
```sh
truffle migrate
```

To reset and re-deploy on development network, run:
```sh
truffle migrate --reset --network development
```

### Run the Frontend Application

Navigate to the frontend directory and start the React app:
```sh
cd ai_agent_frontend
npm install
npm start
```

### Run the ai agent

```sh
cd ai_agent
python ai_agent_flask.py
```

### Test the ai agent

```sh
curl -X POST http://127.0.0.1:5500/process_prompt \
-H "Content-Type: application/json" \
-d '{"prompt": "Send 1 ETH to 0xabc123..."}'
```