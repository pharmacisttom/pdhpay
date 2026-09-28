"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="content">
      <h1>Unable to load this page</h1>
      <p>
        Please try again. If the problem continues, contact your administrator.
      </p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
