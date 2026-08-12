"use client";

import { Card } from "./Card";
import { GroupChat } from "@/lib/mock-data";
import { MessageCircle, Lock, ShieldAlert } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";

export function GroupChatCard({ gc }: { gc: GroupChat }) {
  const { currentUser } = useCollege();

  // Access control rules
  const isBranchRestricted = gc.allowedBranch && currentUser?.branch !== gc.allowedBranch;
  const isStreamRestricted = gc.allowedStream && currentUser?.stream !== gc.allowedStream;
  const isLocked = isBranchRestricted || isStreamRestricted;

  const restrictionLabel = isBranchRestricted 
    ? `Exclusive to ${gc.allowedBranch}` 
    : isStreamRestricted 
    ? `Exclusive to ${gc.allowedStream}` 
    : null;

  return (
    <Card className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
      isLocked 
        ? "bg-slate-100/60 border-slate-200 opacity-80" 
        : "bg-slate-50/50 hover:bg-white border-dashed border-2 border-slate-200 hover:border-accent-300 shadow-sm hover:shadow-md cursor-pointer"
    }`}>
      <div className="flex items-start sm:items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
          isLocked ? "bg-slate-200 text-slate-500" : "bg-accent-100 text-accent-600"
        }`}>
          {isLocked ? <Lock size={20} /> : <MessageCircle size={20} />}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900">{gc.name}</h3>
            {isLocked && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                <ShieldAlert size={12} /> Restricted
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            {!isLocked && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {gc.activeUsers} active
              </span>
            )}
            <span className="text-xs text-slate-500">{gc.memberCount} members</span>
            
            {restrictionLabel && (
              <span className="text-xs text-amber-700 font-medium">
                • {restrictionLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 sm:mt-0 flex justify-end">
        {isLocked ? (
          <button 
            disabled 
            className="px-4 py-2 bg-slate-200 text-slate-500 font-semibold rounded-full text-xs cursor-not-allowed flex items-center gap-1.5"
            title={`You cannot join because you are in ${currentUser?.branch || currentUser?.stream}`}
          >
            <Lock size={14} /> Locked
          </button>
        ) : (
          <button className="px-5 py-2 bg-slate-900 text-white font-bold rounded-full text-sm hover:bg-slate-800 transition-colors">
            Join GC
          </button>
        )}
      </div>
    </Card>
  );
}
