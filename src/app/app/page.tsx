"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MOCK_COMMUNITIES, MOCK_GROUP_CHATS } from "@/lib/mock-data";
import Link from "next/link";
import { useCollege } from "@/contexts/CollegeContext";

export default function AppHome() {
  const { activeCollege } = useCollege();
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  if (!activeCollege) return null;

  const toggleJoin = (id: string) => {
    setJoinedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Filter data by active college
  const activeCommunities = MOCK_COMMUNITIES.filter(c => c.collegeId === activeCollege.id);
  const activeGroupChats = MOCK_GROUP_CHATS.filter(gc => gc.collegeId === activeCollege.id);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          {activeCollege.shortName}
        </h1>
        <p className="text-slate-500">
          {activeCollege.city}
        </p>
      </header>

      {/* Quick Nav Links */}
      <div className="flex gap-4">
        <Link href="/app/communities" className="flex-1">
          <Card className="p-4 border-none shadow-sm bg-brand-50 text-brand-700 font-bold text-center hover:bg-brand-100 transition-colors cursor-pointer">
            Communities
          </Card>
        </Link>
        <Link href="/app/group-chats" className="flex-1">
          <Card className="p-4 border-none shadow-sm bg-accent-50 text-accent-700 font-bold text-center hover:bg-accent-100 transition-colors cursor-pointer">
            Group Chats
          </Card>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-3 bg-white rounded-2xl border border-slate-100">
          <div className="text-xl font-bold text-slate-900">{activeCollege.memberCount}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Members</div>
        </div>
        <div className="text-center p-3 bg-white rounded-2xl border border-slate-100">
          <div className="text-xl font-bold text-slate-900">{activeCommunities.length}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Communities</div>
        </div>
        <div className="text-center p-3 bg-white rounded-2xl border border-slate-100">
          <div className="text-xl font-bold text-slate-900">{activeGroupChats.length}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Group Chats</div>
        </div>
      </div>

      {/* Popular Right Now */}
      <section>
        <div className="flex items-center justify-between mb-4 mt-8">
          <h2 className="text-xl font-bold text-slate-900">Popular right now</h2>
        </div>
        <div className="grid gap-3">
          {activeCommunities.slice(0, 3).map(community => (
            <Card key={community.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl">
                  {community.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{community.name}</h3>
                  <p className="text-sm text-slate-500">{community.memberCount} members</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={joinedIds.has(community.id) ? "outline" : "secondary"}
                onClick={() => toggleJoin(community.id)}
              >
                {joinedIds.has(community.id) ? "Joined" : "Join"}
              </Button>
            </Card>
          ))}
          {activeCommunities.length === 0 && (
            <div className="text-center p-8 text-slate-500 bg-white rounded-3xl border border-slate-100">
              No popular communities yet in {activeCollege.shortName}.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
