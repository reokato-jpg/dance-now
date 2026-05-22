export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  // No sidebar for login page
  return <div className="min-h-screen bg-ink-900">{children}</div>;
}
