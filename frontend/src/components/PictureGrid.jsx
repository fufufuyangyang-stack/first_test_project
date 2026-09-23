import { Link } from 'react-router-dom'

export default function PictureGrid({ pictures }) {
  return (
    <div className="grid">
      {pictures.map((p) => (
        <Link key={p.id} to={`/p/${p.id}`} className="tile">
          <img src={p.thumbnail || p.image} alt={p.title} loading="lazy" />
          {!p.is_public && <span className="badge">Private</span>}
          {p.title && <span className="tile-title">{p.title}</span>}
        </Link>
      ))}
    </div>
  )
}
