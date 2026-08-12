"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { COLLEGES, MOCK_USERS, College, User } from "@/lib/mock-data";

const MAX_COLLEGE_CHANGES = 3;

interface UserProfile {
  user: User;
  college: College;
  collegeChangesRemaining: number;
}

interface CollegeContextType {
  activeCollege: College | null;
  currentUser: User | null;
  collegeChangesRemaining: number;
  setActiveCollege: (college: College) => boolean; // returns false if cap reached
  updateUserProfile: (updates: Partial<User>) => void;
  isLoading: boolean;
}

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

export function CollegeProvider({ children }: { children: React.ReactNode }) {
  const [activeCollege, setActiveCollegeState] = useState<College | null>(COLLEGES[0]);
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_USERS[0]);
  const [collegeChangesRemaining, setCollegeChangesRemaining] = useState(MAX_COLLEGE_CHANGES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedCollegeId = localStorage.getItem("activeCollegeId");
    const savedChanges = localStorage.getItem("collegeChangesRemaining");
    const savedUser = localStorage.getItem("currentUser");

    if (savedCollegeId) {
      const found = COLLEGES.find(c => c.id === savedCollegeId);
      if (found) setActiveCollegeState(found);
    }
    if (savedChanges) {
      setCollegeChangesRemaining(parseInt(savedChanges));
    }
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch {}
    }
    setIsLoading(false);
  }, []);

  const setActiveCollege = (college: College): boolean => {
    // If it's the same college, just allow it
    if (activeCollege?.id === college.id) return true;
    
    // Check if user has changes remaining
    if (collegeChangesRemaining <= 0) return false;

    const newRemaining = collegeChangesRemaining - 1;
    setActiveCollegeState(college);
    setCollegeChangesRemaining(newRemaining);
    localStorage.setItem("activeCollegeId", college.id);
    localStorage.setItem("collegeChangesRemaining", newRemaining.toString());

    // Update user college too
    if (currentUser) {
      const updated = { ...currentUser, collegeId: college.id };
      setCurrentUser(updated);
      localStorage.setItem("currentUser", JSON.stringify(updated));
    }

    return true;
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (currentUser) {
      const updated = { ...currentUser, ...updates };
      setCurrentUser(updated);
      localStorage.setItem("currentUser", JSON.stringify(updated));
    }
  };

  return (
    <CollegeContext.Provider value={{ 
      activeCollege, 
      currentUser, 
      collegeChangesRemaining,
      setActiveCollege, 
      updateUserProfile,
      isLoading 
    }}>
      {children}
    </CollegeContext.Provider>
  );
}

export function useCollege() {
  const context = useContext(CollegeContext);
  if (context === undefined) {
    throw new Error("useCollege must be used within a CollegeProvider");
  }
  return context;
}
