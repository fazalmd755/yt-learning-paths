"use client";

import { useState } from "react";
import { CalendarIcon } from "./Icons";
import ScheduleLessonModal from "./ScheduleLessonModal";

type Props = {
  userId: string;
  videoTitle: string;
  courseTitle: string;
  watchUrl: string;
};

export default function CourseLessonScheduleButton({
  userId,
  videoTitle,
  courseTitle,
  watchUrl,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="lesson-schedule-btn"
        title="Schedule this lesson in Study Planner"
        aria-label={`Schedule ${videoTitle}`}
      >
        <CalendarIcon size={14} />
      </button>

      <ScheduleLessonModal
        isOpen={open}
        onClose={() => setOpen(false)}
        userId={userId}
        videoTitle={videoTitle}
        watchUrl={watchUrl}
        courseTitle={courseTitle}
      />
    </>
  );
}
