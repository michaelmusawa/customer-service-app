import CounterProvider from "@/components/counterContext";
import SideNav from "@/components/SideBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CounterProvider>
      <div className="flex flex-col md:flex-row md:overflow-hidden relative">
        <div className="flex-none md:max-w-64">
          <SideNav />
        </div>
        <div className="flex-grow p-2 md:overflow-y-auto md:p-4">
          {children}
        </div>
      </div>
    </CounterProvider>
  );
}
