import LogoLoader from "@/components/LogoLoader";

export default function DashboardLoading() {
  return (
    <LogoLoader
      text="Loading your courses & study streak..."
      size={64}
      className="min-h-[70vh]"
    />
  );
}
