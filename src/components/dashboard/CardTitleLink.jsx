import { Link } from 'react-router-dom'

// Dashboard card title that links to the workspace it summarizes.
// Renders a normal <h3> so it keeps the card heading styling, with a
// hover/focus affordance signalling it's clickable.
export function CardTitleLink({ to, children }) {
  return (
    <Link to={to} className="card-title-link">
      <h3>{children}</h3>
    </Link>
  )
}
