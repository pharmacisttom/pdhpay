import Link from "next/link";
export default function NotFound() {
  return (
    <main className="content">
      <h1>Page not found</h1>
      <Link href="/dashboard">Return to overview</Link>
    </main>
  );
}
