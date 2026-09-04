# Phase 1 FE — manual test scenarios

Covers FE R-06 → R-14 (Patients, Devices, Recovery milestones, Outcome
measures + trend, Timeline + notes, Dashboard, Practice administration,
Orthoses / bilateral, Platform administration). Runs against the local
stack with the seeded clinical sample data.

## Setup

1. **Database** — apply migrations and seed:
   ```bash
   cd Limb-itless-Tech-Accelerator-BE
   venv/Scripts/python.exe -m alembic upgrade head
   venv/Scripts/python.exe -m scripts.seed          # idempotent; --reset to start clean
   ```
   The seed adds **14 patients** across **3 practices** (10 Northgate,
   2 Cape Mobility, 2 Sunrise) with devices, milestones, PROMs and notes.
   Re-running it changes nothing.
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
| 32  | Kagiso Sithole   | **bilateral amputee** — one device per side (left transfemoral, right transtibial), both active                           |
| 33  | Refilwe Adams    | **no limb loss** — post-stroke: an ankle-foot orthosis + a spinal brace; limb-loss level and cause are blank              |

Extra Northgate staff exist for the admin screens:
`nomvula.clinician@`, `thandi.clinician@`, `pieter.prosthetist@` (all
active) and `former.clinician@northgate-rehab.co.za` (**deactivated**).
Cape Mobility has a second site, _Bellville Satellite Rooms_.

A third practice, **Sunrise Prosthetics & Orthotics** (Durban, private
practice), has one site, `admin@sunrise-prosthetics.co.za`,
`clinician@sunrise-prosthetics.co.za`, and two patients (Precious Ndlovu,
Themba Cele). It exists so the platform practices list has real data.

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

1. **Bilateral amputee.** Kagiso Sithole (id 32) → **Devices** shows two
   active devices, one per side, each with its own limb level (left
   transfemoral, right transtibial). His **Recovery pathway** and
   **Outcome measures** work exactly like a single-limb patient.
2. **Orthotics-only patient.** Refilwe Adams (id 33) → the header shows
   **Limb loss level —** and **Cause of limb loss —** (blank). **Devices**
   lists _Left — Ankle-foot orthosis (AFO)_ and _Bilateral — Spinal
   orthosis / brace_, both active, with no limb level.
3. **Add an orthosis.** On any patient, **Add device** → the **Device
   type** picker is grouped **Prosthesis / Orthosis**; **Limb side**
   includes **Bilateral**. Pick an orthosis → the **Limb level** field
   switches to _"Not applicable"_ and the hint reads _"Orthoses have no
   amputation level."_ Save with no level → the device is created.
4. **Prosthesis still needs a level.** Pick a prosthesis type and leave
   the level blank → Save is blocked with _"Limb level is required."_
   Switching to an orthosis clears that.

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

- **Deep-link auth.** Paste `http://localhost:4200/patients/25/timeline`
  while logged out → redirected to login with a return URL, then back
  after signing in.
- **Writer-only routes.** As the practice admin, visiting
  `/patients/26/devices/new` (or any `/new` / `/edit`) → redirected to
  `/forbidden`.
- **Other practice.** As the Northgate clinician, `GET /patients/30`
  (Zanele, Cape Mobility) → the detail page shows a "could not be loaded"
  error (404 from the API), never her data.

---

## Modelling notes — multi-limb loss and orthotics

**Where the model stands after R-23 / R-13:**

- **More than one limb lost** is supported through _devices_, not a
  second field on the patient. A bilateral (or triple) amputee gets one
  `ProstheticDevice` per side, each carrying its own `limb_side` and
  `limb_level`; the "one active device per limb side" rule still holds
  per side. `Patient.limb_loss_level` / `cause_of_limb_loss` stay as a
  single _primary_ descriptor (or blank) — the per-side detail lives on
  the devices, and the recovery pathway / PROMs / timeline all attach to
  the patient (optionally to a device) so they already cover a
  multi-limb case. Seeded example: **Kagiso Sithole (id 32)**.
- **Patients with no amputation** (orthotics only) are supported:
  `limb_loss_level` and `cause_of_limb_loss` are nullable and left blank,
  and `DeviceType` now has orthosis values (`orthosis_afo`,
  `orthosis_kafo`, `orthosis_spinal`, `orthosis_upper_limb`) with
  `limb_level` null and a `LimbSide.bilateral` option for trunk / spinal
  bracing. Seeded example: **Refilwe Adams (id 33)** — a foot-drop AFO
  plus a lumbar brace.

**Known limitations / future work (not done):**

1. **`cause_of_limb_loss` is single-valued.** A bilateral amputee whose
   two amputations have different causes can only record one. If this
   matters, move cause onto the device (or a per-limb sub-record).
2. **`ProstheticDevice` is a misnomer now** — it holds orthoses too.
   A rename to `AssistiveDevice` / `Device` (table, model, router path,
   FE feature) is deferred; the class docstring notes it.
3. **PROM instruments are amputation-centric.** Residual-limb pain,
   phantom pain and Socket Comfort Score do not apply to an
   orthotics-only patient; only LCI-5 (general mobility) fits. An
   orthotics patient needs its own instrument set + pathway template —
   not yet built. Refilwe's seed data uses only LCI-5 for this reason.
4. **Pathway templates** are `lower_limb` / `upper_limb` only. Orthotics
   and bilateral rehab would benefit from their own templates; for now
   the closest template is applied and milestones are edited by hand.
5. **The device form** shows prosthesis-only componentry fields (socket,
   liner, suspension, terminal device) regardless of type. They are all
   optional, so an orthosis just leaves them blank, but a future pass
   could swap in orthosis-relevant fields (joint type, trimline, strap
   config).
