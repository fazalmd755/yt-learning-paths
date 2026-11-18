import LogoLoader from "@/components/LogoLoader";

export default function Loading() {
  return (
    <LogoLoader
      text="Loading Watchlify..."
      size={68}
      fullScreen={false}
      className="min-h-[75vh]"
    />
  );
}
