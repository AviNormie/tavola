export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6" aria-hidden="true">
      <div className="h-10 w-72 rounded-lg bg-sand" />
      <div className="mt-4 h-5 w-full max-w-xl rounded bg-sand" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-48 rounded-xl bg-sand" />)}
      </div>
    </div>
  );
}
