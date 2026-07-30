import { importLibrarySources, listLibrarySources } from "../api/_lib/library-sources.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const requestedIds = process.argv.slice(2).filter(Boolean);
const sourceIds = requestedIds.length
  ? requestedIds
  : (await listLibrarySources({ page_size: 200 })).items.filter((source) => source.url && source.storage_status !== "stored").map((source) => source.id);

if (!sourceIds.length) {
  console.log("All registered Library documents are already stored.");
  process.exit(0);
}

console.log(`Importing ${sourceIds.length} Library document${sourceIds.length === 1 ? "" : "s"}…`);
for (const sourceId of sourceIds) {
  const result = await importLibrarySources([sourceId]);
  const item = result.items[0];
  if (item.ok) console.log(`Stored ${sourceId} (${item.source.content_type}, ${item.source.byte_size} bytes, sha256:${item.source.checksum_sha256.slice(0, 12)}…)`);
  else console.error(`Failed ${sourceId}: ${item.error}`);
}

const summary = await listLibrarySources({ page_size: 200 });
const stored = summary.items.filter((source) => source.storage_status === "stored");
const failed = summary.items.filter((source) => source.storage_status === "failed");
console.log(`Library storage: ${stored.length}/${summary.total} stored${failed.length ? `, ${failed.length} failed` : ""}.`);
if (failed.length) process.exitCode = 1;
