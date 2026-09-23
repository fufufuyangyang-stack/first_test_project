import { Link, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import PictureDetail from './pages/PictureDetail'
import Register from './pages/Register'
import Search from './pages/Search'
import Upload from './pages/Upload'
import UserHome from './pages/UserHome'

export default function App() {
  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/u/:username" element={<UserHome />} />
          <Route path="/p/:id" element={<PictureDetail />} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="*" element={<div className="center"><h1>Page not found</h1><Link to="/">Go home</Link></div>} />
        </Routes>
      </main>
    </>
  )
}
