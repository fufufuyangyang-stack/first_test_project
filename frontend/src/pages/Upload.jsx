import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useUploadPicture } from '../api/hooks'

const MAX_MB = 10
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

export default function Upload() {
  const navigate = useNavigate()
  const upload = useUploadPicture()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', is_public: true })
  const [error, setError] = useState('')

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const pick = (f) => {
    setError('')
    if (!f) return
    if (!ACCEPT.split(',').includes(f.type)) return setError('Only JPEG, PNG, WebP and GIF images are allowed.')
    if (f.size > MAX_MB * 1024 * 1024) return setError(`File is too large (max ${MAX_MB} MB).`)
    setFile(f)
    if (!form.title) setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, '') }))
  }

  const submit = (e) => {
    e.preventDefault()
    if (!file) return setError('Choose a picture first.')
    const fd = new FormData()
    fd.append('image', file)
    fd.append('title', form.title)
    fd.append('description', form.description)
    fd.append('is_public', form.is_public)
    upload.mutate(fd, {
      onSuccess: (pic) => navigate(`/p/${pic.id}`),
      onError: (err) => setError(errorMessage(err, 'Upload failed.')),
    })
  }

  return (
    <form className="card form wide" onSubmit={submit}>
      <h1>Upload a picture</h1>
      <label
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]) }}
      >
        {preview ? <img src={preview} alt="Preview" /> : <span>Drag a picture here, or click to choose one<br /><small className="muted">JPEG, PNG, WebP or GIF · up to {MAX_MB} MB</small></span>}
        <input type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files[0])} />
      </label>
      <label>Title
        <input value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </label>
      <label>Description
        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
        Show on my public homepage
      </label>
      {error && <p className="error">{error}</p>}
      <button disabled={upload.isPending}>{upload.isPending ? 'Uploading…' : 'Upload'}</button>
    </form>
  )
}
