"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Hash, MessageCircle, Users, User } from "lucide-react";
import { CollegeProvider } from "@/contexts/CollegeContext";
import { GlobalSearch } from "@/components/ui/GlobalSearch";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CollegeProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </CollegeProvider>
  );
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/app", icon: Home },
    { name: "Communities", href: "/app/communities", icon: Hash },
    { name: "Group Chats", href: "/app/group-chats", icon: MessageCircle },
    { name: "People", href: "/app/people", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white p-6 sticky top-0 h-screen shrink-0">
        <div className="font-bold text-2xl tracking-tighter text-gradient-brand mb-10">
          Bubblr
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  isActive 
                    ? "bg-brand-50 text-brand-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* Profile Link at bottom of sidebar */}
        <div className="mt-auto pt-6 border-t border-slate-100">
          <Link 
            href="/app/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              pathname === "/app/profile" 
                ? "bg-brand-50 text-brand-700" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <User size={20} />
            Profile
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navigation Bar — no college selector, just search + branding */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <div className="md:hidden font-bold text-xl text-gradient-brand">Bubblr</div>
          
          <div className="flex-1 max-w-2xl md:ml-0 ml-auto">
            <GlobalSearch />
          </div>
          
          {/* Mobile Profile Link */}
          <Link
            href="/app/profile"
            className={`md:hidden w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              pathname === "/app/profile"
                ? "bg-brand-50 text-brand-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <User size={20} />
          </Link>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 transition-colors flex-1 ${
                isActive ? "text-brand-600" : "text-slate-400"
              }`}
            >
              <item.icon size={24} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
