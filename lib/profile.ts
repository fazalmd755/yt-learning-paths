export type ProfileDetails = {
  displayName: string;
  avatarUrl: string;
  learningFocus: string;
  collegeOrCompany: string;
  bio: string;
  dailyGoalMinutes: number;
};

export type ProfileStep = {
  key: keyof ProfileDetails;
  label: string;
  description: string;
  weight: number;
  done: boolean;
};

export function computeProfileCompletion(details: Partial<ProfileDetails>) {
  const steps: ProfileStep[] = [
    {
      key: "displayName",
      label: "Full Name",
      description: "Your full name for certificates and path recommendations",
      weight: 20,
      done: Boolean(details.displayName && details.displayName.trim().length > 0),
    },
    {
      key: "avatarUrl",
      label: "Profile Picture",
      description: "Profile avatar synced from Google or custom photo",
      weight: 15,
      done: Boolean(details.avatarUrl && details.avatarUrl.trim().length > 0),
    },
    {
      key: "learningFocus",
      label: "Learning Focus / Goal",
      description: "What are you studying? (e.g. GATE CS, Web Development, DSA)",
      weight: 25,
      done: Boolean(details.learningFocus && details.learningFocus.trim().length > 0),
    },
    {
      key: "collegeOrCompany",
      label: "College / Role / Company",
      description: "Where you study or work",
      weight: 15,
      done: Boolean(details.collegeOrCompany && details.collegeOrCompany.trim().length > 0),
    },
    {
      key: "bio",
      label: "Short Bio",
      description: "A short 1-line description of your study aspirations",
      weight: 15,
      done: Boolean(details.bio && details.bio.trim().length > 0),
    },
    {
      key: "dailyGoalMinutes",
      label: "Daily Learning Target",
      description: "Daily minutes goal to stay consistent",
      weight: 10,
      done: Boolean(details.dailyGoalMinutes && details.dailyGoalMinutes > 0),
    },
  ];

  const percent = steps.reduce((acc, step) => acc + (step.done ? step.weight : 0), 0);
  const remainingSteps = steps.filter((step) => !step.done);

  return {
    percent,
    isComplete: percent === 100,
    steps,
    remainingSteps,
  };
}
