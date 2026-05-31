import { getQuoteOfDay } from '../../lib/quotes'

export function BrandPanel() {
  const quote = getQuoteOfDay()

  return (
    <aside className="bp">
      <div className="bp-mark">· CONSISTENT ·</div>

      <img
        src="/sisyphus.png"
        alt=""
        className="bp-logo brand-mark"
      />

      <figure className="bp-quote">
        <div className="bp-rule" aria-hidden="true" />
        <blockquote>{quote.text}</blockquote>
        <figcaption>
          {quote.author.toUpperCase()}
          {quote.year ? ` · ${quote.year}` : ''}
        </figcaption>
      </figure>
    </aside>
  )
}
