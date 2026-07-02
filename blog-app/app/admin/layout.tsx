export const metadata = { robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="container-wide admin-shell">{children}</div>;
}
