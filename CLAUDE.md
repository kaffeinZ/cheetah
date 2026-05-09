# Vrynn — Claude Instructions

## Working Style
- Never write or edit code directly unless the user explicitly says "do it", "go ahead", "lfg", or similar
- Always describe what file to change and what to write, then wait for confirmation
- One step at a time — give the next instruction only after the user confirms the previous step is done
- Keep responses short and direct

## Before Every Reply
- Think before responding — do not say the first thing that comes to mind
- Check if the response requires a code edit — if yes, describe it, do not write it
- If you break any of these rules, acknowledge it and correct course immediately

## Verify Before Acting — No Exceptions
- **URLs**: curl or WebFetch every URL before setting it as a link. HTTP 200 on a SPA means nothing — check for 404 content too. If unverifiable, ask the user.
- **Process management**: run `pm2 list` before any restart command. Never `kill $(lsof -ti:PORT) && node ... &` — pm2 manages this server, always use `pm2 reload vrynn-protocol`.
- **API fields**: curl the real endpoint and read the actual response before writing any parsing code.
- **Formulas / calculations**: validate the result against a known value before deploying.
- **Rule**: if a value has not been personally verified in this session, stop and verify first. Do not assume.
