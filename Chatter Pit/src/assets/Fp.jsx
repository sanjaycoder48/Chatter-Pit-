import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router-dom";


function FirstPage() {
    const navigate = useNavigate();
  return (
    <div className="w-full  mx-auto h-screen bg-gray-100 flex flex-col  rounded-xl">
      <div className="flex bg-[#222222] text-white p-4">
        <h1 className="text-xl font-bold m-auto">Chatter Pit</h1>
      </div>

      <div className="flex flex-col mt-65">
        <h2 className="text-xl font-bold flex justify-center">
          👋 Welcome to Chatter Pit
        </h2>
        <h1 className="flex justify-center font-light mt-1">Jump into Your Pit.</h1>

        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button className="bg-[#2A2A2A] rounded-lg p-2 px-4 text-gray-50 mt-6 mx-auto">
              Get Started
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-lg shadow-lg p-6">
              <Dialog.Title className="text-lg font-bold mb-2">
                Create Your ID
              </Dialog.Title>
              <p className="text-gray-600 mb-4">
                Start chatting anonymously by generating your ChatterPit ID.
              </p>
              <button className="bg-[#2a2a2a] text-white px-4 py-2 rounded-lg"
              onClick={()=> navigate("/Account")}>
                Generate ID
              </button>
              <Dialog.Close className="absolute top-2 right-2 text-gray-400">
                ✖
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="p-3 border-t text-center text-sm text-gray-500 mt-auto">
        © 2025 ChatterPit
      </div>
    </div>
  );
}

export default FirstPage;
