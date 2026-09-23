import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register(form.username, form.email, form.password)
      navigate(`/u/${form.username}`, { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Registration failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h1>Create an account</h1>
      <label>Username
        <input autoFocus required value={form.username} onChange={set('username')} />
      </label>
      <label>Email <span className="muted">(optional)</span>
        <input type="email" value={form.email} onChange={set('email')} />
      </label>
      <label>Password
        <input type="password" required value={form.password} onChange={set('password')} />
      </label>
      {error && <p className="error">{error}</p>}
      <button disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
    </form>
  )
}
