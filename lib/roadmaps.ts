export interface CuratedTrack {
  id: string;
  category: "webdev" | "python" | "dsa" | "design" | "mobile";
  title: string;
  creator: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: string;
  lessonCount: number;
  playlistUrl: string;
  description: string;
  tags: string[];
}

export const CURATED_TRACKS: CuratedTrack[] = [
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
  {
    id: "machine-learning",
    category: "python",
    title: "Applied Machine Learning & Deep Learning",
    creator: "StatQuest / Krish Naik",
    level: "Intermediate",
    estimatedHours: "22h",
    lessonCount: 40,
    playlistUrl: "https://www.youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF",
    description: "Clear, visual explanations of Regression, Classification, Neural Networks, and PyTorch fundamentals.",
    tags: ["Machine Learning", "AI", "Neural Networks", "Data"],
  },
];
