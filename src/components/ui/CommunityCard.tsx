"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Community } from "@/lib/mock-data";

export function CommunityCard({ community }: { community: Community }) {
  const [joined, setJoined] = useState(false);

  return (
    <Card className="p-5 flex flex-col hover:shadow-md transition-shadow h-full cursor-pointer">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">
          {community.icon}
        </div>
        <div>
          <div className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">{community.category}</div>
          <h3 className="font-bold text-lg text-slate-900 leading-tight">{community.name}</h3>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 mb-6 flex-1 line-clamp-2">
        {community.description}
      </p>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="text-xs font-semibold text-slate-500">
          {community.memberCount.toLocaleString()} members
        </div>
        <Button
          size="sm"
          variant={joined ? "outline" : "secondary"}
          onClick={() => setJoined(j => !j)}
        >
          {joined ? "Joined" : "Join"}
        </Button>
      </div>
    </Card>
  );
}
