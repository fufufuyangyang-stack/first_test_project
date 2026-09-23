import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={`/u/${user.username}`} replace />
  return (
    <div className="hero">
      <h1>Your pictures, on your own page.</h1>
      <p className="muted">Upload photos, share your homepage, and browse what others have posted.</p>
      <div className="row center-row">
        <Link to="/register" className="button">Get started</Link>
        <Link to="/search" className="button secondary">Find people</Link>
      </div>
    </div>
  )
}
