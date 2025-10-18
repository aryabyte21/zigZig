import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sync conversations from ElevenLabs every 15 minutes
crons.interval(
  "sync agent conversations",
  { minutes: 15 },
  internal.agents.syncConversations
);

export default crons;

