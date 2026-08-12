"use client";

import { useState } from "react";
import { Search, Hash, MessageCircle, User } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { MOCK_COMMUNITIES, MOCK_GROUP_CHATS, MOCK_USERS } from "@/lib/mock-data";

export function GlobalSearch() {
  const { activeCollege } = useCollege();
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Filter based on selected college and search query
  const communities = MOCK_COMMUNITIES.filter(c => c.collegeId === activeCollege?.id && c.name.toLowerCase().includes(search.toLowerCase()));
  const groupChats = MOCK_GROUP_CHATS.filter(c => c.collegeId === activeCollege?.id && c.name.toLowerCase().includes(search.toLowerCase()));
  const people = MOCK_USERS.filter(u => u.collegeId === activeCollege?.id && (u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())));

  const hasResults = search.length > 0 && (communities.length > 0 || groupChats.length > 0 || people.length > 0);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className={`relative flex items-center w-full h-12 rounded-full border-2 transition-colors ${isFocused ? 'border-brand-500 bg-white shadow-md' : 'border-slate-200 bg-slate-100/50 hover:bg-slate-100'}`}>
        <Search size={20} className={`absolute left-4 ${isFocused ? 'text-brand-500' : 'text-slate-400'}`} />
        <input 
          type="text"
          placeholder="Search communities, GCs, people..."
          className="w-full h-full bg-transparent pl-12 pr-4 text-sm font-medium focus:outline-none placeholder:text-slate-500 rounded-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay so clicks on results register
        />
      </div>

      {isFocused && search.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="max-h-96 overflow-y-auto p-2">
            {!hasResults ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No results found for "{search}".
              </div>
            ) : (
              <>
                {/* Communities Results */}
                {communities.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 text-xs font-bold text-brand-600 uppercase tracking-wider">Communities</div>
                    {communities.slice(0, 3).map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600"><Hash size={16} /></div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900 line-clamp-1">{c.name}</div>
                          <div className="text-xs text-slate-500">{c.memberCount} members</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Group Chats Results */}
                {groupChats.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 text-xs font-bold text-accent-600 uppercase tracking-wider">Group Chats</div>
                    {groupChats.slice(0, 3).map(gc => (
                      <div key={gc.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                        <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-600"><MessageCircle size={16} /></div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900 line-clamp-1">{gc.name}</div>
                          <div className="text-xs text-slate-500">{gc.activeUsers} active now</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* People Results */}
                {people.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">People</div>
                    {people.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                        <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-full bg-slate-200" />
                        <div>
                          <div className="font-semibold text-sm text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">@{p.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
