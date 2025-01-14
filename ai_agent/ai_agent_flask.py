from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import pipeline
from web3 import Web3
import json
import re

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load pre-trained NLP model for prompt classification
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Connect to local Ethereum blockchain
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))
contract_address = "0x76E0030B7e43c08a2514bb67f74c2EEbc33694B9"
with open("../build/contracts/EthTransactionManager.json", "r") as file:
    contract_data = json.load(file)
    abi = contract_data["abi"]
contract = w3.eth.contract(address=contract_address, abi=abi)
account = w3.eth.accounts[0]

# Function to classify the user's prompt
def classify_prompt(prompt):
    labels = ["transfer", "show last transactions", "show transaction"]
    result = classifier(prompt, labels)
    print("classified prompt: ", result)
    action = result["labels"][0]
    return action

# Function to extract inputs from the prompt
def extract_inputs(prompt, action):
    if action == "transfer":
        match = re.search(r"(\d+(\.\d+)?) ETH to (0x[a-fA-F0-9]{40})", prompt)
        if match:
            amount = float(match.group(1))
            recipient = match.group(3)
            return {"amount": amount, "recipient": recipient}
    elif action == "show last transactions":
        match = re.search(r"last (\d+) transactions", prompt)
        if match:
            count = int(match.group(1))
            return {"count": count}
    elif action == "show transaction":
        match = re.search(r"transaction ID (\d+)", prompt)
        if match:
            transaction_id = int(match.group(1))
            return {"transaction_id": transaction_id}
    return {}

# Function to handle transfer action
def transfer_eth(amount, recipient):
    try:
        tx_hash = contract.functions.transferETH(recipient).transact({
            "from": account,
            "value": w3.to_wei(amount, "ether"),
            "gas": 300000
        })
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        return {"status": "success", "transaction_hash": receipt.transactionHash.hex()}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Function to handle show last transactions
def get_last_transactions(count):
    try:
        ids, transactions = contract.functions.getLastTransactions(count).call({"gas": 500000})
        result = [{"id": ids[i], "transaction": transactions[i]} for i in range(len(ids))]
        return {"status": "success", "transactions": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Function to handle show specific transaction
def get_transaction(transaction_id):
    try:
        transaction = contract.functions.getTransaction(transaction_id).call({"gas": 500000})
        result = [{"id": transaction[0], "transaction": transaction[1]}]
        return {"status": "success", "transactions": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Endpoint to receive user prompt and process it
@app.route("/process_prompt", methods=["POST"])
def process_prompt():
    data = request.json
    prompt = data.get("prompt")
    
    if not prompt:
        return jsonify({"status": "error", "message": "No prompt provided"}), 400

    action = classify_prompt(prompt)
    inputs = extract_inputs(prompt, action)
    
    print(action, inputs)

    if action == "transfer" and "amount" in inputs and "recipient" in inputs:
        result = transfer_eth(inputs["amount"], inputs["recipient"])
    elif action == "show last transactions" and "count" in inputs:
        result = get_last_transactions(inputs["count"])
    elif action == "show transaction" and "transaction_id" in inputs:
        result = get_transaction(inputs["transaction_id"])
    else:
        result = {"status": "error", "message": "Could not understand the prompt or missing inputs"}

    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5500, debug=True)