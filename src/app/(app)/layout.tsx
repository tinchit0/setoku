import { NavBar } from "@/components/NavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <NavBar />
      {children}
    </div>
  );
}
