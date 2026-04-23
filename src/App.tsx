import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import ChatPage from '@/pages/ChatPage'
import NotesPage from '@/pages/NotesPage'
import FolderPage from '@/pages/FolderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/folders/:id" element={<FolderPage />} />
      </Routes>
    </BrowserRouter>
  )
}
