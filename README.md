# Nutrition Chat App (prototype)

This is a minimal prototype for a chat-based nutrition coach. It includes:

- Chat route where a user can send messages and upload food photos (image analysis is mocked).
- Track route that displays persisted goals, milestones, and summaries (backed by JSON seed + localStorage).
- Goals and Achievements pages.

Run locally:

```bash
npm install
npm run dev
```

Notes:

- The app uses mocked endpoints in `src/api/mockApi.ts` which seed data from `src/mocks/*.json`.
- No auth; single user prototype.
- Styling is in `src/styles/app.less` and is designed to roughly match the provided style board.
