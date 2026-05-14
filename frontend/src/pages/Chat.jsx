import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'

const Chat = () => {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-dark-bg">
      <Sidebar 
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <ChatArea 
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    </div>
  )
}

export default Chat