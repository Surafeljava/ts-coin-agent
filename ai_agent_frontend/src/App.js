import React, {useState} from "react";
import axios from "axios";
import Web3 from "web3";

function App() {

  const [prompt, setPrompt] = useState("");
  const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");

  const [loading, setLoading] = useState(false);

  const [response, setResponse] = useState();
  const [errorMessage, setErrormessage] = useState();

  const sendPrompt = () => {
    setErrormessage();
    const data = {
      'prompt': prompt
    }

    setLoading(true);

    axios.post('http://127.0.0.1:5500/process_prompt', data).then((res) => {
      console.log(res.data);
      if(res.data.status === "error") {
        setErrormessage(res.data.message);
        return;
      }
      setResponse(res.data);
    }).catch((error) => {
      console.error(error);
    }).finally(() => {
      setLoading(false);
    });

  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center py-10">
      <div className="flex flex-col gap-3 w-1/2">
        <h1 className="text-xl font-bold">TS Coin Agent</h1>
        <p>Please write your prompt here</p>
        <textarea
          type="text"
          value={prompt}
          rows={4}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write your prompt here..."
          className="border border-gray-600 px-2 py-1 rounded-md w-full"
        />
        <div className="flex flex-row justify-end">
          <button onClick={sendPrompt} className="px-5 py-1.5 bg-blue-500 hover:bg-blue-400 duration-200 text-white rounded-md w-fit">
            Execute
          </button>
        </div>

        {loading && <p>Loading...</p>}

        {errorMessage && <p className="text-red-500 px-2 py-1 bg-red-100 rounded-md">{errorMessage}</p>}

        {response && response.transaction_hash && (
          <div className="flex flex-col gap-2">
            <p>Transfered successfully!</p>
            <p className="text-gray-500 text-sm">Transaction Hash: <span className="text-base text-gray-900">{response?.transaction_hash}</span></p>
          </div>
        )}

        {response && response.transactions && (
          <div className="flex flex-col gap-2">
            <p className="text-lg font-medium">Transaction/s:</p>
            {response.transactions.map((transaction, index) => {
              const amountInETH = web3.utils.fromWei(transaction?.transaction[2], "ether")
              return (
                <div className="flex flex-col border border-gray-300 px-2 py-1 rounded-lg" key={index}>
                  <p className="text-gray-500 text-sm">Transaction ID: <span className="text-gray-900 font-medium">{transaction?.id}</span></p>
                  <div className="flex flex-col">
                    <p className="text-gray-500 text-sm">From Address: <span className="text-base text-gray-900">{transaction?.transaction[0]}</span></p>
                    <p className="text-gray-500 text-sm">To Address: <span className="text-base text-gray-900">{transaction?.transaction[1]}</span></p>
                  </div>
                  <p className="text-gray-500 text-sm">Amount: <span className="text-base text-gray-900">{amountInETH}</span></p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
