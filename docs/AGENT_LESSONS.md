# AGENT LESSONS LEARNED

## API & Data Verification
- **LESSON**: Never assume an API change works just because the code looks correct.
- **ACTION**: Always verify the actual JSON response from the API (using browser network tab or `console.log`) *before* debugging the Frontend.
- **PITFALL**: We spent 90 minutes debugging React components for a missing link, when the root cause was a missing variable assignment in the API (`eventMopUrl` was fetched but not returned).

## Debugging Workflow
1. **Trace Data Source**: Start at the API response. Is the field null?
2. **Verify Database**: Is the data in the DB? (We did this, but late).
3. **Verify API Logic**: If DB has data but API returns null, the bug is in the API logic (missing assignment, wrong query, typo).
4. **Frontend Last**: Only debug Frontend/React if the API response is confirmed distinct and correct.
