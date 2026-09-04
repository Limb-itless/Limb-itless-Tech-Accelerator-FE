# Phase 1 FE — manual test scenarios

Covers FE R-06 → R-11 (Patients, Devices, Recovery milestones, Outcome
measures + trend, Timeline + notes, Dashboard). Runs against the local
stack with the seeded clinical sample data.

## Setup

1. **Database** — apply migrations and seed:
   ```bash
   cd Limb-itless-Tech-Accelerator-BE
   venv/Scripts/python.exe -m alembic upgrade head
   venv/Scripts/python.exe -m scripts.seed          # idempotent; --reset to start clean
   ```
   The seed adds **10 patients** (8 Northgate, 2 Cape Mobility) with
   devices, milestones, PROMs and notes. Re-running it changes nothing.
2. **API**: `fastapi dev` (or `python -m uvicorn app.main:app --port 8000`).
3. **App**: `npm start` in `Limb-itless-Tech-Accelerator-FE` → http://localhost:4200.

### Logins (all share password `Password123!`)

| Email                               | Role                                | Sees                                 |
| ----------------------------------- | ----------------------------------- | ------------------------------------ |
| `clinician@northgate-rehab.co.za`   | clinician (writer)                  | Northgate patients; assigned to most |
| `prosthetist@northgate-rehab.co.za` | prosthetist (writer)                | Northgate patients                   |
| `admin@northgate-rehab.co.za`       | practice admin (read-only clinical) | Northgate patients                   |
| `clinician@capemobility.co.za`      | clinician (writer)                  | Cape Mobility patients only          |
| `platform.admin@limbitless.co.za`   | platform admin                      | no clinical dashboard                |

### Seeded patients (Northgate unless noted)

| ID  | Name             | Notable for                                                                                                               |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 22  | Thabo Molefe     | mid-pathway, 1 overdue milestone, flagged residual-limb pain (8), 2 devices worth of notes, 3 PROMs → trend line          |
| 23  | Lerato Dlamini   | **upcoming** milestone in ~4 days, flagged Socket Comfort Score (3), 3 PROMs incl. LCI                                    |
| 24  | Naledi Khumalo   | upper-limb pathway, device _in fitting_, flagged phantom pain (7)                                                         |
| 25  | Sipho Nkosi      | **worst case**: 3 overdue milestones (one 38 days), 2 flagged PROMs (pain 9, LCI 18), a _replaced_ + _active_ device pair |
| 26  | Ayesha Patel     | brand-new upper-limb patient, pathway just started, device _planned_, no flags                                            |
| 27  | Bongani Zulu     | discharged/annual-review: all 7 milestones complete, activity-specific blade, healthy scores                              |
| 28  | Michelle van Wyk | knee disarticulation, 1 overdue + 1 upcoming milestone, borderline flagged SCS (4)                                        |
| 29  | Johannes Botha   | **inactive** patient (records closed), retired device                                                                     |
| 30  | Zanele Mthembu   | **Cape Mobility** — must NOT appear for Northgate users                                                                   |
| 31  | David Fourie     | **Cape Mobility** — upper limb, no flags                                                                                  |

---

## R-11 — Dashboard

1. **Headline stats (whole practice).** Log in as the Northgate clinician
   → lands on `/dashboard`. Expect four cards: **Active patients 7**
   (Johannes is inactive and excluded; the two Cape patients are another
   practice), **Overdue milestones 5**, **Upcoming milestones 5**,
   **Flagged outcome measures 6**. The Overdue and Flagged cards are
   tinted (amber / red).
2. **Patients by phase.** The "Patients by phase" card lists milestone
   types with a mini bar each; the widest bar is the type with the most
   in-progress milestones (_Initial fitting delivery_, 2). Bars scale
   relative to that peak.
3. **Overdue list.** "Overdue milestones" shows Sipho Nkosi three times
   (largest first: _38d overdue_), then Thabo Molefe and Michelle van
   Wyk. Each row: patient name (link), milestone type, due date, and a
   `Nd overdue` pill.
4. **Upcoming list.** "Upcoming milestones" shows five rows within the
   next 14 days, earliest first (Lerato Dlamini _in 4d_), each with an
   `in Nd` pill.
5. **Flagged measures.** "Flagged outcome measures" shows six rows newest
   first — Michelle van Wyk (SCS 4), Sipho Nkosi (pain 9), Lerato Dlamini
   (SCS 3), Thabo Molefe (pain 8), Naledi Khumalo (phantom 7), Sipho
   Nkosi (LCI 18) — each with the flag reason as a red pill.
6. **Row links.** Click any patient name → the patient detail page for
   that patient.
7. **My caseload toggle.** Click **My caseload**. Active patients drops
   to **6** (Bongani Zulu is assigned to the prosthetist, not this
   clinician). Click **Whole practice** to restore. The lists refetch on
   each toggle.
8. **Practice isolation.** Log out, log in as
   `clinician@capemobility.co.za`. The dashboard shows **2 active
   patients** (Zanele, David) and no Northgate names anywhere.
9. **Role gating.** Log in as `platform.admin@limbitless.co.za` and go to
   `/dashboard`. Expect the message _"The caseload dashboard is only
   available to clinical staff."_ (the API returns 403), not a crash.
10. **Practice admin (read-only).** Log in as
    `admin@northgate-rehab.co.za` — the dashboard loads with the same
    Northgate numbers as scenario 1.

---

## R-06 — Patients

1. **List + search.** Patients nav → list of active Northgate patients.
   Type `nkosi` in search → filters to Sipho Nkosi after a short debounce.
2. **Status filter.** Switch the Status dropdown to **Inactive** → only
   Johannes Botha. Back to **Active** → he disappears.
3. **Detail.** Open Sipho Nkosi → demographics, "Active" badge, and the
   Devices / Recovery pathway / Outcome measures panels below.
4. **Create.** As a writer, **New patient**, fill first/last/DOB and a
   national ID, save → lands on the new patient's page. Try saving with
   neither ID nor passport → inline "enter a national ID or passport".
5. **Edit + deactivate.** Edit a field on your new patient, save, confirm
   it persists. **Deactivate** → badge flips to "Inactive"; it now only
   shows under the Inactive filter. **Reactivate** to undo.
6. **Read-only role.** As `admin@northgate-rehab.co.za`: no **New
   patient**, no **Edit** / **Deactivate**, but **View timeline** is
   still available.
7. **Cleanup.** Delete any patient you created (or leave it — the seed is
   unaffected).

---

## R-07 — Devices

1. **Panel.** Sipho Nkosi (id 25) detail → **Devices** shows two cards:
   a _Replaced_ Ottobock 3R60 and an _Active_ Ottobock 3R80, both right
   side; the active one reads "Replaces device #…".
2. **Add.** On Ayesha Patel (id 26), **Add device** → choose left /
   transradial / passive cosmetic / planned, save → card appears.
3. **Active-limb conflict.** On a patient who already has an _active_
   device for a limb (e.g. Thabo Molefe, left), **Add device** for the
   **same limb** with status _active_ → expect the 409 message
   _"That limb already has an active device…"_ and you stay on the form.
4. **Replace.** On that patient's active device → **Replace**. The form
   pre-fills limb + level + socket, resets status to _planned_, and
   clears manufacturer/serial/dates. Save → the old device becomes
   _Replaced_, the new one shows "Replaces device #…" and sits on top.
5. **Edit.** Edit a device's status to _In repair_, save → the card
   badge updates.

---

## R-08 — Recovery milestones

1. **Timeline panel.** Sipho Nkosi (id 25) → **Recovery pathway** shows
   7 numbered milestones; several carry an **Overdue** chip (target in
   the past, not complete).
2. **Complete a milestone.** On any non-complete milestone, **Mark
   complete** → status becomes _Complete_, completed date = today, the
   button disappears.
3. **Edit.** **Edit** a milestone → change status / target date / notes,
   save → the row reflects it; ordering follows `order_index` then target
   date.
4. **Apply a pathway.** Create a fresh patient (no milestones), open
   **Apply pathway**, pick _Lower limb_, start date today, interval 10 →
   7 milestones appear with target dates 10 days apart. Re-running
   **Apply pathway** for the same pathway → 409 _"already has milestones
   for that pathway"_.
5. **Add single milestone.** **Add milestone** → an empty submit is
   blocked with "Choose a milestone"; a valid one is created and slots
   into order.

---

## R-09 — Outcome measures + trend

1. **Trends.** Thabo Molefe (id 22) → **Outcome measures**: a trend
   chart for _Residual limb pain_ with a line across 3 points (one red,
   flagged, above the dashed "flag ≥ 7" line) and a _Socket Comfort
   Score_ chart. Below, a newest-first table; the flagged row is tinted
   with a "Flagged" chip.
2. **Single reading.** Ayesha Patel (id 26) has one PROM → its chart
   shows a single dot and no connecting line.
3. **Record.** **Record measure** → pick _Socket Comfort Score_, enter
   `3`, save. It appears at the top of the table with a "Flagged" chip
   (SCS ≤ 4) and a new red point on the chart / caption.
4. **Range validation.** **Record measure** → _Residual limb pain_,
   enter `99`, save → the backend rejects it and the form shows
   _"'score' must be between 0 and 10"_.
5. **Correct a reading.** Edit a flagged SCS reading from `3` to `7`,
   save → the flag clears (chip and red dot gone, latest value no longer
   red).

---

## R-10 — Timeline + notes

1. **Merged feed.** Sipho Nkosi (id 25) → **View timeline**. Newest
   first: notes, then PROM entries (with flag reason), then milestone
   entries (with target / completed dates), on a vertical rail with
   colour-coded markers.
2. **Filters.** The chips **All / Milestone / Outcome measure / Note**
   each show a count; clicking one filters the feed. "All" restores it.
3. **Add note.** **Add note** → empty submit blocked ("A note cannot be
   empty"); a real note saves and returns you to the timeline with the
   note on top.
4. **Edit note.** On any note event, **Edit note** → the body pre-fills;
   append text, save → the timeline shows the updated body.
5. **Read-only role.** As `admin@northgate-rehab.co.za`, the timeline
   loads but there is no **Add note** and no **Edit note**.

---

## Cross-cutting

- **Deep-link auth.** Paste `http://localhost:4200/patients/25/timeline`
  while logged out → redirected to login with a return URL, then back
  after signing in.
- **Writer-only routes.** As the practice admin, visiting
  `/patients/26/devices/new` (or any `/new` / `/edit`) → redirected to
  `/forbidden`.
- **Other practice.** As the Northgate clinician, `GET /patients/30`
  (Zanele, Cape Mobility) → the detail page shows a "could not be loaded"
  error (404 from the API), never her data.
