import React from "react";
import axios from "axios";

function App() {

  const [prompt, setPrompt] = React.useState("");

  const [loading, setLoading] = React.useState(false);

  const sendPrompt = () => {
    const data = {
      'prompt': prompt
    }

    setLoading(true);

    axios.post('http://127.0.0.1:5000/create_task', data).then((res) => {
      console.log(res.data);
    }).catch((error) => {
      console.error(error);
    }).finally(() => {
      setLoading(false);
    });

  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col gap-1">
      <h1 className="text-xl font-bold">TS Coin Agent</h1>
      <p>Please write your prompt here</p>
      <textarea
        type="text"
        value={prompt}
        rows={6}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Write your prompt here..."
        className="border border-gray-600 px-2 py-1 rounded-md w-full"
      />
      <div className="flex flex-row justify-end">
        <button onClick={sendPrompt} className="px-5 py-1.5 bg-blue-500 hover:bg-blue-400 duration-200 text-white rounded-md w-fit">
          Send
        </button>
      </div>

      {loading && <p>Loading...</p>}
    </div>
  );
}

export default App;
