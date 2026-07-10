---

### 2. The Humanized `docs/architecture.md`
This version sounds like a developer explaining their decisions in a pull request rather than a textbook.

```markdown
# Architecture & Technical Notes

## Database & Security (PostgreSQL)
I leaned heavily on Postgres features rather than application-level logic to ensure data integrity:

* **Trigger-Based Profile Provisioning:** Instead of doing two sequential API writes on signup (which risks leaving orphaned users if the client loses connection), I added a `SECURITY DEFINER` trigger (`on_auth_user_created`). The DB automatically provisions the profile row the millisecond a user registers.
* **Soft Deletes:** The `assets` table uses a `deleted_at` timestamp. All SELECT queries filter out deleted rows, preserving the foreign key history for the approval audit logs.

## Patching the Editor Exploit (RLS)
A common vulnerability in asset workflows is privilege escalation. If an Editor's `UPDATE` policy only verifies ownership (`USING (uploaded_by = auth.uid())`), a malicious client request could manually update their asset's `status` to `approved`. 

To fix this, the `UPDATE` policy enforces a strict `WITH CHECK` constraint, ensuring Editors can only modify their assets if the status remains `pending`.

## Service Role Isolation for AI
To securely write AI-generated tags and update `alt_text` without exposing permissive `INSERT` policies to the frontend, I split the pipeline:
1. Client uploads the raw file to the Supabase bucket.
2. Server triggers an async call to `/api/analyze-asset`.
3. The API route initializes a server-only client using the `SUPABASE_SERVICE_ROLE_KEY` to intentionally bypass RLS.
4. The server hits the OpenAI vision API, parses the JSON, and writes the tags directly to the database securely.