// Types
export interface College {
  id: string;
  name: string;
  shortName: string;
  city: string;
  streams: string[]; // e.g. ["Engineering", "Commerce"]
  memberCount: number;
}

export interface Community {
  id: string;
  collegeId: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  icon: string;
}

export interface GroupChat {
  id: string;
  collegeId: string;
  name: string;
  memberCount: number;
  activeUsers: number;
  allowedStream?: string; // Optional: restriction by stream
  allowedBranch?: string; // Optional: restriction by branch
}

export interface User {
  id: string;
  name: string;
  username: string;
  collegeId: string;
  stream: string;
  branch: string;
  batch: string;
  bio: string;
  interests: string[];
  avatarUrl: string;
}

// Available Streams
export const STREAMS = [
  { id: "engg", name: "Engineering", icon: "⚙️", color: "from-blue-500 to-indigo-600" },
  { id: "comm", name: "Commerce", icon: "📊", color: "from-emerald-500 to-teal-600" },
  { id: "mgmt", name: "Management / BBA", icon: "💼", color: "from-purple-500 to-violet-600" },
  { id: "sci", name: "Science & Tech / BCA", icon: "🧪", color: "from-cyan-500 to-blue-600" },
  { id: "arts", name: "Arts & Humanities", icon: "🎨", color: "from-amber-500 to-orange-600" },
  { id: "law", name: "Law", icon: "⚖️", color: "from-rose-500 to-pink-600" }
];

// Unique branches for each stream
export const STREAM_BRANCHES: Record<string, string[]> = {
  "Engineering": [
    "Computer Science (CSE)",
    "AI & Machine Learning",
    "Information Science (ISE)",
    "Electronics & Comm (ECE)",
    "Telecommunication (ETE)",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering (EEE)",
    "Aerospace Engineering",
    "Data Science"
  ],
  "Commerce": [
    "B.Com (General)",
    "B.Com (Finance & Accounts)",
    "B.Com (Honours)",
    "B.Com (International Finance)",
    "B.Com (Corporate Accounting)",
    "CA / CS Integrated",
    "M.Com"
  ],
  "Management / BBA": [
    "BBA (General)",
    "BBA (Business Analytics)",
    "BBA (Digital Marketing)",
    "BBA (Finance & Banking)",
    "BBA (Human Resources)",
    "BBA (Aviation Management)",
    "MBA"
  ],
  "Science & Tech / BCA": [
    "BCA (Computer Applications)",
    "B.Sc (Data Science)",
    "B.Sc (Biotechnology)",
    "B.Sc (Cyber Security)",
    "B.Sc (Physics & Maths)",
    "B.Sc (Artificial Intelligence)"
  ],
  "Arts & Humanities": [
    "BA (Journalism & Mass Comm)",
    "BA (Psychology)",
    "BA (English Literature)",
    "BA (Economics)",
    "BA (Political Science)",
    "BA (Visual Arts)"
  ],
  "Law": [
    "BA LL.B (Honours)",
    "BBA LL.B (Honours)",
    "LL.B (3 Years)",
    "LL.M"
  ]
};

// Default branches fallback
export const BRANCHES = STREAM_BRANCHES["Engineering"];

// Complete List of Colleges from User Provided Data
export const COLLEGES: College[] = [
  // Engineering Colleges
  { id: "msrit", name: "MS Ramaiah Institute of Technology", shortName: "MSRIT", city: "Bangalore", streams: ["Engineering"], memberCount: 1428 },
  { id: "rvce", name: "RV College of Engineering", shortName: "RVCE", city: "Bangalore", streams: ["Engineering"], memberCount: 1354 },
  { id: "bmsce", name: "BMS College of Engineering", shortName: "BMSCE", city: "Bangalore", streams: ["Engineering"], memberCount: 1202 },
  { id: "bmsit", name: "BMS Institute of Technology & Management", shortName: "BMSIT", city: "Bangalore", streams: ["Engineering"], memberCount: 980 },
  { id: "pesu", name: "PES University", shortName: "PESU", city: "Bangalore", streams: ["Engineering", "Management / BBA", "Commerce", "Law"], memberCount: 1840 },
  { id: "dsce", name: "Dayananda Sagar College of Engineering", shortName: "DSCE", city: "Bangalore", streams: ["Engineering"], memberCount: 1320 },
  { id: "dsu", name: "Dayananda Sagar University", shortName: "DSU", city: "Bangalore", streams: ["Engineering", "Management / BBA", "Commerce"], memberCount: 890 },
  { id: "bit", name: "Bangalore Institute of Technology", shortName: "BIT", city: "Bangalore", streams: ["Engineering"], memberCount: 1050 },
  { id: "cmrit", name: "CMR Institute of Technology", shortName: "CMRIT", city: "Bangalore", streams: ["Engineering"], memberCount: 910 },
  { id: "cmru", name: "CMR University", shortName: "CMRU", city: "Bangalore", streams: ["Engineering", "Management / BBA", "Law", "Commerce"], memberCount: 760 },
  { id: "nhce", name: "New Horizon College of Engineering", shortName: "NHCE", city: "Bangalore", streams: ["Engineering"], memberCount: 1120 },
  { id: "rnsit", name: "RNS Institute of Technology", shortName: "RNSIT", city: "Bangalore", streams: ["Engineering"], memberCount: 870 },
  { id: "bnmit", name: "BNM Institute of Technology", shortName: "BNMIT", city: "Bangalore", streams: ["Engineering"], memberCount: 650 },
  { id: "acharya", name: "Acharya Institute of Technology", shortName: "AIT", city: "Bangalore", streams: ["Engineering"], memberCount: 940 },
  { id: "alliance", name: "Alliance College of Engineering and Design", shortName: "Alliance", city: "Bangalore", streams: ["Engineering", "Management / BBA", "Law"], memberCount: 820 },
  { id: "amc", name: "AMC Engineering College", shortName: "AMC", city: "Bangalore", streams: ["Engineering"], memberCount: 540 },
  { id: "brindavan", name: "Brindavan College of Engineering", shortName: "Brindavan", city: "Bangalore", streams: ["Engineering"], memberCount: 410 },
  { id: "btl", name: "BTL Institute of Technology", shortName: "BTLIT", city: "Bangalore", streams: ["Engineering"], memberCount: 320 },
  { id: "dbit", name: "Don Bosco Institute of Technology", shortName: "DBIT", city: "Bangalore", streams: ["Engineering"], memberCount: 610 },
  { id: "gat", name: "Global Academy of Technology", shortName: "GAT", city: "Bangalore", streams: ["Engineering"], memberCount: 730 },
  { id: "hkbk", name: "HKBK College of Engineering", shortName: "HKBK", city: "Bangalore", streams: ["Engineering"], memberCount: 480 },
  { id: "jssate", name: "JSS Academy of Technical Education", shortName: "JSSATE", city: "Bangalore", streams: ["Engineering"], memberCount: 790 },
  { id: "ruas", name: "MS Ramaiah University of Applied Sciences", shortName: "RUAS", city: "Bangalore", streams: ["Engineering", "Science & Tech / BCA", "Management / BBA"], memberCount: 890 },
  { id: "mvjce", name: "MVJ College of Engineering", shortName: "MVJCE", city: "Bangalore", streams: ["Engineering"], memberCount: 830 },
  { id: "oxford", name: "Oxford College of Engineering", shortName: "Oxford", city: "Bangalore", streams: ["Engineering"], memberCount: 620 },
  { id: "presidency_univ", name: "Presidency University", shortName: "PU", city: "Bangalore", streams: ["Engineering", "Commerce", "Management / BBA", "Law"], memberCount: 1450 },
  { id: "rvu", name: "RV University", shortName: "RVU", city: "Bangalore", streams: ["Engineering", "Commerce", "Management / BBA", "Arts & Humanities"], memberCount: 780 },
  { id: "reva", name: "REVA University", shortName: "REVA", city: "Bangalore", streams: ["Engineering", "Commerce", "Management / BBA", "Arts & Humanities", "Law"], memberCount: 1920 },
  { id: "sambhram", name: "Sambhram Institute of Technology", shortName: "SaIT", city: "Bangalore", streams: ["Engineering"], memberCount: 450 },
  { id: "sapthagiri", name: "Sapthagiri College of Engineering", shortName: "SCE", city: "Bangalore", streams: ["Engineering"], memberCount: 670 },
  { id: "pillappa", name: "Shri Pillappa College of Engineering", shortName: "SPCE", city: "Bangalore", streams: ["Engineering"], memberCount: 290 },
  { id: "sairam", name: "Sri Sairam College of Engineering", shortName: "SSCE", city: "Bangalore", streams: ["Engineering"], memberCount: 510 },
  { id: "svce", name: "Sri Venkateshwara College of Engineering", shortName: "SVCE", city: "Bangalore", streams: ["Engineering"], memberCount: 580 },
  { id: "svyasa", name: "Bosscoder School of Technology (S-VYASA)", shortName: "BST", city: "Bangalore", streams: ["Engineering", "Science & Tech / BCA"], memberCount: 390 },
  { id: "tjohn", name: "T John Institute of Technology", shortName: "TJIT", city: "Bangalore", streams: ["Engineering"], memberCount: 430 },
  { id: "uvce", name: "University Visvesvaraya College of Engineering", shortName: "UVCE", city: "Bangalore", streams: ["Engineering"], memberCount: 1150 },

  // Commerce & Arts Colleges
  { id: "jnc", name: "Jyoti Nivas College", shortName: "JNC", city: "Bangalore", streams: ["Commerce", "Arts & Humanities", "Management / BBA"], memberCount: 940 },
  { id: "christ_comm", name: "Christ University - School of Commerce", shortName: "Christ", city: "Bangalore", streams: ["Commerce", "Management / BBA", "Arts & Humanities", "Law"], memberCount: 2100 },
  { id: "kristujayanti", name: "Kristu Jayanti College (Deemed University)", shortName: "KJC", city: "Bangalore", streams: ["Commerce", "Management / BBA", "Science & Tech / BCA"], memberCount: 1350 },
  { id: "mcc", name: "Mount Carmel College (Deemed University)", shortName: "MCC", city: "Bangalore", streams: ["Commerce", "Arts & Humanities", "Science & Tech / BCA"], memberCount: 1280 },
  { id: "presidency_coll", name: "Presidency College", shortName: "Presidency", city: "Bangalore", streams: ["Commerce", "Management / BBA", "Science & Tech / BCA"], memberCount: 860 },
  { id: "sjcc", name: "St. Joseph's College of Commerce", shortName: "SJCC", city: "Bangalore", streams: ["Commerce", "Management / BBA"], memberCount: 1420 },
];

export const CATEGORIES = [
  "🔥 Popular", "🎓 Academics", "🏠 Hostel", "🎮 Gaming", 
  "🏏 Sports", "🎵 Music", "💻 Coding", "🎉 Events", "💬 General"
];

// Reddit-Style Communities (Persistent, Open to All Students)
export const MOCK_COMMUNITIES: Community[] = [
  // MSRIT Communities
  { id: "c1", collegeId: "msrit", name: "r/MSRIT_Freshers2026", description: "Official fresher community for batch of 2026. Ask anything!", category: "🔥 Popular", memberCount: 1248, icon: "🔥" },
  { id: "c2", collegeId: "msrit", name: "r/MSRIT_HostelLife", description: "Hostel rules, room allocations, mess reviews & roommate matching.", category: "🏠 Hostel", memberCount: 684, icon: "🏠" },
  { id: "c3", collegeId: "msrit", name: "r/MSRIT_Gamers", description: "Valorant, CS2, BGMI & FIFA tournaments in college.", category: "🎮 Gaming", memberCount: 321, icon: "🎮" },
  { id: "c4", collegeId: "msrit", name: "r/MSRIT_Devs", description: "Coding, hackathons, open source & tech projects.", category: "💻 Coding", memberCount: 412, icon: "💻" },
  { id: "c5", collegeId: "msrit", name: "r/MSRIT_FestsAndEvents", description: "Udbhav fest updates, cultural events & concert passes.", category: "🎉 Events", memberCount: 287, icon: "🎉" },
  
  // RVCE Communities
  { id: "c6", collegeId: "rvce", name: "r/RVCE_Freshers", description: "Welcome to RVCE! Community for 2026 batch.", category: "🔥 Popular", memberCount: 950, icon: "👋" },

  // SJCC Communities
  { id: "c7", collegeId: "sjcc", name: "r/SJCC_CommerceCircle", description: "B.Com & BBA case studies, finance & business news.", category: "🎓 Academics", memberCount: 820, icon: "📊" },
  { id: "c8", collegeId: "sjcc", name: "r/SJCC_Freshers2026", description: "Connect with Josephites batch of 2026.", category: "🔥 Popular", memberCount: 940, icon: "🔥" },

  // Christ Communities
  { id: "c9", collegeId: "christ_comm", name: "r/Christ_FinanceDesk", description: "Stock markets, venture capital & case competitions.", category: "🎓 Academics", memberCount: 1150, icon: "📈" },

  // REVA Communities
  { id: "c10", collegeId: "reva", name: "r/REVA_FreshersHub", description: "All stream freshers connect here.", category: "🔥 Popular", memberCount: 1340, icon: "🚀" }
];

// Real-Time Group Chats (Can have Branch / Stream Exclusivity)
export const MOCK_GROUP_CHATS: GroupChat[] = [
  // MSRIT GCs
  { id: "gc1", collegeId: "msrit", name: "MSRIT Freshers Official GC", memberCount: 1024, activeUsers: 142 }, // General
  { id: "gc2", collegeId: "msrit", name: "MSRIT Hostel Boys & Girls", memberCount: 428, activeUsers: 56 }, // General
  { id: "gc3", collegeId: "msrit", name: "MSRIT ETE 2026 (Branch Exclusive)", memberCount: 126, activeUsers: 12, allowedBranch: "Telecommunication (ETE)" },
  { id: "gc4", collegeId: "msrit", name: "MSRIT CSE Batch 2026", memberCount: 254, activeUsers: 38, allowedBranch: "Computer Science (CSE)" },
  { id: "gc5", collegeId: "msrit", name: "MSRIT Engineering Tech Hub", memberCount: 310, activeUsers: 45, allowedStream: "Engineering" },
  
  // RVCE GCs
  { id: "gc6", collegeId: "rvce", name: "RVCE CS Boys & Girls", memberCount: 120, activeUsers: 15, allowedBranch: "Computer Science (CSE)" },

  // SJCC GCs
  { id: "gc7", collegeId: "sjcc", name: "SJCC B.Com Freshers (Commerce Only)", memberCount: 310, activeUsers: 45, allowedStream: "Commerce" },
  { id: "gc8", collegeId: "sjcc", name: "SJCC BBA Finance (Branch Exclusive)", memberCount: 180, activeUsers: 22, allowedBranch: "BBA (Finance & Banking)" },

  // Christ GCs
  { id: "gc9", collegeId: "christ_comm", name: "Christ B.Com Hons 2026", memberCount: 420, activeUsers: 64, allowedBranch: "B.Com (Honours)" },

  // REVA GCs
  { id: "gc10", collegeId: "reva", name: "REVA All Freshers GC", memberCount: 680, activeUsers: 95 }
];

export const MOCK_USERS: User[] = [
  { id: "u1", name: "Rahul Kumar", username: "rahul26", collegeId: "msrit", stream: "Engineering", branch: "Telecommunication (ETE)", batch: "2026–2030", bio: "Electronics nerd who loves cars, microcontrollers and gaming.", interests: ["Gaming", "Cars", "Coding", "Music"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul" },
  { id: "u2", name: "Aditi Rao", username: "aditi_codes", collegeId: "msrit", stream: "Engineering", branch: "Computer Science (CSE)", batch: "2026–2030", bio: "Full stack developer in the making. Open source enthusiast.", interests: ["Coding", "Hackathons", "Anime"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditi" },
  { id: "u3", name: "Karan Sharma", username: "karan.beats", collegeId: "msrit", stream: "Engineering", branch: "Information Science (ISE)", batch: "2026–2030", bio: "Music producer & DJ. Catch me at college fests!", interests: ["Music", "Travel", "Photography"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karan" },
  { id: "u4", name: "Arjun Verma", username: "arjun007", collegeId: "rvce", stream: "Engineering", branch: "Mechanical Engineering", batch: "2026–2030", bio: "F1 & car enthusiast. Building Formula Student racecars.", interests: ["Cars", "Robotics"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun" },
  { id: "u5", name: "Sneha Hegde", username: "sneha_fin", collegeId: "sjcc", stream: "Commerce", branch: "B.Com (Finance & Accounts)", batch: "2026–2029", bio: "Aspiring Chartered Accountant. Case study champion.", interests: ["Entrepreneurship", "Books", "Stock Markets"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha" },
  { id: "u6", name: "Rohan Kapoor", username: "rohan_mba", collegeId: "christ_comm", stream: "Commerce", branch: "B.Com (Honours)", batch: "2026–2029", bio: "Stock market trader & fintech builder.", interests: ["Movies", "Football", "Gym"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan" },
];

export const BATCHES = ["2026–2030", "2026–2029", "2025–2029", "2025–2028", "2024–2028", "2024–2027"];
export const INTERESTS = ["Gaming", "Cars", "Coding", "Music", "Football", "Cricket", "Gym", "Movies", "Photography", "Anime", "Travel", "Robotics", "Entrepreneurship", "Books", "Stock Markets"];
