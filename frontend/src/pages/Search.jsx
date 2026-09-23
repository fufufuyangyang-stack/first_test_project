import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUserSearch } from '../api/hooks'
import LoadMore from '../components/LoadMore'
import UserCard from '../components/UserCard'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [text, setText] = useState(q)
  const query = useUserSearch(q)
  const users = query.data?.pages.flatMap((p) => p.results) ?? []

  // Debounce typing into the URL so results update as you type.
  useEffect(() => {
    const t = setTimeout(() => {
      if (text.trim() !== q) setParams(text.trim() ? { q: text.trim() } : {}, { replace: true })
    }, 300)
    return () => clearTimeout(t)
  }, [text, q, setParams])

  return (
    <section>
      <h1>Find people</h1>
      <input
        className="search"
        type="search"
        placeholder="Search by username…"
        value={text}
        autoFocus
        onChange={(e) => setText(e.target.value)}
      />
      {!q && <p className="muted">Type a username to see their homepage.</p>}
      {q && query.isLoading && <p className="muted">Searching…</p>}
      {q && query.isSuccess && users.length === 0 && <p className="muted">No users match “{q}”.</p>}
      <div className="user-list">
        {users.map((u) => <UserCard key={u.id} user={u} />)}
      </div>
      <LoadMore query={query} />
    </section>
  )
}
