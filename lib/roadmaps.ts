export interface CuratedModule {
  title: string;
  duration: string;
  lessons: string[];
}

export interface CuratedTrack {
  id: string;
  category: "webdev" | "python" | "dsa" | "cs" | "exam" | "design" | "mobile";
  title: string;
  creator: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: string;
  lessonCount: number;
  playlistUrl: string;
  description: string;
  tags: string[];
  modules?: CuratedModule[];
}

export const CURATED_TRACKS: CuratedTrack[] = [
  {
    id: "dsa-sheet",
    category: "dsa",
    title: "Complete DSA Sheet (Striver & Babbar Style)",
    creator: "take U forward & Love Babbar",
    level: "Intermediate",
    estimatedHours: "48h",
    lessonCount: 84,
    playlistUrl: "https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz",
    description: "Industry-standard Data Structures & Algorithms roadmap covering Arrays, Two Pointers, Trees, Graphs, and Dynamic Programming.",
    tags: ["DSA", "LeetCode", "Interview Prep", "Algorithms", "C++ / Java"],
    modules: [
      {
        title: "Module 1: Foundations & Arrays",
        duration: "10h",
        lessons: [
          "Time & Space Complexity Basics",
          "Arrays: Kadane's Algorithm & Two Pointer",
          "Sorting: Merge Sort & Quick Sort Deep Dive",
          "Binary Search on 1D & 2D Arrays",
        ],
      },
      {
        title: "Module 2: Linked Lists, Stacks & Queues",
        duration: "8h",
        lessons: [
          "Singly & Doubly Linked Lists Implementations",
          "Fast & Slow Pointer Cycle Detection",
          "Next Greater Element & Monotonic Stack",
          "Sliding Window Maximum & Deque",
        ],
      },
      {
        title: "Module 3: Binary Trees & BST",
        duration: "14h",
        lessons: [
          "Tree Traversals (Inorder, Preorder, Postorder, Level Order)",
          "Diameter, Height & Balanced Tree Checks",
          "Lowest Common Ancestor & View Problems",
          "BST Operations, Validation & Serialization",
        ],
      },
      {
        title: "Module 4: Graphs & Dynamic Programming",
        duration: "16h",
        lessons: [
          "BFS & DFS on Undirected & Directed Graphs",
          "Dijkstra, Bellman-Ford & Topological Sort",
          "1D & 2D DP: Knapsack, Subsequences & Grids",
          "DP on Trees and Bitmasking Fundamentals",
        ],
      },
    ],
  },
  {
    id: "fullstack-webdev",
    category: "webdev",
    title: "Full-Stack Web Development (HTML/CSS/JS/React/Node)",
    creator: "freeCodeCamp & CodeWithHarry",
    level: "Beginner",
    estimatedHours: "42h",
    lessonCount: 68,
    playlistUrl: "https://www.youtube.com/playlist?list=PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w",
    description: "End-to-end modern web roadmap from HTML5, responsive CSS, and modern JavaScript (ES6+) to React 19, Next.js, and Node.js backend APIs.",
    tags: ["Full-Stack", "React", "JavaScript", "Node.js", "Tailwind CSS"],
    modules: [
      {
        title: "Module 1: Semantic HTML5 & Modern CSS3",
        duration: "8h",
        lessons: [
          "HTML5 Semantic Architecture & Accessibility (a11y)",
          "Flexbox & CSS Grid Mastery",
          "Tailwind CSS Utility-First Styling",
          "Responsive Design & Mobile-First Patterns",
        ],
      },
      {
        title: "Module 2: JavaScript Mastery (ES6+)",
        duration: "12h",
        lessons: [
          "Scopes, Closures & Execution Context",
          "Asynchronous JS: Promises, Async/Await & Event Loop",
          "DOM Manipulation, Fetch API & Custom Events",
          "Functional Programming & Array Methods",
        ],
      },
      {
        title: "Module 3: React & Next.js App Router",
        duration: "14h",
        lessons: [
          "Component Architecture, Props & State",
          "React Hooks: useEffect, useMemo, useCallback, useRef",
          "Next.js App Router, Server Components & Server Actions",
          "State Management & Custom Hooks",
        ],
      },
      {
        title: "Module 4: Backend REST APIs & Databases",
        duration: "8h",
        lessons: [
          "Node.js & Express.js Server Setup",
          "RESTful API Design & Middleware Authentication",
          "Relational Databases (PostgreSQL / Supabase)",
          "Deployment, CI/CD & Production Environment Setup",
        ],
      },
    ],
  },
  {
    id: "core-cs-fundamentals",
    category: "cs",
    title: "Core CS Fundamentals (OS, DBMS, Computer Networks)",
    creator: "Gate Smashers & Neso Academy",
    level: "Intermediate",
    estimatedHours: "36h",
    lessonCount: 56,
    playlistUrl: "https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUAG0XRw78UA8qnv6jEx",
    description: "The core computer science syllabus every software engineer and student must master: OS processes/threads, ACID/SQL database internals, and TCP/IP networking.",
    tags: ["OS", "DBMS", "Computer Networks", "System Design", "CS Fundamentals"],
    modules: [
      {
        title: "Module 1: Operating Systems & Virtualization",
        duration: "12h",
        lessons: [
          "Process Management, States & PCB",
          "CPU Scheduling Algorithms (FCFS, SJF, Round Robin)",
          "Threads, Race Conditions, Semaphores & Mutex Locks",
          "Memory Management, Paging, Virtual Memory & Deadlocks",
        ],
      },
      {
        title: "Module 2: Database Management Systems (DBMS)",
        duration: "12h",
        lessons: [
          "Relational Model, ER Diagrams & Schema Design",
          "ACID Properties & Transaction States",
          "Normalization: 1NF, 2NF, 3NF & BCNF with Examples",
          "Indexing, B-Trees & Query Optimization Techniques",
        ],
      },
      {
        title: "Module 3: Computer Networks & Protocols",
        duration: "12h",
        lessons: [
          "OSI Model vs TCP/IP Protocol Stack",
          "Application Layer: HTTP/1.1, HTTP/2, DNS, WebSockets",
          "Transport Layer: TCP 3-Way Handshake, Flow Control & UDP",
          "Network Layer: IP Addressing, Subnetting & Routing Protocols",
        ],
      },
    ],
  },
  {
    id: "gate-interview-revision",
    category: "exam",
    title: "GATE & Technical Interview Revision",
    creator: "Knowledge Gate & Gate Smashers",
    level: "Advanced",
    estimatedHours: "30h",
    lessonCount: 48,
    playlistUrl: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiFM9AU5516KB5RE620jVvmt",
    description: "High-yield revision track designed for GATE CS aspirants and tier-1 product company technical interviews. Covers discrete math, digital logic, and TOC.",
    tags: ["GATE CS", "Interview Revision", "Theory of Computation", "Discrete Math"],
    modules: [
      {
        title: "Module 1: Discrete Mathematics & Logic",
        duration: "8h",
        lessons: [
          "Propositional & First-Order Predicate Logic",
          "Set Theory, Relations & Partial Order Lattices",
          "Combinatorics, Permutations & Pigeonhole Principle",
          "Graph Theory: Trees, Planarity & Graph Coloring",
        ],
      },
      {
        title: "Module 2: Theory of Computation (TOC)",
        duration: "12h",
        lessons: [
          "DFA, NFA & Regular Expressions Equivalence",
          "Pumping Lemma for Regular Languages",
          "Context-Free Grammars & Pushdown Automata (PDA)",
          "Turing Machines & Decidability vs Undecidability",
        ],
      },
      {
        title: "Module 3: High-Yield Problem Solving",
        duration: "10h",
        lessons: [
          "Previous Years' GATE CS Top Selected Problems",
          "Tricky Edge Cases in Paging & Cache Memory",
          "Complex SQL Queries & Relational Algebra Equivalences",
          "Rapid-Fire MCQ Practice & Time Management Strategy",
        ],
      },
    ],
  },
  {
    id: "fullstack-react",
    category: "webdev",
    title: "Full-Stack React & Next.js Masterclass",
    creator: "freeCodeCamp / CodeWithHarry",
    level: "Beginner",
    estimatedHours: "18h",
    lessonCount: 42,
    playlistUrl: "https://www.youtube.com/playlist?list=PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w",
    description: "Learn modern web development from HTML, CSS, JavaScript basics to full-stack React and API development.",
    tags: ["React", "JavaScript", "Next.js", "Full-Stack"],
  },
  {
    id: "dsa-strivers",
    category: "dsa",
    title: "Complete Data Structures & Algorithms",
    creator: "take U forward / Striver",
    level: "Intermediate",
    estimatedHours: "45h",
    lessonCount: 75,
    playlistUrl: "https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz",
    description: "Ace coding interviews with Arrays, Linked Lists, Trees, Graphs, and Dynamic Programming in C++ / Java.",
    tags: ["DSA", "LeetCode", "Interviews", "Algorithms"],
  },
  {
    id: "python-beginners",
    category: "python",
    title: "Python for Absolute Beginners & Data Science",
    creator: "Programming with Mosh",
    level: "Beginner",
    estimatedHours: "12h",
    lessonCount: 30,
    playlistUrl: "https://www.youtube.com/playlist?list=PLTjRvDozrdlxj5wgH4qkvwSOdHLOCx10f",
    description: "Comprehensive Python course covering variables, data structures, automation, and data analysis libraries.",
    tags: ["Python", "Automation", "Data Science", "Basics"],
  },
  {
    id: "uiux-figma",
    category: "design",
    title: "UI/UX Design Systems & Figma from Scratch",
    creator: "Flux Academy / DesignCourse",
    level: "Beginner",
    estimatedHours: "10h",
    lessonCount: 24,
    playlistUrl: "https://www.youtube.com/playlist?list=PLlaP-r4905Ec3Iu4i2i9d_aVwY45B3f1_",
    description: "Master typography, color theory, wireframing, auto-layout, and production-ready design systems in Figma.",
    tags: ["Figma", "UI/UX", "Design Systems", "Web Design"],
  },
  {
    id: "flutter-apps",
    category: "mobile",
    title: "Cross-Platform Mobile Apps with Flutter",
    creator: "The Net Ninja",
    level: "Beginner",
    estimatedHours: "15h",
    lessonCount: 36,
    playlistUrl: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9jLYyp2Aoh6hcWuxFDX6PBJ",
    description: "Build iOS and Android apps with a single codebase using Flutter and Dart, state management, and Firebase.",
    tags: ["Flutter", "Dart", "Mobile", "iOS", "Android"],
  },
];

export function getTrackByIdOrSlug(idOrSlug: string): CuratedTrack | undefined {
  const normalized = idOrSlug.trim().toLowerCase();
  return (
    CURATED_TRACKS.find((t) => t.id.toLowerCase() === normalized) ||
    (normalized.includes("dsa")
      ? CURATED_TRACKS.find((t) => t.id === "dsa-sheet" || t.id === "dsa-strivers")
      : normalized.includes("web")
      ? CURATED_TRACKS.find((t) => t.id === "fullstack-webdev" || t.id === "fullstack-react")
      : normalized.includes("gate")
      ? CURATED_TRACKS.find((t) => t.id === "gate-interview-revision")
      : normalized.includes("cs")
      ? CURATED_TRACKS.find((t) => t.id === "core-cs-fundamentals")
      : undefined)
  );
}
