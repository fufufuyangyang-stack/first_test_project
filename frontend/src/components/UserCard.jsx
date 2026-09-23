import { Link } from 'react-router-dom'
import Avatar from './Avatar'

export default function UserCard({ user }) {
  return (
    <Link to={`/u/${user.username}`} className="user-card">
      <Avatar user={user} />
      <div>
        <strong>{user.username}</strong>
        <span className="muted">
          {user.picture_count} {user.picture_count === 1 ? 'picture' : 'pictures'}
        </span>
      </div>
    </Link>
  )
}
