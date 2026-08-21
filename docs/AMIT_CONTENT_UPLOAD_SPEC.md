# Club Rogue / Bassik — Amit content board knowledge (for ChatGPT automation)

Use this as the source of truth when building: **drop a file → auto-update sheet/Drive + mark creatives ready** (replace the green Ready toggle).

---

## Goal

Today Nikhilesh marks items **Ready (green)** in the Bassik team board when creatives are done for Amit.

Wanted flow:

1. Rename file properly and upload (Drive / WhatsApp / form).
2. Automation reads **outlet + type + day (+ date)** from the filename.
3. File is filed in the right Drive folder.
4. Matching row in a **shared Google Sheet** is updated (link + status = Ready).
5. Optionally later: Bassik API flips `creativeReady` for that date (same as green button).

---

## Current product structure (Bassik team board)

Owner for social: **`amit`** (`CHECKLIST_DEFAULT_OWNER_ID`).

### Kinds of work

| Kind | What | Cadence |
|------|------|---------|
| **stories** | Daily Instagram/Meta stories | Mon–Sun (every day) |
| **posts** | Feed posts | **Fri / Sat / Sun only** |
| **ads** | Paid ads | **Fri / Sat / Sun only** |
| **habits** | Daily habits (groups check) | Daily |

### Day IDs (must use these codes)

| Code | Day |
|------|-----|
| `mon` | Monday |
| `tue` | Tuesday |
| `wed` | Wednesday |
| `thu` | Thursday |
| `fri` | Friday |
| `sat` | Saturday |
| `sun` | Sunday |

### Timing rules (important)

- **Stories:** due by **10:00 PM IST the day BEFORE** the story day.  
  Example: Tuesday Story creatives must be ready by Monday 10 PM.
- **Weekend Posts & Ads (Fri/Sat/Sun):** due **4 days before** the post day.  
  - Friday post/ad → ready by **Monday**  
  - Saturday post/ad → ready by **Tuesday**  
  - Sunday post/ad → ready by **Wednesday**

### Platforms on the board

`meta` · `youtube` · `google` · `linkedin` · `x`

Stories/posts/ads templates are usually for all platforms; Meta is the main one for Amit day-to-day.

### Outlets (exact slugs for filenames)

From Bassik `TEAM_AD_OUTLETS` — use these **exact** ids:

| Slug | Label |
|------|--------|
| `clubrogue-gachibowli` | Gachibowli Clubrogue |
| `clubrogue-kondapur` | Kondapur Clubrogue |
| `clubrogue-jubilee-hills` | Jubilee Hills Clubrogue |
| `clubrogue-general` | Club Rogue General |
| `c53` | C53 |
| `boiler-room` | Boiler Room |
| `firefly` | Firefly |
| `komma` | Komma |
| `kiik69` | KIIK 69 |
| `asilmandi` | Asil Mandi |
| `antervedi` | Antervedi |
| `bassik` | Bassik |

Each outlet has lists titled like `{Label} Stories` / `{Label} Posts` / `{Label} Ads`.

### What “green Ready” means today

- Stored per checklist item as **`readyDates`**: list of `YYYY-MM-DD` target dates.
- For the focused date, UI shows `creativeReady: true` if that date is in `readyDates`.
- Amit gets WhatsApp “ready to post” from items marked Ready.
- Admin can also WhatsApp “need ready” for red/wait items.

---

## What must be uploaded (file = creative asset)

For each Ready item, the file should be the **final creative** Amit will post:

| Type | Typical files |
|------|----------------|
| Story | Vertical JPG/PNG/MP4 (9:16) |
| Post | Square or 4:5 JPG/PNG/MP4 |
| Ad | Same as post + optional copy note in Sheet |

Optional companion: a short `.txt` with caption / CTA (same basename as the creative).

---

## Filename convention (automation must parse this)

**Strict pattern:**

```text
{outletSlug}__{kind}__{dayId}__{targetDate}.{ext}
```

### Examples

```text
clubrogue-gachibowli__stories__tue__2026-07-22.jpg
clubrogue-kondapur__posts__fri__2026-07-25.mp4
clubrogue-jubilee-hills__ads__sat__2026-07-26.png
```

### Field rules

| Part | Allowed values |
|------|----------------|
| `outletSlug` | exact id from table above (e.g. `clubrogue-gachibowli`) |
| `kind` | `stories` \| `posts` \| `ads` |
| `dayId` | `mon` \| `tue` \| `wed` \| `thu` \| `fri` \| `sat` \| `sun` |
| `targetDate` | `YYYY-MM-DD` = the **day the content goes live** (not the due day) |
| `ext` | `jpg` `jpeg` `png` `webp` `mp4` `mov` |

### Validation the bot must enforce

1. If `kind=stories` → any `dayId` OK.  
2. If `kind=posts` or `ads` → `dayId` must be `fri` | `sat` | `sun`.  
3. `dayId` must match weekday of `targetDate` in **Asia/Kolkata**.  
4. Reject unclear names; reply with the correct rename example.

### Optional caption file

```text
clubrogue-gachibowli__stories__tue__2026-07-22.txt
```

Same basename as the creative.

---

## Google Sheet structure (share this with teammates)

**Sheet name:** `Amit Content Ready`

| Column | Header | Example |
|--------|--------|---------|
| A | `timestamp` | `2026-07-17T16:00:00+05:30` |
| B | `outlet_slug` | `clubrogue-gachibowli` |
| C | `outlet_label` | `Gachibowli Clubrogue` |
| D | `kind` | `stories` |
| E | `day_id` | `tue` |
| F | `day_label` | `Tuesday` |
| G | `target_date` | `2026-07-22` |
| H | `due_by_date` | `2026-07-21` (stories = day before; weekend post/ad = −4 days) |
| I | `status` | `ready` \| `wait` \| `posted` |
| J | `file_name` | full filename |
| K | `drive_link` | Google Drive file URL |
| L | `caption` | from .txt if any |
| M | `uploaded_by` | email / name |
| N | `bassik_item_hint` | e.g. `Tuesday Story` / `Friday Post` / `Saturday Ad` |
| O | `notes` | free text |

**Upsert key:** `outlet_slug + kind + target_date` (update row if exists; don’t duplicate).

When a valid file arrives → set `status=ready`, fill `drive_link`, `timestamp`.

---

## Google Drive folder layout

```text
Bassik / Amit Creatives /
  {outlet_slug}/
    stories/
      {target_date}/
        file
    posts/
      {target_date}/
        file
    ads/
      {target_date}/
        file
```

Example:

```text
Bassik / Amit Creatives / clubrogue-gachibowli / stories / 2026-07-22 / clubrogue-gachibowli__stories__tue__2026-07-22.jpg
```

Share the parent folder + Sheet with Amit and designers (viewer / editor as needed).

---

## How the bot should compute `due_by_date`

Timezone: **Asia/Kolkata**.

```text
if kind == stories:
  due_by_date = target_date - 1 day
if kind in (posts, ads):
  due_by_date = target_date - 4 days
```

Also write human title into `bassik_item_hint`:

- stories → `{DayLabel} Story` (e.g. `Tuesday Story`)
- posts → `{DayLabel} Post`
- ads → `{DayLabel} Ad`

---

## Mapping to Bassik green button (later API)

Bassik stores readiness as:

- checklist item (outlet + kind + dayOfWeek title)
- `readyDates: string[]` of `YYYY-MM-DD`

So “file uploaded correctly” ≈ add `target_date` to that item’s `readyDates` (same as flipping green Ready for that date).

Until API is wired: **Sheet `status=ready` + Drive link** is the source of truth for the team.

---

## ChatGPT / automation instructions (paste this)

You are the Bassik/Amit creative intake bot.

1. Accept one file (image/video) and optional matching `.txt` caption.  
2. Parse filename: `{outlet}__{kind}__{day}__{YYYY-MM-DD}.ext`  
3. Validate kind/day/date rules above.  
4. Move/copy file into Drive path: `Amit Creatives/{outlet}/{kind}/{target_date}/`  
5. Upsert Google Sheet row on key `outlet_slug+kind+target_date`.  
6. Set `status=ready`, `drive_link`, `due_by_date`, `bassik_item_hint`.  
7. Reply with a short confirmation: outlet, kind, live day, due-by, link.  
8. If filename is wrong, do **not** guess — ask for rename with an example.

Do not mark Ready unless the file is present and named correctly.

---

## Example teammate message

> Upload: `clubrogue-gachibowli__stories__fri__2026-07-25.jpg`  
> Bot: Ready — Gachibowli Clubrogue · Friday Story · live 25 Jul · due by 24 Jul 10 PM · [Drive link]

---

## Out of scope for v1

- Auto-posting to Instagram  
- Ads spend / Meta Ads Manager  
- Replacing Bassik UI entirely (Sheet first, Bassik sync later)
