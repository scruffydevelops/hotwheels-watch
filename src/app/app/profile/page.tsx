"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { COLLEGES, STREAMS, STREAM_BRANCHES, BATCHES, INTERESTS, College } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useCollege } from "@/contexts/CollegeContext";
import { Edit3, Lock, ShieldAlert, Check, X, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { activeCollege, currentUser, collegeChangesRemaining, setActiveCollege, updateUserProfile } = useCollege();
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Form State
  const [editData, setEditData] = useState({
    name: currentUser?.name || "",
    username: currentUser?.username || "",
    bio: currentUser?.bio || "",
    collegeId: activeCollege?.id || "msrit",
    stream: currentUser?.stream || "Engineering",
    branch: currentUser?.branch || "Telecommunication (ETE)",
    batch: currentUser?.batch || "2026–2030",
    interests: currentUser?.interests || [],
  });

  if (!activeCollege || !currentUser) return null;

  const handleOpenEdit = () => {
    setEditData({
      name: currentUser.name,
      username: currentUser.username,
      bio: currentUser.bio,
      collegeId: activeCollege.id,
      stream: currentUser.stream,
      branch: currentUser.branch,
      batch: currentUser.batch,
      interests: currentUser.interests,
    });
    setErrorMsg("");
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    // If college changed, check cap
    if (editData.collegeId !== activeCollege.id) {
      const targetCollege = COLLEGES.find(c => c.id === editData.collegeId);
      if (targetCollege) {
        const success = setActiveCollege(targetCollege);
        if (!success) {
          setErrorMsg("You have reached the maximum allowed college changes (3 cap). You cannot change colleges anymore.");
          return;
        }
      }
    }

    // Update profile
    updateUserProfile({
      name: editData.name,
      username: editData.username,
      bio: editData.bio,
      stream: editData.stream,
      branch: editData.branch,
      batch: editData.batch,
      interests: editData.interests,
    });

    setIsEditing(false);
  };

  const handleInterestToggle = (interest: string) => {
    setEditData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const availableBranches = STREAM_BRANCHES[editData.stream] || STREAM_BRANCHES["Engineering"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Profile</h1>
          <p className="text-slate-500 text-sm">Manage your student identity & college settings.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleOpenEdit} className="gap-2">
          <Edit3 size={16} /> Edit Profile
        </Button>
      </header>

      {/* Main Profile Card */}
      <Card className="overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-brand"></div>
        <div className="px-6 sm:px-8 pb-8 relative">
          <div className="w-28 h-28 rounded-full border-4 border-white bg-slate-200 -mt-14 mb-4 overflow-hidden shadow-md">
            <img 
              src={currentUser.avatarUrl} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">{currentUser.name}</h3>
              <p className="text-sm font-semibold text-brand-600">@{currentUser.username}</p>
            </div>
            
            {/* College Badge & Change Cap Counter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
                {activeCollege.name}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1" title="Cap on college switches to prevent spam">
                <ShieldAlert size={12} /> {collegeChangesRemaining} / 3 Switches Left
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700 mb-6 bg-slate-100/70 p-3 rounded-2xl">
            <span className="font-bold text-brand-700">{currentUser.stream}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <span>{currentUser.branch}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <span>Batch {currentUser.batch}</span>
          </div>
          
          <div className="mb-8">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About Bio</h4>
            <p className="text-slate-700 leading-relaxed font-medium">"{currentUser.bio || "No bio added yet."}"</p>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {currentUser.interests.map((interest: string) => (
                <span key={interest} className="px-3.5 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-bold">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Edit Profile</h2>
                <p className="text-xs text-slate-500">Update your student information & college.</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-slate-900 rounded-full">
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <div className="space-y-5">
              {/* Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Full Name</label>
                  <Input 
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Username</label>
                  <Input 
                    value={editData.username}
                    onChange={(e) => setEditData({...editData, username: e.target.value})}
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Bio</label>
                <Input 
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                />
              </div>

              {/* College Selection with Cap */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Select College
                  </label>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    collegeChangesRemaining > 0 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {collegeChangesRemaining} / 3 Switches Left
                  </span>
                </div>

                {collegeChangesRemaining <= 0 && editData.collegeId !== activeCollege.id ? (
                  <div className="p-3 bg-rose-100 text-rose-900 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <Lock size={16} /> College change cap reached. You cannot switch colleges further.
                  </div>
                ) : (
                  <select 
                    value={editData.collegeId}
                    disabled={collegeChangesRemaining <= 0}
                    onChange={(e) => setEditData({...editData, collegeId: e.target.value})}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {COLLEGES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.shortName})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Stream & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Stream</label>
                  <select 
                    value={editData.stream}
                    onChange={(e) => {
                      const newStream = e.target.value;
                      const newBranches = STREAM_BRANCHES[newStream] || [];
                      setEditData({
                        ...editData, 
                        stream: newStream,
                        branch: newBranches[0] || editData.branch
                      });
                    }}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {STREAMS.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Branch / Course</label>
                  <select 
                    value={editData.branch}
                    onChange={(e) => setEditData({...editData, branch: e.target.value})}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {availableBranches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Batch</label>
                <select 
                  value={editData.batch}
                  onChange={(e) => setEditData({...editData, batch: e.target.value})}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {BATCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Interests */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">Interests</label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100">
                  {INTERESTS.map(interest => (
                    <Badge 
                      key={interest}
                      selected={editData.interests.includes(interest)}
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
