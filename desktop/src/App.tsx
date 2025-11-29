import { useState } from "react";
import "./App.css";

function App() {
    const [count, setCount] = useState(0);

    return (
        <main className="container">
            <h1>Vaultrs</h1>
            <p>Personal Media Vault</p>
            <div className="content">
                <p>Start building your application here</p>
                <button onClick={() => setCount(count + 1)}>
                    Count: {count}
                </button>
            </div>
        </main>
    );
}

export default App;
