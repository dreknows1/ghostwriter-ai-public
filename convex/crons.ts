import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Rotate the Skool community code on the 1st of every month at midnight UTC
crons.monthly(
  "rotate skool code",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.inviteCodes.rotateSkoolCode,
);

// The Prompt Book nurture sequence. Once a day is enough — the schedule is in
// whole days, and a single daily pass means a subscriber advances at most one
// step per day even if the job is ever missed and catches up later.
// 14:00 UTC is mid-morning in the US, which is when this list actually reads.
crons.daily(
  "prompt book nurture",
  { hourUTC: 14, minuteUTC: 0 },
  internal.nurture.sendDue,
  {},
);

export default crons;
