# Task Blockchain

This project is a simple blockchain application using Truffle and React.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- Truffle
- Ganache (for local development)

### Installation

Clone the repository:
```sh
git clone https://github.com/yourusername/task-blockchain.git
cd task-blockchain
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

### Run the Frontend Application

Navigate to the frontend directory and start the React app:
```sh
cd task-blockchain-frontend
npm install
npm start
```

### Run the ai agent

For now you will have to run the ai agent every time you add a new task (It will run automatically soon).
```sh
# In the main directory run the following
python ai_agent.py
```