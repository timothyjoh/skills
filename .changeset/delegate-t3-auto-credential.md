---
"timothyjoh-skills": patch
---

t3-handoff (formerly delegate-t3-agent): issue a short-lived T3 credential automatically when `T3_DELEGATE_TOKEN` is unset. The helper finds the T3 CLI through `T3_BIN`, `PATH`, or the running T3 server's own binary, so agents no longer stop on a missing token.
