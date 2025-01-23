from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import pipeline
from web3 import Web3
import json
import re
import requests
import openai
import os
from dotenv import load_dotenv

from guardrail import is_prompt_or_output_valid

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# # Load pre-trained NLP model for prompt classification
# classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# OpenAI API key
openai.api_key = os.environ.get("OPENAI_API_KEY")

# Test savant variables
project_id = os.environ.get("PROJECT_ID")
api_key = os.environ.get("API_KEY")
guardrail_url = os.environ.get("TS_GUARD_URL")

# Connect to local Ethereum blockchain
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))
contract_address = os.environ.get("CONTRACT_ADDRESS")
with open("../build/contracts/EthTransactionManager.json", "r") as file:
    contract_data = json.load(file)
    abi = contract_data["abi"]
contract = w3.eth.contract(address=contract_address, abi=abi)
account = w3.eth.accounts[0]

def get_transaction_summary(transactions, user_prompt):
    # Convert transactions to a readable format
    
    def joinData(transaction):
        sender = transaction['transaction'][0]
        recipient = transaction['transaction'][1]
        amount = w3.from_wei(transaction['transaction'][2], "ether")
        reason = transaction['transaction'][4]
        return f"Sender: {sender}, Recipient: {recipient}, Amount: {amount} ETH, Reason: {reason}"
    
    transactions_text = "\n".join([
        joinData(txn)
        for i, txn in enumerate(reversed(transactions))
    ])

    # Prepare the prompt for GPT-4
    prompt = (
        f"You are an assistant that provides financial insights. Here are the user's last transactions:\n"
        f"{transactions_text}\n\n"
        f"User's question: {user_prompt}\n"
        f"Provide a detailed or brief answer based on the user prompt."
    )

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a financial assistant providing transaction insights."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        # Check this first response['choices'][0]['message']['content']

        return {"status": "success", "summary": response['choices'][0]['message']['content']}
    except Exception as e:
        return {"status": "error", "message": f"Error generating summary: {e}"}

def classify_and_extract(prompt):
    system_message = (
        "You are an assistant that classifies user prompts into one of these actions: "
        "'transfer_eth', 'show_last_transactions', 'show_transaction', or 'summary_about_transaction'. "
        "Extract relevant inputs and respond in JSON format. "
        "Example 1:\n"
        "If the prompt is 'Send 2 ETH to 0xabc... it is a payment for the website development', respond with:\n"
        '{"action": "transfer_eth", "inputs": {"amount": 2, "recipient": "0xabc...", "reason": "Payment for website development"}}.\n\n'
        
        "Example 2:\n"
        "If the prompt is 'Can you tell what I am trying to do based on the reasons of my last 4 transactions?', respond with:\n"
        '{"action": "summary_about_transaction", "inputs": {"count": 4}}.\n\n'
    )

    try:
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            max_tokens=150
        )

        # Extract and parse the response content
        response_text = response['choices'][0]['message']['content']
        result = json.loads(response_text)  # Parse the structured output
        return result
    except json.JSONDecodeError:
        return {"status": "error", "message": "Failed to parse response from OpenAI."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def transfer_eth(amount, recipient, reason=""):
    try:
        tx_hash = contract.functions.transferETH(recipient, reason).transact({
            "from": account,
            "value": w3.to_wei(amount, "ether"),
            "gas": 300000
        })
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        return {"status": "success", "transaction_hash": receipt.transactionHash.hex()}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_last_transactions(count):
    try:
        ids, transactions = contract.functions.getLastTransactions(count).call({"gas": 500000})
        result = [{"id": ids[i], "transaction": transactions[i]} for i in range(len(ids))]
        return {"status": "success", "transactions": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_transaction(transaction_id):
    try:
        transaction = contract.functions.getTransaction(int(transaction_id)).call({"gas": 500000})
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
        return jsonify({"status": "error", "message": "No prompt provided"})
    
    # prompt_is_valid, check_response = is_prompt_or_output_valid(guardrail_url, prompt, project_id, api_key)
    # if not prompt_is_valid:
    #     return jsonify({"status": "error", "message": "Malicious prompt detected, please try a different prompt.", "data": check_response})
    
    result = classify_and_extract(prompt)

    if "status" in result and result["status"] == "error":
        return jsonify(result)

    action = result.get("action")
    inputs = result.get("inputs", {})

    if action == "transfer_eth" and "amount" in inputs and "recipient" in inputs:
        response = transfer_eth(inputs["amount"], inputs["recipient"], inputs.get("reason", ""))
    elif action == "show_last_transactions" and "count" in inputs:
        response = get_last_transactions(inputs["count"])
    elif action == "show_transaction" and "transaction_id" in inputs:
        response = get_transaction(inputs["transaction_id"])
    elif action == "summary_about_transaction" and "count" in inputs:
        response = get_last_transactions(inputs["count"])
        if response.get("status") == "success":
            transactions = response.get("transactions", [])
            print(transactions)
            print(len(transactions))
            response = get_transaction_summary(transactions, prompt)
        else:
            response = {"status": "error", "message": "Failed to get transactions for summary"}
    else:
        response = {"status": "error", "message": "Could not understand the prompt or missing inputs"}

    return jsonify(response)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5500, debug=True)