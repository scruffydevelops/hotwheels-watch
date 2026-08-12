"use client";

import { useCollege } from "@/contexts/CollegeContext";
import { MOCK_GROUP_CHATS } from "@/lib/mock-data";
import { GroupChatCard } from "@/components/ui/GroupChatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GroupChatsPage() {
  const { activeCollege } = useCollege();
  
  if (!activeCollege) return null;

  const groupChats = MOCK_GROUP_CHATS.filter(gc => gc.collegeId === activeCollege.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Group Chats</h1>
          <p className="text-slate-500">Join conversations happening right now.</p>
        </div>
        <Button size="sm" variant="secondary">Create Group Chat</Button>
      </header>

      {groupChats.length > 0 ? (
        <div className="grid gap-3">
          {groupChats.map(gc => (
            <GroupChatCard key={gc.id} gc={gc} />
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={MessageCircle}
          title="No group chats yet."
          description="Start one for your batch, branch or interests."
          actionText="Create Group Chat"
          onAction={() => console.log('Open modal')}
        />
      )}
    </div>
  );
}
