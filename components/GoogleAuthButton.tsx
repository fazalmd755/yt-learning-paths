"use client";

import { useFormStatus } from "react-dom";
import { GoogleIcon } from "./Icons";

type Props = {
  label?: string;
  className?: string;
};

export default function GoogleAuthButton({
  label = "Continue with Google",
  className = "",
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`auth-google ${className}`}
      aria-label={label}
    >
      <GoogleIcon size={18} />
      <span>{pending ? "Connecting to Google..." : label}</span>
    </button>
  );
}
