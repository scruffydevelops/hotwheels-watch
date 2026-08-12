"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, Search, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { COLLEGES, STREAMS, STREAM_BRANCHES, BATCHES, INTERESTS } from "@/lib/mock-data";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    stream: "Engineering", // default stream
    college: "",
    branch: "",
    batch: "",
    name: "",
    username: "",
    bio: "",
    interests: [] as string[],
  });

  const TOTAL_STEPS = 6;

  const nextStep = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const isStepValid = () => {
    switch(step) {
      case 1: return formData.stream !== "";
      case 2: return formData.college !== "";
      case 3: return formData.branch !== "";
      case 4: return formData.batch !== "";
      case 5: return formData.name !== "" && formData.username !== "";
      default: return true;
    }
  };

  const handleComplete = () => {
    router.push("/app");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-10 px-6">
      <div className="max-w-xl mx-auto w-full">
        {/* Header & Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={prevStep} 
              disabled={step === 1}
              className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-opacity"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="text-sm font-semibold text-slate-500">
              Step {step} of {TOTAL_STEPS}
            </div>
            <div className="w-10"></div> {/* Spacer */}
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} />
        </div>

        {/* Content */}
        <div className="min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {step === 1 && (
                <StepStream formData={formData} setFormData={setFormData} />
              )}
              {step === 2 && (
                <StepCollege formData={formData} setFormData={setFormData} />
              )}
              {step === 3 && (
                <StepBranch formData={formData} setFormData={setFormData} />
              )}
              {step === 4 && (
                <StepBatch formData={formData} setFormData={setFormData} />
              )}
              {step === 5 && (
                <StepProfile 
                  formData={formData} 
                  setFormData={setFormData} 
                  handleInterestToggle={handleInterestToggle} 
                />
              )}
              {step === 6 && (
                <StepPreview formData={formData} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="mt-8 pb-12 flex justify-end">
          {step < TOTAL_STEPS ? (
            <Button onClick={nextStep} disabled={!isStepValid()} size="lg" className="w-full sm:w-auto">
              Continue <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <div className="w-full flex flex-col sm:flex-row gap-4">
              <Button variant="outline" onClick={prevStep} size="lg" className="w-full sm:w-auto">
                Edit Profile
              </Button>
              <Button onClick={handleComplete} size="lg" className="w-full sm:w-auto">
                Jump In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Choose Stream
function StepStream({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Which stream are you in? 🎓</h2>
        <p className="text-slate-500">We'll show you relevant colleges, courses and communities.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STREAMS.map((stream) => {
          const isSelected = formData.stream === stream.name;
          return (
            <button
              key={stream.id}
              onClick={() => {
                setFormData({
                  ...formData,
                  stream: stream.name,
                  branch: "", // reset branch when stream changes
                  college: "" // reset college choice if needed
                });
              }}
              className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-32 ${
                isSelected
                  ? "border-brand-500 bg-brand-50 shadow-md ring-2 ring-brand-200"
                  : "border-slate-100 hover:border-brand-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="text-3xl">{stream.icon}</span>
              <div>
                <div className={`font-bold text-base ${isSelected ? "text-brand-900" : "text-slate-900"}`}>
                  {stream.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 2: Choose College (Filtered by Stream)
function StepCollege({ formData, setFormData }: any) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter colleges that match the selected stream (or all if not specified)
  const filteredColleges = COLLEGES.filter(c => {
    const matchesStream = !formData.stream || c.streams.includes(formData.stream);
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.shortName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStream && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-block px-3 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded-full mb-2">
          {formData.stream || "All Streams"} Colleges
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Select your college</h2>
        <p className="text-slate-500 text-sm">Showing colleges offering {formData.stream}.</p>
      </div>
      
      <div className="relative">
        <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
        <Input 
          placeholder={`Search ${formData.stream} colleges...`} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12"
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {filteredColleges.map((college) => (
          <button
            key={college.id}
            onClick={() => {
              setFormData({...formData, college: college.name});
            }}
            className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all ${
              formData.college === college.name 
                ? "border-brand-500 bg-brand-50 shadow-sm" 
                : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900">{college.name}</div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                {college.shortName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{college.city}</span>
              <span>•</span>
              <span>{college.memberCount} members</span>
            </div>
          </button>
        ))}
        {filteredColleges.length === 0 && (
          <div className="text-center p-6 text-slate-500">
            No colleges found for "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
}

// Step 3: Choose Stream-Specific Branch
function StepBranch({ formData, setFormData }: any) {
  const currentStream = formData.stream || "Engineering";
  const branches = STREAM_BRANCHES[currentStream] || STREAM_BRANCHES["Engineering"];

  return (
    <div>
      <div className="inline-block px-3 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded-full mb-2">
        {currentStream} Courses
      </div>
      <h2 className="text-3xl font-extrabold mb-2">What is your degree / branch?</h2>
      <p className="text-slate-500 mb-6">Select your course in {currentStream}.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
        {branches.map(branch => (
          <div 
            key={branch}
            onClick={() => setFormData({...formData, branch})}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all text-center ${
              formData.branch === branch 
                ? 'border-brand-500 bg-brand-50 shadow-sm font-bold text-brand-700' 
                : 'border-slate-100 hover:border-brand-200 bg-white font-medium text-slate-800'
            }`}
          >
            {branch}
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 4: Select Batch
function StepBatch({ formData, setFormData }: any) {
  return (
    <div>
      <h2 className="text-3xl font-extrabold mb-2">Which batch?</h2>
      <p className="text-slate-500 mb-8">We'll prioritize showing you people from your year.</p>
      
      <div className="space-y-3">
        {BATCHES.map(batch => (
          <div 
            key={batch}
            onClick={() => setFormData({...formData, batch})}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all text-center ${
              formData.batch === batch 
                ? 'border-brand-500 bg-brand-50 shadow-sm font-bold text-brand-700' 
                : 'border-slate-100 hover:border-brand-200 bg-white font-medium'
            }`}
          >
            {batch}
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 5: Profile Setup
function StepProfile({ formData, setFormData, handleInterestToggle }: any) {
  return (
    <div>
      <h2 className="text-3xl font-extrabold mb-2">Tell us about yourself</h2>
      <p className="text-slate-500 mb-6">Set up your profile so others can know you better.</p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-semibold mb-1 block">Full Name</label>
          <Input 
            placeholder="E.g., Rahul Kumar" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <label className="text-sm font-semibold mb-1 block">Username</label>
          <Input 
            placeholder="E.g., rahul26" 
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
          />
        </div>
        <div>
          <label className="text-sm font-semibold mb-1 block">Short Bio (Optional)</label>
          <Input 
            placeholder="Electronics nerd who loves cars..." 
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
          />
        </div>
      </div>

      <h3 className="text-lg font-bold mb-3">Interests</h3>
      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
        {INTERESTS.map(interest => (
          <Badge 
            key={interest}
            selected={formData.interests.includes(interest)}
            onClick={() => handleInterestToggle(interest)}
          >
            {interest}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Step 6: Preview
function StepPreview({ formData }: any) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-extrabold mb-2">Looking good! ✨</h2>
      <p className="text-slate-500 mb-8">This is how you'll appear to others on Bubblr.</p>
      
      <Card className="max-w-sm mx-auto overflow-hidden">
        <div className="h-24 bg-gradient-brand"></div>
        <div className="px-6 pb-6 relative">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 mx-auto -mt-12 mb-4 overflow-hidden shadow-sm">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username || 'user'}`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900">{formData.name || "Student"}</h3>
          <p className="text-sm font-medium text-brand-600 mb-2">@{formData.username || "username"}</p>
          
          <div className="flex flex-wrap justify-center items-center gap-1.5 text-xs font-semibold text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl">
            <span className="font-bold text-brand-700">{formData.stream}</span>
            <span>•</span>
            <span>{formData.college ? formData.college.substring(0, 20) : "College"}</span>
            <span>•</span>
            <span>{formData.branch}</span>
          </div>
          
          {formData.bio && (
            <p className="text-slate-600 text-sm mb-4">"{formData.bio}"</p>
          )}
          
          <div className="flex flex-wrap justify-center gap-1.5">
            {formData.interests.map((interest: string) => (
              <span key={interest} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
                {interest}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
