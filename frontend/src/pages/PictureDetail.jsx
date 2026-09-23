import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { downloadPicture, errorMessage } from '../api/client'
import { useDeletePicture, usePicture, useUpdatePicture } from '../api/hooks'
import { useAuth } from '../auth/AuthContext'

function EditPicture({ picture, onDone }) {
  const update = useUpdatePicture(picture.id)
  const [form, setForm] = useState({ title: picture.title, description: picture.description, is_public: picture.is_public })

  const submit = (e) => {
    e.preventDefault()
    update.mutate(form, { onSuccess: onDone })
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>Title
        <input value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </label>
      <label>Description
        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
        Public
      </label>
      {update.isError && <p className="error">{errorMessage(update.error)}</p>}
      <div className="row">
        <button disabled={update.isPending}>Save</button>
        <button type="button" className="secondary" onClick={onDone}>Cancel</button>
      </div>
    </form>
  )
}

export default function PictureDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const picture = usePicture(id)
  const del = useDeletePicture(id)
  const [editing, setEditing] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  if (picture.isLoading) return <p className="muted">Loading…</p>
  if (picture.isError) return <div className="center"><h1>Picture not found</h1><p className="muted">It may be private or deleted.</p></div>

  const p = picture.data
  const isOwner = user?.username === p.owner

  const onDownload = async () => {
    setDownloadError('')
    try {
      await downloadPicture(p.id)
    } catch (err) {
      setDownloadError(errorMessage(err, 'Download failed.'))
    }
  }

  const onDelete = () => {
    if (!confirm('Delete this picture? This cannot be undone.')) return
    del.mutate(undefined, { onSuccess: () => navigate(`/u/${p.owner}`, { replace: true }) })
  }

  return (
    <section className="detail">
      <div className="detail-image">
        <img src={p.image} alt={p.title} />
      </div>
      <aside className="detail-meta">
        {editing ? (
          <EditPicture picture={p} onDone={() => setEditing(false)} />
        ) : (
          <>
            <h1>{p.title || 'Untitled'}</h1>
            <p className="muted">
              by <Link to={`/u/${p.owner}`}>{p.owner}</Link> · {new Date(p.created_at).toLocaleDateString()}
              {!p.is_public && <> · <span className="badge inline">Private</span></>}
            </p>
            {p.description && <p className="description">{p.description}</p>}
            <p className="muted small">{p.width} × {p.height}</p>
            <div className="row">
              <button onClick={onDownload}>Download</button>
              {isOwner && (
                <>
                  <button className="secondary" onClick={() => setEditing(true)}>Edit</button>
                  <button className="danger" onClick={onDelete} disabled={del.isPending}>Delete</button>
                </>
              )}
            </div>
            {downloadError && <p className="error">{downloadError}</p>}
            {del.isError && <p className="error">{errorMessage(del.error)}</p>}
          </>
        )}
      </aside>
    </section>
  )
}
