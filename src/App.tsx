import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import ChatPage from '@/pages/ChatPage'
import NotesPage from '@/pages/NotesPage'
import FolderPage from '@/pages/FolderPage'
import PricingPage from '@/pages/PricingPage'
import FoundingMemberPage from '@/pages/FoundingMemberPage'
import LandingPage from '@/pages/LandingPage'
import TermsPage from '@/pages/TermsPage'
import FaqPage from '@/pages/FaqPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/app" element={<HomePage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/folders/:id" element={<FolderPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/founding-member" element={<FoundingMemberPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<TermsPage />} />
        <Route path="/faq" element={<FaqPage />} />
      </Routes>
    </BrowserRouter>
  )
}
