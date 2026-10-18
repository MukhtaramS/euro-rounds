# n8n side of Euro Rounds

Exports of the live n8n Cloud setup, all built with Claude Code through the n8n MCP server.

| File | What it is |
|---|---|
| `euro-rounds-daily.json` | The daily pipeline (08:00 Europe/Berlin): research → pick → write + verify → save → log |
| `euro-rounds-api.json` | 3 webhooks behind Header Auth that the review app calls |
| `euro-rounds-error-handler.json` | Error Trigger workflow; set as the error workflow of Daily and API |
| `agent-euro-rounds-editor.json` | Config of the **Euro Rounds Editor** n8n Agent (tools, approval, budget guardrail, Friday task) |

## Import

1. **Create the 3 data tables** first (Overview → Data tables):

   | Table | Columns |
   |---|---|
   | `euro_rounds_seen` | company (string), amount (string), round (string), url (string), date_added (date) |
   | `euro_rounds_posts` | company, city, country, amount, round, headline, post, post_x, hashtags, source_url (string), check (boolean), status (string: pending/approved/rejected), created_at (date), cost_usd (number) |
   | `euro_rounds_runs` | run_date (date), status (string: ok/no_new_rounds/error), step, message, trend (string), cost_usd (number), execution_id (string) |

2. **Import the workflows** (Workflows → Import from file): Error Handler first, then API and Daily.
3. In every **Data table** node, re-select your own table. The exported table IDs belong to the original instance.
4. **Claude nodes:** the original runs on n8n's built-in AI credits. Without them, select an *Anthropic* credential on `Claude: Research`, `Claude: Pick` and `Claude: Write`.
5. **API webhooks:** create a *Header Auth* credential (`x-euro-rounds-key` + a long random value) and select it on the 3 webhook nodes. Put the same value into the app's `.env.local`.
6. In Daily and API → *Settings* → **Error workflow**, select *Euro Rounds – Error Handler*.
7. Publish Error Handler, API and Daily.
8. **Agent:** create it under *Agents* and copy the instructions, tools and task from `agent-euro-rounds-editor.json`, or ask a coding agent connected to your n8n MCP server to recreate it from this file.

No secrets are in these files. Credentials are referenced by name and ID only, never by value.
