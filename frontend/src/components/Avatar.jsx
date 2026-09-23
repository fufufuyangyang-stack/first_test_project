export default function Avatar({ user, size = 48 }) {
  const style = { width: size, height: size, fontSize: size * 0.42 }
  if (user.avatar) return <img className="avatar" src={user.avatar} alt="" style={style} />
  return <span className="avatar placeholder" style={style}>{user.username[0].toUpperCase()}</span>
}
