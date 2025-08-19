import { useNavigate } from "react-router-dom";

function FirstPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center bg-neutral-900 p-5 border-b border-neutral-800">
        <h1 className="text-2xl font-bold tracking-wide">Welcome to Chatter Pit</h1>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="max-w-md text-center flex flex-col gap-6">
          <h2 className="text-lg text-neutral-300">
            A simple & secure way to chat without sharing personal details.
          </h2>

          <button
            onClick={() => navigate("/Account")}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium text-lg shadow-lg"
          >
            Get Started
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 border-t border-neutral-800 text-center text-sm text-neutral-500">
        © 2025 Chatter Pit
      </footer>
    </div>
  );
}

export default FirstPage;

