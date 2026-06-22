import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import FirstPage from "./assets/Fp.jsx";
import Account from "./assets/id.jsx";
import ChatPage from "./assets/chat.jsx";

// Vite injects BASE_URL ("/" normally, "/Chatter-Pit-/" for the Pages build).
// React Router wants the basename without a trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";

function App() {
  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/Account" element={<Account />} />
        <Route path="/ChatPage" element={<ChatPage />} />
        <Route path="/u/:peerId" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;
