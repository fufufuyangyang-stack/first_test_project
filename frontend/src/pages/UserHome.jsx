import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useUser, useUserPictures } from '../api/hooks'
import { useAuth } from '../auth/AuthContext'
import Avatar from '../components/Avatar'
import LoadMore from '../components/LoadMore'
import PictureGrid from '../components/PictureGrid'

function EditProfile({ onDone }) {
  const { user, updateMe } = useAuth()
  const [bio, setBio] = useState(user.bio)
  const [avatar, setAvatar] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('bio', bio)
    if (avatar) fd.append('avatar', avatar)
    setBusy(true)
    try {
      await updateMe(fd)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form inline-form" onSubmit={submit}>
      <label>Bio
        <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </label>
      <label>Avatar
        <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button disabled={busy}>Save</button>
        <button type="button" className="secondary" onClick={onDone}>Cancel</button>
      </div>
    </form>
  )
}

export default function UserHome() {
  const { username } = useParams()
  const { user: me } = useAuth()
  const profile = useUser(username)
  const pictures = useUserPictures(username)
  const [editing, setEditing] = useState(false)
  const isMe = me?.username === username

  if (profile.isLoading) return <p className="muted">Loading…</p>
  if (profile.isError) {
    return (
      <div className="center">
        <h1>User not found</h1>
        <p className="muted">There is no user called “{username}”. <Link to="/search">Search for someone else</Link>.</p>
      </div>
    )
  }

  const user = profile.data
  const pics = pictures.data?.pages.flatMap((p) => p.results) ?? []

  return (
    <section>
      <div className="profile">
        <Avatar user={user} size={88} />
        <div className="profile-info">
          <h1>{user.username}</h1>
          <p className="muted">
            {user.picture_count} public {user.picture_count === 1 ? 'picture' : 'pictures'} · joined{' '}
            {new Date(user.date_joined).toLocaleDateString()}
          </p>
          {editing ? <EditProfile onDone={() => setEditing(false)} /> : user.bio && <p>{user.bio}</p>}
          {isMe && !editing && (
            <div className="row">
              <Link to="/upload" className="button">Upload a picture</Link>
              <button className="secondary" onClick={() => setEditing(true)}>Edit profile</button>
            </div>
          )}
        </div>
      </div>

      {pictures.isLoading && <p className="muted">Loading pictures…</p>}
      {pictures.isSuccess && pics.length === 0 && (
        <p className="muted center">{isMe ? 'You haven’t uploaded anything yet.' : 'No pictures yet.'}</p>
      )}
      <PictureGrid pictures={pics} />
      <LoadMore query={pictures} />
    </section>
  )
}
