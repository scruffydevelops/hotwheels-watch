"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MOCK_USERS } from "@/lib/mock-data";
import { useCollege } from "@/contexts/CollegeContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

export default function PeoplePage() {
  const { activeCollege } = useCollege();
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  if (!activeCollege) return null;

  const toggleConnect = (id: string) => {
    setConnectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const people = MOCK_USERS.filter(u => u.collegeId === activeCollege.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">People</h1>
        <p className="text-slate-500">Discover students in your batch and college.</p>
      </header>

      {people.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {people.map(person => (
            <Card key={person.id} className="p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <img src={person.avatarUrl} alt={person.name} className="w-20 h-20 rounded-full bg-slate-100 mb-4 border-2 border-white shadow-sm" />
              <h3 className="font-bold text-lg text-slate-900">{person.name}</h3>
              <p className="text-xs font-semibold text-brand-600 mb-1">{person.branch}</p>
              <p className="text-xs text-slate-500 mb-4">Batch of {person.batch}</p>
              <Button
                size="sm"
                variant={connectedIds.has(person.id) ? "outline" : "secondary"}
                className="w-full"
                onClick={() => toggleConnect(person.id)}
              >
                {connectedIds.has(person.id) ? "Connected" : "Connect"}
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Users}
          title="No people found."
          description="It's a bit lonely here. Invite your friends!"
          actionText="Invite Friends"
          onAction={() => console.log('Open invite modal')}
        />
      )}
    </div>
  );
}
