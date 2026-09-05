# Phase 1 FE — manual test scenarios

Covers FE R-06 → R-26 (Patients, Limb involvements, Devices, Recovery
milestones, Outcome measures + trend, Timeline + notes, Dashboard,
Practice administration, Orthoses / bilateral, Platform administration,
Care team, Body map, Reports, Orthotic PROMs & pathway, Audit log,
Patient portal, per-type device componentry, medical-aid reviewer,
availability management, patient booking). Runs against the local stack
with the seeded clinical sample data. R-17 → R-26 are Phase 2 items;
R-25 and R-26 are the booking feature's first two FE slices (BE R-35 →
R-38 — availability slots, appointments, reschedule, coverage
determination). Still awaiting FE: a staff appointments/triage view and
the reviewer's coverage-decision queue.

> **R-15 model redesign.** A patient is now just a person. What is being
> treated lives in one or more **limb involvements** (an amputation, a
> congenital absence, or an intact part that needs an orthosis), and
> **devices hang off an involvement**, not off the patient. `Patient` no
> longer has `cause_of_limb_loss` / `limb_loss_level` — those moved onto
> the involvement (and only apply to amputations / congenital absence).
> Milestones, PROMs and notes may optionally be tied to an involvement;
> patient-level records still work. The old "one active device per limb"
> rule is gone.

## Setup

1. **Database** — the R-25 migration changes the schema (drops the two
   `patients` limb-loss columns, adds `limb_involvements`, re-parents
   `prosthetic_devices` onto involvements and wipes that table). A plain
   re-seed will **not** retrofit involvements, so reseed clean:
   ```bash
   cd Limb-itless-Tech-Accelerator-BE
   venv/Scripts/python.exe -m alembic upgrade head
   venv/Scripts/python.exe -m scripts.seed --reset
   ```
   The seed adds **14 patients** across **3 practices** (10 Northgate,
   2 Cape Mobility, 2 Sunrise), each with **1–2 limb involvements**,
   devices, milestones, PROMs, notes and a sample **audit trail**
   (~72 entries — R-31 seeds these so the audit view has content on a
   fresh DB). Re-running without `--reset` changes nothing.
2. **API**: `fastapi dev` (or `python -m uvicorn app.main:app --port 8000`).
3. **App**: `npm start` in `Limb-itless-Tech-Accelerator-FE` → http://localhost:4200.

### Logins (all share password `Password123!`)

| Email                                    | Role                                | Sees                                       |
| ---------------------------------------- | ----------------------------------- | ------------------------------------------ |
| `clinician@northgate-rehab.co.za`        | clinician (writer)                  | Northgate patients; assigned to most       |
| `prosthetist@northgate-rehab.co.za`      | prosthetist (writer)                | Northgate patients                         |
| `admin@northgate-rehab.co.za`            | practice admin (read-only clinical) | Northgate patients                         |
| `clinician@capemobility.co.za`           | clinician (writer)                  | Cape Mobility patients only                |
| `platform.admin@limbitless.co.za`        | platform admin                      | no clinical dashboard                      |
| `thabo.molefe@patient.limbitless.co.za`  | patient (portal)                    | own record only — Thabo Molefe (amputee)   |
| `refilwe.adams@patient.limbitless.co.za` | patient (portal)                    | own record only — Refilwe Adams (orthotic) |
| `reviewer@medscheme.co.za`               | medical-aid reviewer                | 3 shared records — Thabo, Kagiso, Refilwe  |

### Seeded patients (Northgate unless noted)

Since R-28, `reset_clinical()` restarts the id sequences, so a `--reset`
puts the clinical patients on **ids 1–14** every time. (On an older DB the
ids will be higher — the **National ID** column is stable, so search by
name and read the id off the URL.)

| ID  | Name             | Involvement(s) → device(s)                                                                                                            | Notable for                                                                                                                                |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Thabo Molefe     | Left leg amputation (transfemoral, trauma) → Ottobock Genium X3 _active_                                                              | mid-pathway, 1 overdue + 1 upcoming milestone, flagged residual-limb pain (8), 2 notes, 2 PROM points → trend line                         |
| 2   | Lerato Dlamini   | Right leg amputation (transtibial, dysvascular) → Blatchford Elan _active_                                                            | **upcoming** milestone in ~4 days, flagged Socket Comfort Score (3), 3 PROMs incl. LCI                                                     |
| 3   | Naledi Khumalo   | Left arm amputation (transhumeral, tumour) → Ossur i-Limb Quantum _in fitting_                                                        | upper-limb pathway, device _in fitting_, flagged phantom pain (7)                                                                          |
| 4   | Sipho Nkosi      | Right leg amputation (transfemoral, dysvascular) → Ottobock 3R60 _replaced_ + Ottobock 3R80 _active_ (one involvement)                | **worst case**: 3 overdue milestones (one 38 days), 2 flagged PROMs (pain 9, LCI 18), a replaced+active device pair on one involvement     |
| 5   | Ayesha Patel     | Left arm **congenital absence** (transradial) → Steeper Realistic Hand _planned_                                                      | brand-new upper-limb patient, pathway just started, device _planned_, no flags; involvement has a level but **no cause**                   |
| 6   | Bongani Zulu     | Left leg amputation (transtibial, trauma) → Ottobock 1C30 _active_ + Ossur Cheetah Xtend _active_ (one involvement)                   | discharged/annual-review: all 7 milestones complete; **two active devices on one involvement** (everyday leg + running blade)              |
| 7   | Michelle van Wyk | Right leg amputation (knee disarticulation, infection) → Blatchford KX06 _in fitting_                                                 | 1 overdue + 1 upcoming milestone, borderline flagged SCS (4)                                                                               |
| 8   | Johannes Botha   | Left leg amputation (transtibial, dysvascular) → Ottobock 1C30 _retired_                                                              | **inactive** patient (records closed), retired device                                                                                      |
| 9   | Zanele Mthembu   | Left leg amputation (transfemoral, trauma) → Ossur Power Knee _active_                                                                | **Cape Mobility** — must NOT appear for Northgate users                                                                                    |
| 10  | David Fourie     | Right arm amputation (transradial, trauma) → Hosmer Hook 5XA _active_                                                                 | **Cape Mobility** — upper limb, no flags                                                                                                   |
| 11  | Kagiso Sithole   | **Two amputation involvements**: Left leg (transfemoral) → Ottobock 3R80 _active_; Right leg (transtibial) → Ottobock Triton _active_ | **bilateral amputee** — one involvement per side, one active device each                                                                   |
| 12  | Precious Ndlovu  | Right leg amputation (transtibial, trauma) → Blatchford Avalon _active_                                                               | **Sunrise** — gives the third practice a caseload                                                                                          |
| 13  | Themba Cele      | Left leg amputation (transfemoral, dysvascular) → Ossur Rheo Knee XC _active_                                                         | **Sunrise** — 1 overdue milestone                                                                                                          |
| 14  | Refilwe Adams    | **Two orthotic-need involvements**: Left leg → Blatchford Carbon AFO _active_; Spine → Aspen TLSO _active_                            | **no limb loss** — post-stroke foot drop + a spinal brace; on the **orthotic pathway**, flagged Orthosis Comfort Score (3) + a QUEST score |

Extra Northgate staff exist for the admin screens:
`nomvula.clinician@`, `thandi.clinician@`, `pieter.prosthetist@` (all
active) and `former.clinician@northgate-rehab.co.za` (**deactivated**).
Cape Mobility has a second site, _Bellville Satellite Rooms_.

A third practice, **Sunrise Prosthetics & Orthotics** (Durban, private
practice), has one site (_Sunrise Durban Rooms_),
`admin@sunrise-prosthetics.co.za`, `clinician@sunrise-prosthetics.co.za`,
and two patients (Precious Ndlovu id 12, Themba Cele id 13). It exists so
the platform practices list has real data.

---

## R-11 — Dashboard

1. **Headline stats (whole practice).** Log in as the Northgate clinician
   → lands on `/dashboard`. Expect four cards: **Active patients 9**
   (Johannes is inactive and excluded; the four Cape/Sunrise patients are
   other practices), **Overdue milestones 5**, **Upcoming milestones 7**,
   **Flagged outcome measures 6**. The Overdue and Flagged cards are
   tinted (amber / red).
2. **Patients by phase.** The "Patients by phase" card lists milestone
   types with a mini bar each; the widest bar is _Initial fitting
   delivery_ (3). Then _Gait functional training_ (2), then _Cast socket
   fabrication_, _Wear schedule desensitization_ and _Independent
   ambulation adl_ (1 each). Bars scale relative to the peak.
3. **Overdue list.** "Overdue milestones" shows Sipho Nkosi three times
   (largest first: _38d overdue_), then Thabo Molefe (_9d_) and Michelle
   van Wyk (_3d_). Each row: patient name (link), milestone type, due
   date, and a `Nd overdue` pill.
4. **Upcoming list.** "Upcoming milestones" shows seven rows within the
   next 14 days, earliest first (Lerato Dlamini _in 4d_, then Kagiso
   Sithole and Thabo Molefe _in 5d_, …), each with an `in Nd` pill.
5. **Flagged measures.** "Flagged outcome measures" shows six rows newest
   first — Michelle van Wyk (SCS 4), Sipho Nkosi (pain 9), Lerato Dlamini
   (SCS 3), Thabo Molefe (pain 8), Naledi Khumalo (phantom 7), Sipho
   Nkosi (LCI 18) — each with the flag reason as a red pill.
6. **Row links.** Click any patient name → the patient detail page for
   that patient.
7. **My caseload toggle.** Click **My caseload**. Active patients drops
   to **8** (Bongani Zulu is assigned to the prosthetist, not this
   clinician); overdue / upcoming / flagged are unchanged. Click **Whole
   practice** to restore. The lists refetch on each toggle.
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

1. **List + search.** Patients nav → list of active Northgate patients
   (9 rows). Type `nkosi` in search → filters to Sipho Nkosi after a
   short debounce.
2. **Status filter.** Switch the Status dropdown to **Inactive** → only
   Johannes Botha. Back to **Active** → he disappears.
3. **Detail.** Open Sipho Nkosi (4) → demographics, "Active" badge, and
   the **Limb involvements** / Recovery pathway / Outcome measures panels
   below. The header has **no** "Cause of limb loss" / "Limb loss level"
   rows any more.
4. **Create → step 2.** As a writer, **New patient**, fill first / last /
   DOB and a national ID, save → you land on
   **`/patients/:id/involvements/first`** ("Step 2 of 2"). See R-15 §6.
   Try saving the patient with neither ID nor passport → inline "enter a
   national ID or passport".
5. **Edit + deactivate.** Edit a field on your new patient, save, confirm
   it persists (an edit returns to the detail page, **not** to step 2).
   **Deactivate** → badge flips to "Inactive"; it now only shows under
   the Inactive filter. **Reactivate** to undo.
6. **Read-only role.** As `admin@northgate-rehab.co.za`: no **New
   patient**, no **Edit** / **Deactivate**, but **View timeline** is
   still available.
7. **Cleanup.** Delete any patient you created (or leave it — the seed is
   unaffected).

---

## R-15 — Limb involvements & involvement-scoped records

### The involvements panel

1. **Bilateral — one involvement per side.** Open Kagiso Sithole (11) →
   the **Limb involvements** panel shows **two cards**:
   _Left leg — Amputation (Transfemoral)_ and
   _Right leg — Amputation (Transtibial)_. Each has an **Active** status
   badge, a `Cause` / `Onset` list (Dysvascular / the onset date), the
   involvement note ("Left transfemoral." / "Right transtibial; liner
   recently replaced."), and a **Devices** sub-list with **one** device
   (Ottobock 3R80 / Ottobock Triton), each showing an _Active_ badge and
   `Edit` / `Replace` links. Each card also has **Add device** and
   **Edit involvement**.
2. **Replaced + active devices on one involvement.** Sipho Nkosi (4) →
   **one** involvement card (_Right leg — Amputation (Transfemoral)_)
   whose Devices sub-list has **two** rows: a _Replaced_ Ottobock 3R60
   and an _Active_ Ottobock 3R80. (The seed adds them as independent
   rows, so neither shows a `replaces #…` line — that link only appears
   after you use **Replace**, see §13.)
3. **Multiple active devices, no conflict.** Bongani Zulu (6) → one
   involvement card with **two _Active_ devices** (Ottobock 1C30 everyday
   leg + Ossur Cheetah Xtend blade). No warning — the old "one active
   device per limb" rule is gone.
4. **Orthotic-need involvements.** Refilwe Adams (14) → **two cards**,
   both _Orthotic need_: _Left leg_ (Blatchford Carbon AFO) and _Spine_
   (Aspen TLSO). Neither card shows an amputation level in the title or a
   `Cause` row — those don't apply to an orthotic need. Only `Onset` is
   listed.
5. **Congenital absence.** Ayesha Patel (5) → one card
   _Left arm — Congenital absence (Transradial)_ — a level in the title
   but **no `Cause` row** (cause is recorded for acquired amputations
   only). Device: Steeper Realistic Hand, _Planned_.
6. **Empty state.** A patient with no involvements (e.g. one you just
   created and skipped step 2) shows _"No limb involvements recorded
   yet."_ with, for writers, _"Use **Add involvement** to record an
   amputation or an orthotic need."_
7. **Read-only role.** As `admin@northgate-rehab.co.za`, the panel
   renders but there is no **Add involvement**, **Add device**, **Edit
   involvement**, or device **Edit** / **Replace**.

### Two-step new-patient flow

8. **Add the first involvement.** Create a patient (R-06 §4) → land on
   **Step 2 of 2**. The form has **Kind** (defaults to _Amputation_),
   **Region**, **Level**, **Cause**, **Onset date**, **Notes** (no
   **Status** — that only appears when editing). Fill kind + region,
   Save → the patient detail page with the new card.
9. **Skip for now.** From Step 2, click **Skip for now** → the patient
   detail page with the empty involvements panel. You can add one later
   from the panel.

### Involvement create / edit

10. **Kind drives the fields.** From the panel, **Add involvement**.
    Choose **Orthotic need** → the **Level** and **Cause** fields
    disappear. Choose **Congenital absence** → **Cause** disappears,
    **Level** stays. Back to **Amputation** → both return. Save an
    orthotic-need involvement with no level/cause → it is created.
11. **Edit + resolve.** **Edit involvement** on a card → the form
    pre-fills and now shows a **Status** dropdown (_Active_ / _Resolved_).
    Change it to **Resolved**, Save → the card's badge flips to
    _Resolved_. (There is no delete.)

### Devices are nested under an involvement

12. **Add device.** On any involvement card, **Add device** → the device
    form. It has **no Limb side / Limb level** pickers — a muted note
    says the limb / region and amputation level come from the
    involvement. It has a **Mount location** free-text field (e.g.
    "posterior, lateral strut"). **Device type** is still grouped
    _Prosthesis / Orthosis_. Save → the device appears under that
    involvement's Devices sub-list.
13. **Edit / Replace.** **Edit** a device's status to _In repair_, Save →
    the badge updates. **Replace** an active device → the form pre-fills
    device type + componentry, resets status to _planned_, clears
    manufacturer / serial / dates. Save → the old device becomes
    _Replaced_, the new one shows `replaces #…`, both stay on the same
    involvement.
14. **Route shape.** Device routes are now nested:
    `/patients/11/involvements/<iid>/devices/new`,
    `.../devices/<did>/edit`, `.../devices/<did>/replace`. Visiting a
    device `/new` as the practice admin → `/forbidden`.

### Optional involvement link on milestones / PROMs / notes / pathway

15. **The picker.** For Kagiso (11), open **Add milestone**, **Record
    measure**, **Add note** (from the timeline) and **Apply pathway** —
    each form has a **Limb involvement (optional)** `<select>` listing
    _Left leg — Amputation_ and _Right leg — Amputation_. Pick one, Save
    → the record is created against that involvement. Leave it on
    _None_ → the record stays patient-level (the previous behaviour).
16. **Single-involvement patient.** For Thabo (1) the same picker lists
    just his one involvement; the record still saves either way.
17. **API guard.** Posting a milestone / PROM / note with an
    `involvement_id` from another patient returns **400**
    _"involvement … does not belong to this patient"_. The FE only ever
    offers the current patient's involvements, so this is a backstop.

---

## R-16 — Care team (patient assignments)

A **Care team** panel sits between the medical-history block and the
**Limb involvements** panel on the patient detail page. It reads the
`/patients/{id}/assignments` history and the `/practice/clinical-staff`
roster.

1. **Two current assignments.** Kagiso Sithole (11) → **Care team** lists
   two rows: _Clinician_ `clinician@northgate-rehab.co.za` and
   _Prosthetist_ `prosthetist@northgate-rehab.co.za`, each _since_ the
   pathway start date. Writers see an **End** button per row.
2. **One current assignment.** Sipho Nkosi (4) → a single _Clinician_
   row (his seed has no prosthetist).
3. **Assign staff.** As a writer, **Assign staff** →
   `/patients/:id/assignments/new`. The **Staff member** `<select>` lists
   only active clinicians / prosthetists in the practice
   (`nomvula.clinician@`, `pieter.prosthetist@`, `thandi.clinician@`, the
   two seeded logins — **not** `former.clinician@`, **not**
   `admin@northgate-rehab`). Pick one, leave the date blank, Save → back
   on the patient with the new row (role taken from the chosen account).
4. **Duplicate.** Assign the same person again → the form stays put with
   _"That person is already on this patient's care team."_ (the API 409).
5. **End an assignment.** On a current row, **End** → the row moves into
   **Past assignments (N)** (a collapsible list) with a
   _start – end_ date range. Ending is idempotent; the patient keeps any
   other current assignments.
6. **Read-only role.** As `admin@northgate-rehab.co.za` the panel renders
   both lists but there is **no Assign staff link and no End button**.
7. **Dashboard tie-in.** The dashboard **My caseload** toggle counts a
   patient only while the logged-in clinician has a current assignment on
   them — end your own assignment on a patient and it drops out of _My
   caseload_ (still in _Whole practice_).
8. **Practice isolation.** The staff picker for a Cape Mobility writer
   shows only Cape Mobility staff; assigning a Northgate user by ID
   (crafted request) → **400**.

---

## R-17 — Body map _(first Phase 2 item)_

A full-page **Body map** route (`/patients/:id/body-map`), linked from
the patient detail header next to **View timeline**. Read-only for every
patient-visible role. It reads the existing involvements + devices
endpoints — no new API.

1. **Markers by region.** Kagiso Sithole (11) → an SVG figure with **two
   red markers** on the legs — _Left leg_ on your **right**, _Right leg_
   on your **left** (the caption: "as if facing the patient"). Beside it,
   a card per involvement (region — kind (level), status badge) with the
   mounted device listed underneath.
2. **Kind colour.** Refilwe Adams (14) → **two blue markers** (orthotic
   need) — one on the left leg, one centre-torso for _Spine_. Amputations
   are red, congenital absence amber, orthotic need blue; the card swatch
   matches its marker.
3. **Mount location.** A device with a `mount_location` shows it after
   the status badge (`· posterior strut`). Seed devices mostly have none;
   add one via **Add device** (R-15 §12) and reload the map.
4. **Select to link.** Click a card → it highlights and its marker grows
   / gets a dark ring. Click the marker (or the card again) → clears.
5. **Resolved involvement.** Mark an involvement _Resolved_ (R-15 §11) →
   its marker draws faded on the next visit; the card still lists it.
6. **Unmapped region.** An involvement whose region is _Other_ (or a
   region with no anchor) is **not** drawn on the figure; its card shows
   _"Not shown on the figure (region: Other)."_ and sits with a dashed
   left border.
7. **Empty state.** A patient with no involvements → _"No limb
   involvements to map yet."_ and no figure.
8. **Left / right.** Confirm the handedness against a known case: Kagiso's
   _Left leg — Amputation (Transfemoral)_ marker is the one on the
   **viewer's right**.

---

## R-18 — Reports _(Phase 2)_

The **Reports** nav item (clinician / prosthetist / practice admin) now
opens a real page at `/reports` — practice-scoped rollups from
`GET /reports/summary`. A **Period** picker (7 / 30 / 90 / 365 days)
drives the "new" / "in period" figures.

1. **Four cards.** As the Northgate clinician → **Caseload**, **Milestone
   adherence**, **Outcome measures**, **Devices**, each a row of stat
   tiles plus horizontal bar breakdowns. Against the seed (Northgate):
   Caseload **9 active / 1 inactive / 2 new (30d)**, involvement mix
   **Amputation 7 · Congenital absence 1 · Orthotic need 1**.
2. **Milestone adherence.** ~**70% on time**, ~11 completed late,
   avg ~2.8 days late, **5 still overdue** (matches the dashboard's
   Overdue count). The _Completed late_ tile is amber, _Still overdue_
   red.
3. **Outcome measures.** 18 records, 17 in the last 30 days, **6
   flagged**, **5 patients with a flag**; "records by instrument" bars
   for the four PROM scales.
4. **Devices.** **14 total · 12 prostheses · 2 orthoses** (Northgate
   only — Cape / Sunrise devices are excluded), with "by type" and "by
   status" bars.
5. **Period picker.** Switch to **last 7 days** → _new patients_ and
   _recorded in period_ drop; switch to **last year** → they rise. The
   other figures (totals, adherence, flags) don't move.
6. **Practice isolation.** Log in as `clinician@capemobility.co.za` →
   the numbers are Cape Mobility's only (2 active patients, its own
   devices).
7. **Role gating.** As `platform.admin@limbitless.co.za`, `/reports`
   redirects to `/forbidden` (route guard). A direct API call as a
   platform admin → 403, and the page would show _"Reports are only
   available to clinical staff."_
8. **Practice admin.** `admin@northgate-rehab.co.za` sees the same
   Northgate report (read-only, nothing to interact with beyond the
   period picker).

---

## R-19 — Orthotic PROMs & pathway _(Phase 2)_

Orthotics patients no longer borrow amputation instruments and the
lower-limb template. Needs `alembic upgrade head` (migration
`e2f9c7d34a10` adds enum values) + a `--reset`.

1. **Orthotic pathway on the patient page.** Refilwe Adams (14) →
   **Recovery pathway** reads _Pathway: Orthotic_ for every row, and the
   steps are **Orthotic assessment → Orthosis casting → Initial fitting
   delivery → Wear schedule desensitization → Gait functional training →
   Independent ambulation adl → Community reintegration followup** (no
   "pre-prosthetic assessment" / "cast socket fabrication").
2. **Apply the orthotic pathway.** On a fresh patient, **Apply pathway**
   → the **Pathway** select offers **Lower limb / Upper limb /
   Orthotic**. Pick _Orthotic_, interval 14 → 7 orthotic milestones,
   dates spaced 14 days.
3. **Grouped instrument picker.** Refilwe → **Record measure** → the
   **Instrument** `<select>` is grouped into `<optgroup>`s:
   _Amputation_ (Residual limb pain, Phantom pain, Socket Comfort Score),
   _Orthotic_ (Orthosis Comfort Score), _General_ (LCI-5, Device
   satisfaction (QUEST 2.0)). Any group is still selectable for any
   patient — the grouping is a hint, not a restriction.
4. **Orthosis Comfort Score.** Pick _Orthosis Comfort Score_ → hint
   _"0–10, higher is better · flags ≤ 4"_. Enter `3`, save → flagged,
   reason _"Orthosis Comfort Score 4 or below out of 10"_, red point on
   its own trend chart. (Refilwe already has one seeded.)
5. **QUEST 2.0.** Pick _Device satisfaction (QUEST 2.0)_ → the score
   bounds become **1–5** (not 0–10); `5` → save, `0` → the backend
   rejects it (_"'score' must be between 1 and 5"_); `3` → flagged.
6. **Trend + timeline.** Refilwe's **Outcome measures** panel shows three
   charts (Orthosis Comfort Score, QUEST, LCI-5); the timeline lists the
   orthotic PROM entries like any other.

---

## R-21 — Audit log _(Phase 2)_

Log in as **`admin@northgate-rehab.co.za`** → **Users** → the third tab,
**Audit** (`/users/audit`). Read-only; consumes `GET /admin/audit`.

1. **Trail.** A newest-first table — **When / Actor / Action / Entity /
   Ref** — paged 20 at a time (`1–20 of 54` for Northgate on the seed).
   Rows with no actor render _"— (deleted user)"_; a list/search read
   (e.g. `dashboard`) shows **Ref** as `—`. Action chips are colour-coded
   (create green, update amber, delete red).
2. **Filters from facets.** The **Actor** and **Entity** dropdowns are
   populated from `/admin/audit/facets` — only values that actually
   appear in this practice's trail (`clinician@` / `prosthetist@`;
   `dashboard` / `device` / `patient` / `prom_record`). **Action** is the
   fixed four. Pick **Entity = Device** → the list narrows to the 14
   device-create rows (`1–14 of 14`); the offset resets to page 1 on any
   filter change.
3. **Date range.** Set **From** to ~10 days ago → older entries drop;
   **To** is inclusive of that whole day. **Clear** resets every filter.
4. **Practice isolation.** As `admin@capemobility.co.za` the trail shows
   only Cape Mobility's entries and its own actors.
5. **Role gating.** As `clinician@northgate-rehab.co.za` (or the platform
   admin), `/users/audit` → `/forbidden` (the `/users` route guard); a
   direct API call by a non-admin → **403**.
6. **It is not self-logging.** Opening the Audit view repeatedly does not
   add `read` / `audit` rows — the admin list endpoints don't record
   their own reads.

---

## R-22 — Patient portal _(Phase 2)_

Needs `alembic upgrade head` (migration `a7d0e2f16b93` adds
`patients.user_id`) + a `--reset` — the seed creates two practice-bound
patient logins and links them.

1. **Landing.** Log in as **`thabo.molefe@patient.limbitless.co.za`** /
   `Password123!` → you land on **/portal** (not the dashboard). The nav
   shows only **My care** / **My measures**; there is no Patients /
   Dashboard / Reports.
2. **My care.** The page greets _"Hello, Thabo"_, names the clinic, then
   **What we're treating** (his left-leg amputation + the myoelectric
   device) and **Your next steps** (his incomplete milestones, earliest
   first, an _overdue_ tag on any past-due one).
3. **My measures — history.** **My measures** lists his recorded PROMs
   newest-first (measure / score / date); flagged rows are tinted.
4. **My measures — submit.** The **Measure** dropdown offers only the
   scales for his involvement kind — for Thabo that's residual-limb pain,
   phantom pain, Socket Comfort Score, LCI-5, QUEST (no _Orthosis
   Comfort Score_). Pick one, the score field shows its bounds; submit →
   _"Thanks — that's been sent to your care team."_ and the row appears
   in the history. An out-of-range score → the backend message.
5. **Orthotic patient.** Log in as
   **`refilwe.adams@patient.limbitless.co.za`** → her **My measures**
   dropdown offers _Orthosis Comfort Score_, QUEST and LCI-5 — **not**
   the amputation scales.
6. **Isolation + gating.** The portal only ever shows the logged-in
   patient's own record. A staff member hitting `/portal/me` → **403**;
   the generic `patient@limbitless.co.za` (no linked record) → the API
   returns **404** and the page shows a "contact your clinic" message.
7. **Linking (staff side).** As a clinician, `POST
/patients/{id}/link-user {user_id}` ties a `patient`-role account to a
   record (400 for a non-patient account, 409 if that login is already
   linked elsewhere); `DELETE` the same path unlinks.

---

## R-23 — Per-type device componentry _(Phase 2)_

Needs `alembic upgrade head` (migration `b4c8d1f2e309` adds four
`devices` columns) + a `--reset`.

1. **Orthosis edit.** Refilwe Adams (14) → her AFO's **Edit** → the
   **Componentry** section shows **Joint type / Trimline / Strap
   configuration / Padding / lining** (seeded — "Articulated ankle…",
   "Posterior, supramalleolar", …), and there is **no** Socket / Liner /
   Suspension / Terminal device field.
2. **Prosthesis add.** On any amputation involvement (e.g. Thabo, 1) →
   **Add device** → the section shows **Socket / Liner / Suspension /
   Terminal device** (the default; device type unset ⇒ prosthesis set).
3. **Switch the type.** On the AFO edit form, change **Device type** to a
   prosthesis → the four orthosis inputs disappear and the four
   prosthesis inputs appear (and vice versa). Manufacturer / model /
   serial / mount location stay throughout.
4. **Save only the matching set.** Add an orthosis, fill a joint type,
   save → the record has `joint_type` set and `socket_type` (etc.) null;
   the reverse for a prosthesis. Nothing you typed in the hidden set is
   sent.

---

## R-24 — Medical-aid reviewer _(Phase 2)_

Needs `alembic upgrade head` (migration `c5e2a9b41f07` adds
`review_grants`) + a `--reset`. The seed shares Thabo (1), Kagiso (11)
and Refilwe (14) with `reviewer@medscheme.co.za`.

1. **Landing.** Log in as **`reviewer@medscheme.co.za`** / `Password123!`
   → you land on **/review**; the nav shows only **Reviews**.
2. **Shared list.** A **Patient reviews** table — surname / DOB /
   practice / involvement count — with the three shared patients
   (Adams, Molefe, Sithole), each linking to the record. _"Read-only"_
   is stated up front.
3. **The record.** Open Refilwe → demographics, then **Limb
   involvements** (each involvement + its devices, and for the orthoses
   the joint / trimline / strap / lining fields from R-23), **Recovery
   milestones** (with an _overdue_ tag), **Outcome measures** (flagged
   count in the heading, flagged rows tinted), **Clinical notes**. There
   are **no buttons or inputs** anywhere in the record.
4. **Not shared → 404.** Navigate to `/review/2` (Lerato, not shared) →
   _"This record could not be loaded. It may no longer be shared with
   you."_
5. **Grant / revoke (staff side).** As a clinician,
   `POST /patients/{id}/review-access {reviewer_id}` shares a record
   (400 if the id isn't an active reviewer, 409 if already shared);
   `GET` the same path lists who has access; `DELETE
/patients/{id}/review-access/{reviewer_id}` revokes it — the patient
   then drops off that reviewer's list.
6. **Role gating.** As any staff role, `/review` → `/forbidden`; a
   reviewer hitting `/patients` or `/portal` → `/forbidden`. Every review
   read lands in the **treating practice's** audit trail (R-21) as the
   reviewer reading a `patient`.

---

## R-25 — Availability management _(Phase 2 — booking, FE)_

The first FE slice of the booking feature (BE R-35 → R-38 — availability
slots, appointments, reschedule, coverage determination — none of which
has any other FE screen yet; this section covers only the new
**/availability** screen). Needs a `--reset` after `alembic upgrade
head` (4 new migrations since R-24: `d6f3b8a2c541` medical-aid +
availability slots, `e4f7a2c9b813` appointments, `f8a5c1e7d234`
reschedule, `b2e9f4a17c65` coverage determination + reviewer
`scheme_name`). The seed publishes 6 sample slots across the Northgate
clinician and prosthetist (plus one Cape Mobility slot) and books 3
appointments — Thabo's is confirmed and its coverage approved, Kagiso's
was cancelled by the practitioner, Refilwe's coverage is still pending.

1. **Nav.** Log in as `clinician@northgate-rehab.co.za` → **Availability**
   appears between Patients and Reports (also visible to prosthetists
   and practice administrators).
2. **The schedule.** `/availability` lists every slot in the practice —
   When / Practitioner / Type / Status / Notes. A practice administrator
   sees the same table with **no** Publish / Edit / Block controls
   anywhere (read-only).
3. **Own vs. others'.** Only your own **non-booked** slots get **Edit**
   / **Block** (or **Reopen**, if already blocked) — another
   practitioner's slots, and your own once booked, show no actions.
   Thabo's booked review slot vs. the open initial-assessment slot right
   after it (both the clinician's own) are a good side-by-side.
4. **Filters.** The Practitioner select (from the practice's clinical
   staff roster) and Status select narrow the table; "All" clears each.
5. **Publish a slot.** **Publish slot** → start date/time, duration in
   minutes (this derives the end time — there's no separate end-time
   picker), appointment type, status (Open or Blocked — never Booked,
   that only happens by being booked into), optional notes. Save → back
   on the list with the new row.
6. **Overlap conflict.** Publish a second slot overlapping one you
   already have → _"This overlaps a slot you already have."_
7. **Block / Reopen inline.** **Block** on one of your open slots flips
   it immediately, no navigation; **Reopen** reverses it.
8. **Edit.** **Edit** on one of your own slots → the form prefills,
   including a **duration derived from the existing start/end times**;
   change the type or notes, Save → the list reflects it.
9. **Role gating.** A patient or medical-aid reviewer never sees the
   Availability nav link; visiting `/availability` directly →
   `/forbidden`. `/availability/new` and `/availability/:id/edit` are
   writer-only — a practice administrator visiting either →
   `/forbidden`.

---

## R-26 — Patient booking _(Phase 2 — booking, FE)_

The patient side of the booking feature (`/portal/booking`), reusing
R-25's seeded slots. No schema change - same migrations as R-25.
Rescheduling reuses the same "Book a session" slot list in a different
mode rather than a separate picker, so the demo naturally exercises the
coverage carry-over rule from BE R-38: moving Thabo's approved **Review**
onto another **Review** slot would carry the same approval over; moving
it onto a **Fitting** slot (a different appointment type) re-triggers a
fresh **pending** determination - the scenario below does the latter, so
watch the badge change.

1. **Nav.** Log in as `thabo.molefe@patient.limbitless.co.za` /
   `Password123!` → **My appointments** sits between My care and My
   measures.
2. **Upcoming.** Thabo's seeded Review appointment shows with a
   **Medical aid approved** badge (BE R-38 seeded it pre-approved).
   **Book a session** below lists the practice's other open slots.
3. **Reschedule re-triggers coverage.** **Reschedule** on the Review
   appointment → the "Book a session" heading becomes "Choose a new
   time" and every slot's button becomes **Move here**; pick the
   Fitting slot → back on **Upcoming** with the new Fitting appointment
   showing **Awaiting medical-aid approval** (the type changed, so the
   old approval didn't carry - confirms BE R-38's rule from the FE
   side). The old Review appointment now shows under **Past
   appointments** as _"...— Rescheduled"_, and its slot is back in the
   bookable list.
4. **Cancel.** **Cancel appointment** on the (now Fitting) upcoming
   appointment → it moves to **Past appointments** as _"...— Cancelled
   by you"_, **Upcoming** shows the empty state, and its slot reappears
   in **Book a session**.
5. **Book.** **Book** on any open slot → **Upcoming** shows it
   immediately ("Done — your appointment is confirmed."); a self-pay
   patient (no `MedicalAidMembership`) would show no coverage badge at
   all, since no `CoverageDetermination` is opened for one.
6. **Keep the current time.** Start a reschedule, then use "keep the
   current time" (either the button under the appointment or the inline
   link above the slot list) → back to normal, nothing changed.
7. **Someone else's record.** As Refilwe
   (`refilwe.adams@patient.limbitless.co.za`), her own pending Fitting
   appointment is what you'd expect - she never sees Thabo's.

---

## R-07 — Devices

Devices now live **inside** an involvement card (R-15 §1–3, §12–14). This
section is the device-mechanics checklist.

1. **Panel.** Sipho Nkosi (4) → the single involvement card's **Devices**
   sub-list has two rows: a _Replaced_ Ottobock 3R60 and an _Active_
   Ottobock 3R80. (Seeded as independent rows — the `replaces #…` link
   only appears after using **Replace**, §4.)
2. **Add.** On Ayesha Patel (5)'s involvement card, **Add device** →
   choose _Passive cosmetic_ / _planned_, add a mount location, save → a
   new row appears under that card.
3. **No active-limb conflict.** Add a second _active_ device to Thabo
   Molefe (1)'s involvement → it is created, no 409. (Bongani (6) is
   the seeded example of two active devices on one involvement.)
4. **Replace.** On an active device → **Replace**. The form pre-fills
   device type + socket, resets status to _planned_, clears
   manufacturer / serial / dates. Save → the old device becomes
   _Replaced_, the new one shows `replaces #…` under the same
   involvement.
5. **Edit.** Edit a device's status to _In repair_, save → the badge
   updates.

---

## R-08 — Recovery milestones

1. **Timeline panel.** Sipho Nkosi (4) → **Recovery pathway** shows
   7 numbered milestones; three carry an **Overdue** chip (target in
   the past, not complete).
2. **Complete a milestone.** On any non-complete milestone, **Mark
   complete** → status becomes _Complete_, completed date = today, the
   button disappears.
3. **Edit.** **Edit** a milestone → change status / target date / notes
   (and optionally the **Limb involvement**, R-15 §15), save → the row
   reflects it; ordering follows `order_index` then target date.
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

1. **Trends.** Thabo Molefe (1) → **Outcome measures**: a trend chart
   for _Residual limb pain_ with a line across **2 points**, the recent
   one red (flagged, above the dashed "flag ≥ 7" line), plus a single
   _Socket Comfort Score_ point. Below, a newest-first table; the flagged
   row is tinted with a "Flagged" chip.
2. **Single reading.** Ayesha Patel (5) has one PROM → its chart shows a
   single dot and no connecting line.
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

1. **Merged feed.** Sipho Nkosi (4) → **View timeline**. Newest first:
   notes, then PROM entries (with flag reason), then milestone entries
   (with target / completed dates), on a vertical rail with colour-coded
   markers.
2. **Filters.** The chips **All / Milestone / Outcome measure / Note**
   each show a count; clicking one filters the feed. "All" restores it.
3. **Add note.** **Add note** → empty submit blocked ("A note cannot be
   empty"); a real note saves and returns you to the timeline with the
   note on top. The note form also has the optional **Limb involvement**
   picker (R-15 §15).
4. **Edit note.** On any note event, **Edit note** → the body pre-fills;
   append text, save → the timeline shows the updated body.
5. **Read-only role.** As `admin@northgate-rehab.co.za`, the timeline
   loads but there is no **Add note** and no **Edit note**.

---

## R-12 — Practice administration

Log in as **`admin@northgate-rehab.co.za`** and open **Users** in the nav.

1. **Staff list.** 7 rows. Each shows email, role, **site** (e.g.
   _Northgate Main Hospital_), and status. `former.clinician@` is
   **Inactive**.
2. **Filters.** Role = _Clinician_ → 4 rows. Add Status = _Inactive_ →
   just `former.clinician@`. Reset both.
3. **Search.** Type `pieter` → one row.
4. **Create.** **New user** → email `new.clinician@northgate-rehab.co.za`,
   role _Clinician_, site _Rosebank Gait Lab_, a temporary password (8+
   chars). Save → back to the list with the new user. Try a duplicate
   email (`clinician@northgate-rehab.co.za`) → _"A user with that email
   already exists."_
5. **Edit.** Open a user → change their site, tick/untick **Account is
   active**, Save. The row reflects it. Then use **Set a new password**
   (the separate block) → _"Password updated."_
6. **Self-protection.** Edit your own account (`admin@northgate-rehab`)
   and untick **active** → Save → _"You cannot deactivate your own
   account."_
7. **Sites tab.** **Sites** → 2 rows (Northgate Main Hospital /
   Location, Rosebank Gait Lab / Department). Type filter works.
8. **Create / edit a site.** **New site** → name + type + address, Save →
   appears in the list. Edit it → rename, Save. (Sites cannot be
   deleted.)
9. **Role gating.** As `clinician@northgate-rehab.co.za` or
   `platform.admin@`, `/users` → `/forbidden`.
10. **Practice isolation.** As `admin@capemobility.co.za`, the staff list
    shows only Cape Mobility users and the Sites tab shows _Cape Mobility
    Clinic_ + _Bellville Satellite Rooms_.

---

## R-13 — Orthoses & bilateral / no-limb-loss patients

1. **Bilateral amputee.** Kagiso Sithole (11) → **two involvement
   cards**, one per side (Left leg transfemoral, Right leg transtibial),
   each with its own active device. His **Recovery pathway** and
   **Outcome measures** work exactly like a single-limb patient.
2. **Orthotics-only patient.** Refilwe Adams (14) → the header has **no**
   limb-loss rows at all. The involvements panel lists two _Orthotic
   need_ cards — _Left leg_ (Blatchford Carbon AFO) and _Spine_ (Aspen
   TLSO), both active, with no amputation level or cause.
3. **Add an orthosis.** On any involvement, **Add device** → the
   **Device type** picker is grouped **Prosthesis / Orthosis**. Pick an
   orthosis type → save with the componentry fields blank; the device is
   created. (There is no per-device limb side / level any more — the
   region comes from the involvement.)
4. **Record an orthotic need.** **Add involvement** → **Kind = Orthotic
   need**, pick a **Region** (e.g. _Spine_ or _Trunk_) → the **Level** /
   **Cause** fields are hidden. Save → an orthotic-need card with only
   the region, onset and (optional) notes.

---

## R-14 — Platform administration

Log in as **`platform.admin@limbitless.co.za`**.

1. **Landing + nav.** You land on **/platform** (not the dashboard). The
   primary nav shows only **Practices**.
2. **Practices list.** Three rows — Cape Mobility Clinic, Northgate
   Rehabilitation Network, Sunrise Prosthetics & Orthotics — each with
   **Sites / Users / Patients** counts (Northgate: 2 / 7 / 10). Search by
   name filters the list.
3. **Detail.** Click a practice → its type, address, counts, and site
   list.
4. **Onboard.** **Onboard a practice** → fill Practice (name/type/
   address), First site, and First administrator (email + 8+ char
   password). Save → you land on the new practice's detail page with
   **Users 1** and the one site. It now appears in the list.
5. **Duplicate admin email.** Onboard again using the same administrator
   email → _"A user with that administrator email already exists. Nothing
   was created."_ and you stay on the form (the practice is **not**
   created — full rollback).
6. **Add a recovery admin.** On a practice detail page, use **Add a
   practice administrator** (email + password) → _"Practice administrator
   added."_ and the **Users** count goes up.
7. **Edit a practice.** **Edit** on a detail page → change the name,
   Save → back on detail with the new name.
8. **Add a platform admin.** Bottom of the practices list → **Add a
   platform administrator** (email + password) → _"Platform administrator
   added."_ (sign in as them to confirm they also land on /platform).
9. **Role gating.** As any non-platform user, `/platform` → `/forbidden`.
   As the platform admin, `/patients` or `/users` → `/forbidden`.

---

## Cross-cutting

- **Deep-link auth.** Paste `http://localhost:4200/patients/4/timeline`
  while logged out → redirected to login with a return URL, then back
  after signing in.
- **Writer-only routes.** As the practice admin, visiting
  `/patients/5/involvements/new` or any device `/new` / `/edit` →
  redirected to `/forbidden`.
- **Other practice.** As the Northgate clinician, `GET /patients/9`
  (Zanele, Cape Mobility) → the detail page shows a "could not be loaded"
  error (404 from the API), never her data. The same holds for her
  involvements and devices.

---

## Modelling notes — the R-15 involvement model

**What changed (R-25 / R-26 backend, R-15 frontend):**

- **`Patient`** is demographics only. `cause_of_limb_loss` and
  `limb_loss_level` were removed.
- **`LimbInvolvement`** sits between the patient and the devices. One
  patient → many involvements. `kind` is `amputation` /
  `congenital_absence` / `orthotic_need`; `region` is a `BodyRegion`
  (left/right leg or arm, spine, trunk, other); `level` (amputation
  level) and `cause` are nullable and only meaningful for an amputation
  (level also for congenital absence); `status` (`active` / `resolved`)
  is **informational only**.
- **`Device`** (the `devices` table — renamed from `ProstheticDevice` /
  `prosthetic_devices` in R-30) has `involvement_id` instead of
  `patient_id`, dropped `limb_side` / `limb_level`, and gained a
  free-text `mount_location`. A patient's devices are read across all of
  their involvements via `GET /patients/{id}/devices`.
- **The "one active device per limb" unique index is gone.** A patient
  can have any number of active devices on one involvement (e.g. an
  everyday leg plus a running blade — Bongani Zulu).
- **Milestones, PROMs, notes and the pathway-apply endpoint** take an
  optional `involvement_id` (FK, `ON DELETE SET NULL`). Patient-level
  records (null) remain the default.
- **New-patient is two steps:** patient details → an optional first
  involvement (`/patients/:id/involvements/first`, skippable). Further
  involvements are added from the detail-page panel.

**Known limitations / future work (not done):**

1. **~~`ProstheticDevice` is a misnomer~~** — renamed to `Device` /
   `devices` in R-30 (migration `f3a1b2c4d5e6`, table + owned
   sequence/indexes/FKs). Audit `entity_type` is now `"device"`.
2. **~~PROM instruments are amputation-centric~~** — addressed in R-19:
   `orthosis_comfort_score` and `quest_satisfaction` (QUEST 2.0) were
   added, the picker groups instruments Amputation / Orthotic / General,
   and there is now an **orthotic pathway template**
   (`orthotic_assessment → orthosis_casting → fitting → wear-in →
function …`). Refilwe Adams is seeded on it. A bilateral case still
   picks lower- or upper-limb and is edited by hand.
3. **~~The device form is prosthesis-centric~~** — R-23: the Componentry
   set now swaps by device type (orthosis → joint type / trimline / strap
   configuration / padding-lining; prosthesis → socket / liner /
   suspension / terminal device), backed by four new `devices` columns
   (migration `b4c8d1f2e309`).
4. **Body map is region-level** (R-17). `mount_location` shows as a text
   label on the card, not a coordinate on the figure; precise placement
   would need a normalized x/y or a mount-point enum on the device.
