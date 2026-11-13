"use client";

import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { GoogleIcon } from "./Icons";
import { AnimmasterMagnetic } from "./ui/animmaster/magnetic-element";

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
    <AnimmasterMagnetic strength={0.2} className="w-full">
      <motion.button
        type="submit"
        disabled={pending}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`auth-google w-full cursor-pointer relative overflow-hidden transition-all duration-200 ${className}`}
        aria-label={label}
      >
        <GoogleIcon size={18} />
        <span>{pending ? "Connecting to Google..." : label}</span>
      </motion.button>
    </AnimmasterMagnetic>
  );
}
