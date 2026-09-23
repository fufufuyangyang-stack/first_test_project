import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(form.username, form.password)
      navigate(location.state?.from || `/u/${form.username}`, { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Login failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h1>Log in</h1>
      <label>Username
        <input autoFocus required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
      </label>
      <label>Password
        <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </label>
      {error && <p className="error">{error}</p>}
      <button disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      <p className="muted">No account? <Link to="/register">Sign up</Link></p>
    </form>
  )
}
