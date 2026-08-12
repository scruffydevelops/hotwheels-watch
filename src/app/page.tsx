"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, MessageCircle, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-200 selection:text-brand-900 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-2xl tracking-tighter text-gradient-brand">
            Bubblr
          </div>
          <Link href="/onboarding">
            <Button size="sm">Join Now</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-600 text-sm font-medium mb-8">
            <Sparkles size={16} />
            <span>The college social network</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Find your people <br className="hidden md:block" />
            <span className="text-gradient-brand">before Day One.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Meet students from your college, discover your communities, and start college already knowing someone.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto group">
                Join Bubblr
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/app" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore App
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Abstract Bubbles Visual */}
        <div className="relative h-[400px] mt-20 flex items-center justify-center">
          {/* Central College Bubble */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="absolute z-20 w-32 h-32 bg-white rounded-full shadow-xl flex items-center justify-center flex-col border-4 border-brand-100"
          >
            <span className="text-2xl">🎓</span>
            <span className="font-bold text-xs mt-1">MSRIT</span>
          </motion.div>

          {/* Surrounding Bubbles */}
          <Bubble delay={0.4} className="absolute -top-10 left-1/4 w-20 h-20 bg-brand-100/50" icon="💻" text="CSE" />
          <Bubble delay={0.5} className="absolute top-10 right-1/4 w-24 h-24 bg-accent-100/50" icon="🎮" text="Gaming" />
          <Bubble delay={0.6} className="absolute bottom-10 left-1/3 w-16 h-16 bg-blue-100/50" icon="📅" text="2026" />
          <Bubble delay={0.7} className="absolute bottom-0 right-1/3 w-28 h-28 bg-purple-100/50" icon="🎸" text="Music" />
          <Bubble delay={0.8} className="absolute top-1/2 left-10 w-16 h-16 bg-yellow-100/50" icon="🚗" text="Cars" />

          {/* Decorative SVG connections */}
          <svg className="absolute inset-0 w-full h-full -z-10 opacity-20" preserveAspectRatio="none">
             <path d="M 50% 50% Q 25% 10% 25% -5%" stroke="currentColor" strokeWidth="2" fill="none" className="text-brand-300 stroke-dasharray-4" />
             <path d="M 50% 50% Q 75% 20% 75% 15%" stroke="currentColor" strokeWidth="2" fill="none" className="text-accent-300 stroke-dasharray-4" />
             <path d="M 50% 50% Q 30% 90% 33% 85%" stroke="currentColor" strokeWidth="2" fill="none" className="text-blue-300 stroke-dasharray-4" />
             <path d="M 50% 50% Q 70% 90% 66% 100%" stroke="currentColor" strokeWidth="2" fill="none" className="text-purple-300 stroke-dasharray-4" />
          </svg>
        </div>
      </main>

      {/* Value Prop Section */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything you need to connect</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MapPin className="text-brand-500 w-8 h-8" />}
              title="Meet your batch"
              desc="Filter students by your college, branch, and exact graduation year."
            />
            <FeatureCard 
              icon={<MessageCircle className="text-accent-500 w-8 h-8" />}
              title="Join communities"
              desc="Jump into live group chats for your branch, hostels, or specific clubs."
            />
            <FeatureCard 
              icon={<Users className="text-brand-500 w-8 h-8" />}
              title="Find people like you"
              desc="Connect over shared interests like gaming, coding, music, and more."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-slate-500 text-sm border-t border-slate-100">
        &copy; {new Date().getFullYear()} Bubblr. Find your people.
      </footer>
    </div>
  );
}

function Bubble({ className, icon, text, delay }: { className?: string, icon: string, text: string, delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", delay }}
      className={`rounded-full flex flex-col items-center justify-center backdrop-blur-sm border border-white/50 shadow-sm ${className}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-semibold text-slate-700 mt-1">{text}</span>
    </motion.div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <Card className="p-8 text-center hover:shadow-md transition-shadow border-slate-100 bg-slate-50/50">
      <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </Card>
  )
}
