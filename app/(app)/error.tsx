"use client";

/** Errors inside the operator shell stay inside it, so the navigation still works. */
export default function OperatorError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <div className="title-row">
        <div>
          <h1>This screen failed to load</h1>
          <p className="sub">Rescind couldn&rsquo;t read its data. The worker runs separately and keeps watching.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn primary" onClick={reset}>Try again</button>
        </div>
      </div>
    </>
  );
}
