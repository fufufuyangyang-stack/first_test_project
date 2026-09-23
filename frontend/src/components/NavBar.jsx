import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="nav">
      <Link to="/" className="brand">Pixshelf</Link>
      <nav>
        <NavLink to="/search">Search</NavLink>
        {user ? (
          <>
            <NavLink to="/upload">Upload</NavLink>
            <NavLink to={`/u/${user.username}`}>My page</NavLink>
            <button className="link" onClick={() => { logout(); navigate('/') }}>Log out</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register" className="button small">Sign up</NavLink>
          </>
        )}
      </nav>
    </header>
  )
}
