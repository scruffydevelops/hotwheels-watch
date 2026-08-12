"use client";

import { useCollege } from "@/contexts/CollegeContext";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CommunitiesPage() {
  const { activeCollege } = useCollege();
  
  if (!activeCollege) return null;

  const communities = MOCK_COMMUNITIES.filter(c => c.collegeId === activeCollege.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{activeCollege.shortName} Communities</h1>
          <p className="text-slate-500">Find your people before college starts.</p>
        </div>
        <Button size="sm">Create Community</Button>
      </header>

      {communities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communities.map(community => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Hash}
          title="No communities yet."
          description="Be the first person to create one."
          actionText="Create Community"
          onAction={() => console.log('Open modal')}
        />
      )}
    </div>
  );
}
