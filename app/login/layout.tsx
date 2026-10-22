import "@/styles/app.css";

export const metadata = { title: "Unlock", robots: { index: false } };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="app">{children}</div>;
}
