import { neon } from "@neondatabase/serverless";

let client;
export function db() {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error("Database is not configured"), { statusCode: 503 });
  client ||= neon(process.env.DATABASE_URL);
  return client;
}

export function studioActor() {
  return {
    id: process.env.STUDIO_ACTOR_ID || "studio-author",
    name: process.env.STUDIO_ACTOR_NAME || "Current author",
  };
}

export function demoLearnerId() {
  return process.env.DEMO_LEARNER_ID || "demo-learner-blueorigin";
}
