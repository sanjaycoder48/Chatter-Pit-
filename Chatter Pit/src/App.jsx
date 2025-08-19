import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import FirstPage from "./assets/Fp.jsx";
import Account from "./assets/id.jsx";
import ChatPage from "./assets/chat.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage/>}/>
        <Route path="/Account" element={<Account/>}/>
        <Route path="/ChatPage" element={<ChatPage/>}/>
      </Routes>
    </Router>
  );
}

export default App;
