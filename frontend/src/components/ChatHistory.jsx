import React from 'react'
import { FiMessageCircle, FiShare2, FiTrash2, FiArchive } from 'react-icons/fi'

const ChatHistory = ({ conversations, selectedConversation, onSelectConversation, onDeleteChat, onShareChat, searchTerm }) => {
  
  const filterConversations = () => {
    if (!searchTerm) return conversations
    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const groupConversations = (convs) => {
    const today = []
    const yesterday = []
    const last7Days = []
    const older = []
    
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    
    convs.forEach(conv => {
      const convDate = new Date(conv.created_at)
      if (convDate >= todayStart) {
        today.push(conv)
      } else if (convDate >= yesterdayStart) {
        yesterday.push(conv)
      } else if (convDate >= weekStart) {
        last7Days.push(conv)
      } else {
        older.push(conv)
      }
    })
    
    return { today, yesterday, last7Days, older }
  }

  const filteredConvs = filterConversations()
  const groups = groupConversations(filteredConvs)

  const ChatSection = ({ title, chats }) => (
    chats.length > 0 && (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-text-secondary mb-2 px-3 uppercase tracking-wider">
          {title}
        </h3>
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelectConversation(chat)}
            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 mx-1 ${
              selectedConversation?.id === chat.id 
                ? 'bg-hover-bg text-text-primary' 
                : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FiMessageCircle className="flex-shrink-0 w-4 h-4" />
              <span className="text-sm truncate">{chat.title}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => onShareChat(chat.id, e)}
                className="p-1 hover:bg-input-bg rounded transition-colors"
                title="Share chat"
              >
                <FiShare2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => onDeleteChat(chat.id, e)}
                className="p-1 hover:bg-input-bg rounded transition-colors"
                title="Delete chat"
              >
                <FiTrash2 className="w-3.5 h-3.5 text-danger" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  )

  if (filteredConvs.length === 0) {
    return (
      <div className="text-center py-8">
        <FiMessageCircle className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
        <p className="text-text-secondary text-sm">
          {searchTerm ? 'No conversations found' : 'No chats yet'}
        </p>
        {!searchTerm && (
          <p className="text-text-secondary text-xs mt-1">
            Click "New Chat" to start a conversation
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ChatSection title="Today" chats={groups.today} />
      <ChatSection title="Yesterday" chats={groups.yesterday} />
      <ChatSection title="Previous 7 Days" chats={groups.last7Days} />
      <ChatSection title="Older" chats={groups.older} />
    </div>
  )
}

export default ChatHistory