import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CookieBanner } from '@/shared/components/CookieBanner'
import HomePage from '@/pages/HomePage'
import ChatPage from '@/pages/ChatPage'
import NotesPage from '@/pages/NotesPage'
import FolderPage from '@/pages/FolderPage'
import PricingPage from '@/pages/PricingPage'
import FoundingMemberPage from '@/pages/FoundingMemberPage'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import TermsPage from '@/pages/TermsPage'
import PrivacyPage from '@/pages/PrivacyPage'
import FaqPage from '@/pages/FaqPage'

export default function App() {
  return (
    <BrowserRouter>
      <CookieBanner />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/founding-member" element={<FoundingMemberPage />} />
        <Route path="/app" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/notes/folders/:id" element={<ProtectedRoute><FolderPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
