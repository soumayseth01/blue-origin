import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { storeLibrarySourceDocument } from "../api/_lib/library-sources.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const contentTypes = {
  ".html": "text/html",
  ".htm": "text/html",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

const mappings = process.argv.slice(2);
if (!mappings.length) throw new Error("Pass one or more source-id=path mappings");

for (const mapping of mappings) {
  const separator = mapping.indexOf("=");
  if (separator < 1) throw new Error(`Invalid mapping: ${mapping}`);
  const sourceId = mapping.slice(0, separator);
  const filePath = resolve(mapping.slice(separator + 1));
  const contentType = contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
  const source = await storeLibrarySourceDocument(sourceId, {
    bytes: await readFile(filePath),
    contentType,
    fileName: basename(filePath),
  });
  console.log(`Stored ${source.id} (${source.content_type}, ${source.byte_size} bytes, sha256:${source.checksum_sha256.slice(0, 12)}…)`);
}
