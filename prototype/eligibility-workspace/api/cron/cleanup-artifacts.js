import { del } from "@vercel/blob";
import { db } from "../_lib/db.js";
import { handleError, send } from "../_lib/http.js";
export default async function handler(req,res){try{if(req.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`)return send(res,401,{detail:"Unauthorized"});const sql=db();const expired=await sql`SELECT artifact_id,blob_url FROM attempt_artifacts WHERE status='active' AND retention_date<now() LIMIT 100`;for(const item of expired){await del(item.blob_url,{token:process.env.BLOB_READ_WRITE_TOKEN});await sql`UPDATE attempt_artifacts SET status='expired' WHERE artifact_id=${item.artifact_id}`;}send(res,200,{expired:expired.length});}catch(error){handleError(res,error);} }
