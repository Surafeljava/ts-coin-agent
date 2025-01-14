// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EthTransactionManager {
    struct Transaction {
        address sender;
        address recipient;
        uint amount;
        uint timestamp;
    }

    Transaction[] public transactions;

    event Transfer(address indexed from, address indexed to, uint amount, uint timestamp);

    // Transfer ETH and log the transaction
    function transferETH(address payable _recipient) public payable {
        require(msg.value > 0, "Amount must be greater than zero");
        _recipient.transfer(msg.value);
        transactions.push(Transaction(msg.sender, _recipient, msg.value, block.timestamp));
        emit Transfer(msg.sender, _recipient, msg.value, block.timestamp);
    }

    // Get the last N transactions
    function getLastTransactions(uint _count) public view returns (uint[] memory, Transaction[] memory) {
        uint length = transactions.length;
        if (_count > length) {
            _count = length;
        }
        
        uint[] memory ids = new uint[](_count);
        Transaction[] memory lastTransactions = new Transaction[](_count);
        
        for (uint i = 0; i < _count; i++) {
            uint index = length - i - 1;
            ids[i] = index;
            lastTransactions[i] = transactions[index];
        }
        
        return (ids, lastTransactions);
    }

    // Get details of a specific transaction by ID
    function getTransaction(uint _id) public view returns (uint, Transaction memory) {
        require(_id < transactions.length, "Transaction does not exist");
        return (_id, transactions[_id]);
    }
}