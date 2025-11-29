import { useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";

function App() {
    const [count, setCount] = useState(0);

    return (
        <main className="container">
            <h1>Vaultrs</h1>
            <p>Personal Media Vault</p>
            <div className="content">
                <p>Start building your application here</p>
                <Button onClick={() => setCount(count + 1)}>
                    Count: {count}
                </Button>
            </div>
        </main>
    );
}

export default App;
