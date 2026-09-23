export default function LoadMore({ query }) {
  if (!query.hasNextPage) return null
  return (
    <div className="center">
      <button className="secondary" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
        {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
      </button>
    </div>
  )
}
