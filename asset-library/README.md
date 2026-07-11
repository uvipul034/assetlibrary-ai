# AssetLibrary AI
> A digital asset manager (DAM) with AI auto-tagging and role-based approvals.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Live Demo:** [https://assetlibrary-ai-uvipul034-1103s-projects.vercel.app/]

## Core Features
* **AI Vision Tagging:** Auto-generates alt-text and classification tags for uploaded images using OpenAI (`gpt-4o-mini`).
* **Role-Based Access (RBAC):** 3-tier hierarchy (Admin, Manager, Editor) enforced securely via Postgres RLS `WITH CHECK` constraints.
* **Audit Trail:** Soft-delete architecture with an append-only log for all approval status changes.
* **UI/UX:** Keyboard-navigable grid, URL-synced search/filter state, and bulk actions.
* **SEO:** Server-rendered JSON-LD structured data and dynamic OpenGraph image generation.

## Tech Stack
Next.js (App Router), TypeScript (Strict), Supabase (Postgres, Storage, Auth), Tailwind CSS, shadcn/ui, OpenAI.

## Quick Start
```bash
git clone [https://github.com/yourusername/assetlibrary-ai.git](https://github.com/yourusername/assetlibrary-ai.git)
cd assetlibrary-ai
cp .env.example .env.local
# Fill in your Supabase and OpenAI keys in .env.local
npm install
npm run dev