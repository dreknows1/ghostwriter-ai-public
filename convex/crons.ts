import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Rotate the Skool community code on the 1st of every month at midnight UTC
crons.monthly(
  "rotate skool code",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.inviteCodes.rotateSkoolCode,
);

export default crons;
