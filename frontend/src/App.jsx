import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import Profile from './pages/Profile.jsx'
import Results from './pages/Results.jsx'
import SchemeDetail from './pages/SchemeDetail.jsx'
import Voice from './pages/Voice.jsx'
import Upload from './pages/Upload.jsx'
import Centres from './pages/Centres.jsx'
import History from './pages/History.jsx'
import Admin from './pages/Admin.jsx'
import Architecture from './pages/Architecture.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/results" element={<Results />} />
        <Route path="/scheme/:id" element={<SchemeDetail />} />
        <Route path="/voice" element={<Voice />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/centres" element={<Centres />} />
        <Route path="/history" element={<History />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
