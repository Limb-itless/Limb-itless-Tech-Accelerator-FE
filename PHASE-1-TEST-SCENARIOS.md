# Phase 1 FE — manual test scenarios

Covers FE R-06 → R-15 (Patients, Limb involvements, Devices, Recovery
milestones, Outcome measures + trend, Timeline + notes, Dashboard,
Practice administration, Orthoses / bilateral, Platform administration).
Runs against the local stack with the seeded clinical sample data.

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
   devices, milestones, PROMs and notes. Re-running without `--reset`
   changes nothing.
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

IDs below assume a fresh `--reset` on an otherwise-untouched dev DB. If
your IDs differ, the **National ID** column is stable — search by name
and read the id off the URL.

| ID  | Name             | Involvement(s) → device(s)                                                                                          | Notable for                                                                     |
| --- | ---------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 36  | Thabo Molefe     | Left leg amputation (transfemoral, trauma) → Ottobock Genium X3 _active_                                              | mid-pathway, 1 overdue + 1 upcoming milestone, flagged residual-limb pain (8), 2 notes, 2 PROM points → trend line |
| 37  | Lerato Dlamini   | Right leg amputation (transtibial, dysvascular) → Blatchford Elan _active_                                            | **upcoming** milestone in ~4 days, flagged Socket Comfort Score (3), 3 PROMs incl. LCI |
| 38  | Naledi Khumalo   | Left arm amputation (transhumeral, tumour) → Ossur i-Limb Quantum _in fitting_                                        | upper-limb pathway, device _in fitting_, flagged phantom pain (7)             |
| 39  | Sipho Nkosi      | Right leg amputation (transfemoral, dysvascular) → Ottobock 3R60 _replaced_ + Ottobock 3R80 _active_ (one involvement) | **worst case**: 3 overdue milestones (one 38 days), 2 flagged PROMs (pain 9, LCI 18), a replaced+active device pair on one involvement |
| 40  | Ayesha Patel     | Left arm **congenital absence** (transradial) → Steeper Realistic Hand _planned_                                      | brand-new upper-limb patient, pathway just started, device _planned_, no flags; involvement has a level but **no cause** |
| 41  | Bongani Zulu     | Left leg amputation (transtibial, trauma) → Ottobock 1C30 _active_ + Ossur Cheetah Xtend _active_ (one involvement)   | discharged/annual-review: all 7 milestones complete; **two active devices on one involvement** (everyday leg + running blade) |
| 42  | Michelle van Wyk | Right leg amputation (knee disarticulation, infection) → Blatchford KX06 _in fitting_                                 | 1 overdue + 1 upcoming milestone, borderline flagged SCS (4)                  |
| 43  | Johannes Botha   | Left leg amputation (transtibial, dysvascular) → Ottobock 1C30 _retired_                                              | **inactive** patient (records closed), retired device                        |
| 44  | Zanele Mthembu   | Left leg amputation (transfemoral, trauma) → Ossur Power Knee _active_                                                | **Cape Mobility** — must NOT appear for Northgate users                       |
| 45  | David Fourie     | Right arm amputation (transradial, trauma) → Hosmer Hook 5XA _active_                                                 | **Cape Mobility** — upper limb, no flags                                      |
| 46  | Kagiso Sithole   | **Two amputation involvements**: Left leg (transfemoral) → Ottobock 3R80 _active_; Right leg (transtibial) → Ottobock Triton _active_ | **bilateral amputee** — one involvement per side, one active device each |
| 47  | Precious Ndlovu  | Right leg amputation (transtibial, trauma) → Blatchford Avalon _active_                                               | **Sunrise** — gives the third practice a caseload                            |
| 48  | Themba Cele      | Left leg amputation (transfemoral, dysvascular) → Ossur Rheo Knee XC _active_                                         | **Sunrise** — 1 overdue milestone                                            |
| 49  | Refilwe Adams    | **Two orthotic-need involvements**: Left leg → Blatchford Carbon AFO _active_; Spine → Aspen TLSO _active_            | **no limb loss** — post-stroke foot drop + a spinal brace; involvements carry no level or cause |

Extra Northgate staff exist for the admin screens:
`nomvula.clinician@`, `thandi.clinician@`, `pieter.prosthetist@` (all
active) and `former.clinician@northgate-rehab.co.za` (**deactivated**).
Cape Mobility has a second site, _Bellville Satellite Rooms_.

A third practice, **Sunrise Prosthetics & Orthotics** (Durban, private
practice), has one site (_Sunrise Durban Rooms_),
`admin@sunrise-prosthetics.co.za`, `clinician@sunrise-prosthetics.co.za`,
and two patients (Precious Ndlovu id 47, Themba Cele id 48). It exists so
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
3. **Detail.** Open Sipho Nkosi (39) → demographics, "Active" badge, and
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

1. **Bilateral — one involvement per side.** Open Kagiso Sithole (46) →
   the **Limb involvements** panel shows **two cards**:
   _Left leg — Amputation (Transfemoral)_ and
   _Right leg — Amputation (Transtibial)_. Each has an **Active** status
   badge, a `Cause` / `Onset` list (Dysvascular / the onset date), the
   involvement note ("Left transfemoral." / "Right transtibial; liner
   recently replaced."), and a **Devices** sub-list with **one** device
   (Ottobock 3R80 / Ottobock Triton), each showing an _Active_ badge and
   `Edit` / `Replace` links. Each card also has **Add device** and
   **Edit involvement**.
2. **Replaced + active devices on one involvement.** Sipho Nkosi (39) →
   **one** involvement card (_Right leg — Amputation (Transfemoral)_)
   whose Devices sub-list has **two** rows: a _Replaced_ Ottobock 3R60
   and an _Active_ Ottobock 3R80. (The seed adds them as independent
   rows, so neither shows a `replaces #…` line — that link only appears
   after you use **Replace**, see §13.)
3. **Multiple active devices, no conflict.** Bongani Zulu (41) → one
   involvement card with **two _Active_ devices** (Ottobock 1C30 everyday
   leg + Ossur Cheetah Xtend blade). No warning — the old "one active
   device per limb" rule is gone.
4. **Orthotic-need involvements.** Refilwe Adams (49) → **two cards**,
   both _Orthotic need_: _Left leg_ (Blatchford Carbon AFO) and _Spine_
   (Aspen TLSO). Neither card shows an amputation level in the title or a
   `Cause` row — those don't apply to an orthotic need. Only `Onset` is
   listed.
5. **Congenital absence.** Ayesha Patel (40) → one card
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
    `/patients/46/involvements/<iid>/devices/new`,
    `.../devices/<did>/edit`, `.../devices/<did>/replace`. Visiting a
    device `/new` as the practice admin → `/forbidden`.

### Optional involvement link on milestones / PROMs / notes / pathway

15. **The picker.** For Kagiso (46), open **Add milestone**, **Record
    measure**, **Add note** (from the timeline) and **Apply pathway** —
    each form has a **Limb involvement (optional)** `<select>` listing
    _Left leg — Amputation_ and _Right leg — Amputation_. Pick one, Save
    → the record is created against that involvement. Leave it on
    _None_ → the record stays patient-level (the previous behaviour).
16. **Single-involvement patient.** For Thabo (36) the same picker lists
    just his one involvement; the record still saves either way.
17. **API guard.** Posting a milestone / PROM / note with an
    `involvement_id` from another patient returns **400**
    _"involvement … does not belong to this patient"_. The FE only ever
    offers the current patient's involvements, so this is a backstop.

---

## R-07 — Devices

Devices now live **inside** an involvement card (R-15 §1–3, §12–14). This
section is the device-mechanics checklist.

1. **Panel.** Sipho Nkosi (39) → the single involvement card's **Devices**
   sub-list has two rows: a _Replaced_ Ottobock 3R60 and an _Active_
   Ottobock 3R80. (Seeded as independent rows — the `replaces #…` link
   only appears after using **Replace**, §4.)
2. **Add.** On Ayesha Patel (40)'s involvement card, **Add device** →
   choose _Passive cosmetic_ / _planned_, add a mount location, save → a
   new row appears under that card.
3. **No active-limb conflict.** Add a second _active_ device to Thabo
   Molefe (36)'s involvement → it is created, no 409. (Bongani (41) is
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

1. **Timeline panel.** Sipho Nkosi (39) → **Recovery pathway** shows
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

1. **Trends.** Thabo Molefe (36) → **Outcome measures**: a trend chart
   for _Residual limb pain_ with a line across **2 points**, the recent
   one red (flagged, above the dashed "flag ≥ 7" line), plus a single
   _Socket Comfort Score_ point. Below, a newest-first table; the flagged
   row is tinted with a "Flagged" chip.
2. **Single reading.** Ayesha Patel (40) has one PROM → its chart shows a
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

1. **Merged feed.** Sipho Nkosi (39) → **View timeline**. Newest first:
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

1. **Bilateral amputee.** Kagiso Sithole (46) → **two involvement
   cards**, one per side (Left leg transfemoral, Right leg transtibial),
   each with its own active device. His **Recovery pathway** and
   **Outcome measures** work exactly like a single-limb patient.
2. **Orthotics-only patient.** Refilwe Adams (49) → the header has **no**
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

- **Deep-link auth.** Paste `http://localhost:4200/patients/39/timeline`
  while logged out → redirected to login with a return URL, then back
  after signing in.
- **Writer-only routes.** As the practice admin, visiting
  `/patients/40/involvements/new` or any device `/new` / `/edit` →
  redirected to `/forbidden`.
- **Other practice.** As the Northgate clinician, `GET /patients/44`
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
- **`ProstheticDevice`** now has `involvement_id` instead of
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

1. **`ProstheticDevice` is a misnomer** — it holds orthoses too. The
   rename to `Device` (table, model, router path, FE feature) is a
   deferred cosmetic change; the model docstring notes it.
2. **PROM instruments are amputation-centric.** Residual-limb pain,
   phantom pain and Socket Comfort Score do not apply to an
   orthotic-need involvement; only LCI-5 (general mobility) fits.
   Refilwe Adams's seed data uses only LCI-5 for that reason. An
   orthotic instrument set + pathway template is not built.
3. **Pathway templates** are `lower_limb` / `upper_limb` only. Applying a
   pathway to an orthotic-need or bilateral case still picks the closest
   template; milestones are then edited by hand.
4. **The device form** shows prosthesis componentry fields (socket,
   liner, suspension, terminal device) regardless of device type. They
   are optional, so an orthosis leaves them blank; a future pass could
   swap in orthosis-relevant fields (joint type, trimline, strap config).
5. **No body-image view yet.** `region` + `mount_location` are captured
   so a future body-map screen can place each device; that screen is not
   built.
