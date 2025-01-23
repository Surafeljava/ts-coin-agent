import React, {useState, useRef, useEffect} from "react";
import axios from "axios";
import Web3 from "web3";
import tsLogo from "./assets/favicon.ico"

import { FiCopy, FiThumbsUp, FiThumbsDown, FiSend, FiCheck } from "react-icons/fi";

function App() {

  const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");

  const [prompt, setPrompt] = useState("");
  const promptTextAreaRef = useRef(null);
  

  const [loading, setLoading] = useState(false);

  // const [response, setResponse] = useState();
  const [errorMessage, setErrormessage] = useState();

  const [moreSamplePrompts, setMoreSamplePrompts] = useState(false);
  // const [showDetails, setShowDetails] = useState(false);

  const [previousResponses, setPreviousResponses] = useState([]);
  const [progressSteps, setProgressSteps] = useState([]);

  const [samplePrompts, setSamplePrompts] = useState([
    "Transfer - ETH to 0x5678...",
    "Please show me the last 3 transactions",
    "Give me details of transaction ID 1",
    "What do you think I'm planning to do based on my past 4 transactions?",
    "What is the trend of my spending in my last 6 transfers?",
    "What is the total amount of ETH I have spent in my last 3 transactions?",
  ]);

  const [responseContentCopied, setResponseContentCopied] = useState();

  const copyResponseContent = (content, index) => {
    navigator.clipboard.writeText(content).then(
        () => {
            setResponseContentCopied(index);
        },
        (err) => {
            console.error('Failed to copy: ', err);
        }
    );
  }

  useEffect(() => {
      if(responseContentCopied){
          const timeout_id = setTimeout(() => {
              setResponseContentCopied();
          }, 3000)

          return () => clearTimeout(timeout_id)
      }
  }, [responseContentCopied])

  const sendPrompt = () => {
    setErrormessage();

    if(prompt === ''){
      setErrormessage('Prompt cannot be empty!')
    }

    const data = {
      'prompt': prompt
    }

    setPrompt('')
    setLoading(true);

    axios.post('http://127.0.0.1:5500/process_prompt', data).then((res) => {
      console.log(res.data);
      if(res.data.status === "error") {
        setErrormessage(res.data.message);
        setLoading(false);
        return;
      }
      setPreviousResponses(prev => {
        return [...prev, {
          response: res.data,
          prompt: data['prompt']
        }]
      });
    }).catch((error) => {
      if(error?.response?.data?.message) {
        setErrormessage(error?.response?.data?.message);
        setLoading(false);
        return;
      }
    }).finally(() => {
      setLoading(false);
    });

  }

  const onSamplePromptClick = (prompt) => {
    setPrompt(prompt);
    promptTextAreaRef.current.style.height = "auto";
    promptTextAreaRef.current.style.height = `${promptTextAreaRef.current.scrollHeight}px`;
  }

  const handleInput = (event) => {
    setPrompt(event.target.value);
    promptTextAreaRef.current.style.height = "auto";
    promptTextAreaRef.current.style.height = `${promptTextAreaRef.current.scrollHeight}px`;
  };

  return (
    <div className="w-full min-h-screen bg-tsDarkBg text-white flex flex-col items-center h-screen">
      <div className="grid grid-cols-4 items-center w-full flex-grow divide-x divide-gray-600">

        <div className="flex flex-col col-span-1 h-full gap-4 py-6 px-6">
          <div className="flex flex-row justify-between items-center gap-4">
            <img src={tsLogo} alt="Testsavant Logo" className="h-10 w-fit"/>
            <div className="flex bg-tstheme2 px-3 py-1 rounded-full rounded-br-none">
              <h1 className="text-xl font-bold text-white">Chain Savant <span className="text-base opacity-75 lowercase font-normal">Agent</span></h1>
            </div>
          </div>
          <p>Please write your prompt or choose from the following sample prompts:</p>
          <div className="flex flex-wrap gap-2 ">
            {(moreSamplePrompts ? samplePrompts : samplePrompts.slice(0,2)).map((samplePrompt, index) => {
              return (
                <button key={index} onClick={() => onSamplePromptClick(samplePrompt)} 
                className="px-3 py-1.5 bg-tsPrimaryBlue bg-opacity-30 hover:bg-opacity-65 duration-200 text-gray-300 rounded-md text-sm text-left">
                  {samplePrompt}
                </button>
              );
            })}
            <button onClick={() => setMoreSamplePrompts(!moreSamplePrompts)}>
              <p className="text-sm text-gray-300 hover:text-tsPrimaryBlue duration-200">{moreSamplePrompts ? 'Show Less' : 'Show More'}</p>
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-end w-full col-span-2 h-screen gap-2 py-4">

          <div className="flex flex-col w-full overflow-y-scroll px-5 py-2 rounded-xl">
            {previousResponses && previousResponses.length>0 && previousResponses.map((responseData, index) => {
              const response = responseData?.response;
              const prompt = responseData?.prompt || '';
              return (
                <div key={index} className="flex flex-col items-start gap-2 min-h-40 w-full shrink-0 mb-4">

                  <div className="flex flex-row w-full justify-end shrink-0 mb-4">
                    <p className="px-3 py-2 bg-tsPrimaryBlue bg-opacity-25 rounded-lg rounded-br-none max-w-[70%]">{prompt}</p>
                  </div>

                  {response.transaction_hash && (
                    <div className="flex flex-col gap-2 shrink-0 max-w-[90%]">
                      <p>Transfered successfully!</p>
                      <p className="text-gray-300 text-sm">Transaction Hash: <span className="text-base text-gray-400">{response?.transaction_hash}</span></p>
                    </div>
                  )}

                  {response.summary && (
                    <div className="flex flex-col gap-2 shrink-0 max-w-[90%] px-3 py-2 border border-gray-600 rounded-lg">
                      <p className="text-gray-100 text-base font-bold">This is a summary based on your last transactions:</p>
                      <p className="text-base text-gray-300">{response?.summary}</p>
                    </div>
                  )}

                  {response.transactions && (
                    <div className="flex flex-col gap-2 shrink-0 w-full">
                      <p className="text-base font-medium">Transaction/s:</p>

                      <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle border border-gray-600 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-500">
                                <thead>
                                    <tr className="bg-gray-800">
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 sm:pl-3">
                                            ID
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">
                                            Amount
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">
                                            Reason
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">
                                            From
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">
                                            To
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-900">
                                    {response.transactions.map((transaction, index) => {
                                      const amountInETH = web3.utils.fromWei(transaction?.transaction[2], "ether");
                                      const fromAddress = transaction?.transaction[0];
                                      const toAddress = transaction?.transaction[1];

                                      // Trim the addresses to show only the first 5 characters
                                      const trimmedFromAddress = fromAddress ? `${fromAddress.slice(0, 8)}...` : "";
                                      const trimmedToAddress = toAddress ? `${toAddress.slice(0, 8)}...` : "";
                                      return (
                                        <tr key={index} 
                                        className="even:bg-gray-800/60 odd:bg-gray-800/20 odd:hover:bg-gray-800/30 even:hover:bg-gray-800/80 hover:cursor-pointer">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-300 sm:pl-3">
                                              {transaction?.id}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-100 font-medium">
                                              {amountInETH} ETH
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                                              {transaction?.transaction[4]}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400" title={fromAddress}>
                                              {trimmedFromAddress}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400" title={toAddress}>
                                              {trimmedToAddress}
                                            </td>
                                            
                                        </tr>
                                    );
                                    })}
                                </tbody>
                            </table>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-row gap-3 justify-start mt-1">
                  <button className="text-lg text-gray-300 hover:text-tsPrimaryBlue duration-200"><FiThumbsUp/></button>
                  <button className="text-lg text-gray-300 hover:text-tsPrimaryBlue duration-200"><FiThumbsDown/></button>
                    <button onClick={() => {
                        copyResponseContent(JSON.stringify(response), index)
                    }} className='flex flex-row gap-2 items-center text-lg text-gray-300 hover:text-tsPrimaryBlue duration-200'>
                        {responseContentCopied===index ? <FiCheck className='text-green-500'/> : <FiCopy/>}
                        <p className="text-base">{responseContentCopied===index ? 'copied' : 'copy'}</p>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {loading && <p className="text-tsPrimaryBlue text-sm px-5">Processing your prompt...</p>}

          {errorMessage && <p className="w-fit text-red-500 px-2 py-1 bg-red-100 rounded-md text-sm">{errorMessage}</p>}
          <div className="flex flex-row justify-start gap-2 items-center px-4">
            <textarea
              type="text"
              ref={promptTextAreaRef}
              value={prompt}
              onChange={handleInput}
              placeholder="Write your prompt here..."
              className="text-gray-100 placeholder:text-gray-400 px-3 py-2 rounded-lg w-full overflow-hidden resize-none bg-white bg-opacity-10 ring-0 border border-gray-400"
            />
            <button onClick={sendPrompt} disabled={prompt===''}
            className={`shrink-0 size-12 hover:bg-opacity-85 duration-200 text-white rounded-full flex justify-center items-center ${prompt==='' ? 'bg-gray-700' : 'bg-tstheme2'}`}>
              <FiSend className="size-5"/>
            </button>
          </div>
        </div>


        <div className="flex flex-col col-span-1 h-full gap-1 p-4">
          <h1 className="text-xl">Details</h1>
          <p className="text-gray-400">Below are the steps the agent is taking to process your prompt.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
