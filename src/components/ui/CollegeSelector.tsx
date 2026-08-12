"use client";

import { useState } from "react";
import { ChevronDown, Search, Plus, MapPin, Users, GraduationCap } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { COLLEGES, STREAMS } from "@/lib/mock-data";
import { Input } from "./Input";

export function CollegeSelector() {
  const { activeCollege, setActiveCollege } = useCollege();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStream, setSelectedStream] = useState<string>("All");

  const filteredColleges = COLLEGES.filter(c => {
    const matchesStream = selectedStream === "All" || c.streams.includes(selectedStream);
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.shortName.toLowerCase().includes(search.toLowerCase());
    return matchesStream && matchesSearch;
  });

  if (!activeCollege) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors font-bold text-slate-900"
      >
        <span>{activeCollege.shortName}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-96 max-h-[460px] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-3 animate-in fade-in slide-in-from-top-2">
            
            {/* Search Bar */}
            <div className="mb-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <Input 
                  placeholder="Search colleges..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 text-sm bg-slate-50 border-transparent focus-visible:ring-1"
                />
              </div>
            </div>

            {/* Stream Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 custom-scrollbar text-xs font-semibold shrink-0">
              <button
                onClick={() => setSelectedStream("All")}
                className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  selectedStream === "All"
                    ? "bg-slate-900 text-white font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Streams
              </button>
              {STREAMS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStream(s.name)}
                  className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap flex items-center gap-1 ${
                    selectedStream === s.name
                      ? "bg-brand-600 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* College List */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-1 custom-scrollbar">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Currently Selected</div>
              <button 
                className="w-full text-left p-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-900 font-semibold mb-3"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center justify-between">
                  <div className="line-clamp-1">{activeCollege.name}</div>
                  <span className="text-xs px-2 py-0.5 bg-brand-200 text-brand-800 rounded font-bold">{activeCollege.shortName}</span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {activeCollege.streams.map(st => (
                    <span key={st} className="text-[10px] font-bold px-2 py-0.5 bg-white text-brand-700 rounded-full border border-brand-200">
                      {st}
                    </span>
                  ))}
                </div>
              </button>

              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Other Colleges ({filteredColleges.filter(c => c.id !== activeCollege.id).length})
              </div>
              
              {filteredColleges.filter(c => c.id !== activeCollege.id).map(college => (
                <button 
                  key={college.id}
                  onClick={() => {
                    setActiveCollege(college);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">{college.name}</div>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded shrink-0 ml-2">
                      {college.shortName}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <div className="flex gap-1 flex-wrap">
                      {college.streams.map(st => (
                        <span key={st} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                          {st.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 shrink-0"><Users size={12} /> {college.memberCount}</span>
                  </div>
                </button>
              ))}

              {filteredColleges.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">
                  No colleges found for this stream search.
                </div>
              )}
            </div>

            <div className="p-2 border-t border-slate-100 mt-2 shrink-0">
              <button className="w-full flex items-center gap-2 justify-center py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                <Plus size={16} /> Request to add college
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
