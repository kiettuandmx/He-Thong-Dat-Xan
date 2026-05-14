# Stadium Hashtags Assignment Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Complete the Hashtag system by allowing Owners and Admins to assign hashtags to stadiums via a reusable modal component.

**Architecture:** Use a reusable React modal component with checkboxes. Update backend controllers to include hashtag data in responses.

**Tech Stack:** React, Bootstrap 5, Axios, Sequelize, Express.

---

### Task 1: Backend — Update Stadium Controller
Include Hashtags in stadium responses using Sequelize associations instead of raw SQL where possible.

**Files:**
- Modify: `backend/controllers/stadiumController.js`

**Step 1: Import models**
Modify top of file to include db models.

**Step 2: Update getStadiumById to include hashtags**
Use `db.Stadium.findByPk` with `include: ['hashtags']`.

**Step 3: Update getAllStadiums / getOwnerStadiums**
Update to include hashtags.

---

### Task 2: Frontend — Create StadiumHashtagModal Component
Create a reusable modal that fetches all hashtags and allows selecting them for a specific stadium.

**Files:**
- Create: `frontend/src/components/StadiumHashtagModal.jsx`

**Step 1: Implement Modal UI**
Use Bootstrap Modal classes. Fetch all hashtags using `axios.get('/api/hashtags')`.

**Step 2: Implement Save logic**
Call `axios.put('/api/hashtags/stadium/${stadiumId}/hashtags', { hashtag_ids: selectedIds })`.

---

### Task 3: Frontend — Integrate with ManageStadiums (Owner)
Add the "Hashtag" button to the stadium list for Owners.

**Files:**
- Modify: `frontend/src/pages/ManageStadiums.jsx`

**Step 1: Add state for modal**
`const [showHashtagModal, setShowHashtagModal] = useState(false);`
`const [selectedStadium, setSelectedStadium] = useState(null);`

**Step 2: Add "Hashtag" button to table row**
```jsx
<button className="btn btn-sm btn-outline-success ms-2" onClick={() => openHashtagModal(s)}>
  Hashtag
</button>
```

---

### Task 4: Frontend — Integrate with AdminStadiums (Admin)
Add the "Hashtag" button to the stadium cards for Admins.

**Files:**
- Modify: `frontend/src/pages/AdminStadiums.jsx`

**Step 1: Add state and button**
Similar to ManageStadiums, add a button to each card.

---

### Task 5: Verification
Verify that hashtags are saved and correctly displayed in the modal when reopened.

**Step 1: Manual Test**
Assign tags as Owner, check as Admin, verify in DB.
