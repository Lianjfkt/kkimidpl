# Owner Registrations CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full CRUD (Create, Read, Update, Delete) capability for new student registrations in `/owner/registrations`.

**Architecture:** Extend `RegistrationsContent` in `src/app/owner/registrations/page.tsx` with modal dialogs (`M3Dialog`) for Registration Form (Create/Edit) and Delete Confirmation, interacting directly with Supabase `registrations` table.

**Tech Stack:** Next.js (App Router), React, Supabase JS Client, TailwindCSS, Material 3 UI Tokens.

## Global Constraints

- Preserve all existing functionality (Approve, Reject, Filter, Stats).
- Match Material 3 styling tokens (`var(--md-sys-color-...)`).
- Use `isSupabaseConfigured` fallback for offline / mock support if applicable.

---

### Task 1: Add Add/Edit & Delete State and Form Dialog to `src/app/owner/registrations/page.tsx`

**Files:**
- Modify: `src/app/owner/registrations/page.tsx`

**Interfaces:**
- Consumes: `Registration` interface from `@/lib/mockData`
- Produces: `RegistrationFormModal` UI and handler functions (`handleSaveRegistration`, `handleDeleteRegistration`)

- [ ] **Step 1: Define form state and handlers**

Add state in `RegistrationsContent`:
```tsx
const [formOpen, setFormOpen] = useState(false);
const [editingReg, setEditingReg] = useState<Registration | null>(null);
const [formData, setFormData] = useState<Partial<Registration>>({});
const [saving, setSaving] = useState(false);

const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
const [deleting, setDeleting] = useState(false);
```

- [ ] **Step 2: Add open and submit handlers for Create, Edit, and Delete**

```tsx
const openCreateModal = () => {
  setEditingReg(null);
  setFormData({
    full_name: '',
    dob: '',
    birth_place: '',
    nik: '',
    current_belt: 'Putih',
    weight: undefined,
    height: undefined,
    parent_name: '',
    parent_phone: '',
    parent_job: '',
    address: '',
    status: 'menunggu',
  });
  setFormOpen(true);
};

const openEditModal = (reg: Registration) => {
  setEditingReg(reg);
  setFormData({ ...reg });
  setFormOpen(true);
};

const handleSaveRegistration = async () => {
  if (!formData.full_name?.trim() || !formData.dob || !formData.parent_name?.trim() || !formData.parent_phone?.trim() || !formData.address?.trim()) {
    alert('Mohon lengkapi bidang wajib (Nama, Tanggal Lahir, Nama Wali, No HP Wali, dan Alamat).');
    return;
  }

  setSaving(true);
  if (editingReg) {
    // Update
    const { error } = await supabase
      .from('registrations')
      .update({
        full_name: formData.full_name.trim(),
        dob: formData.dob,
        birth_place: formData.birth_place || '',
        nik: formData.nik || '',
        current_belt: formData.current_belt || 'Putih',
        weight: formData.weight ? Number(formData.weight) : null,
        height: formData.height ? Number(formData.height) : null,
        parent_name: formData.parent_name.trim(),
        parent_phone: formData.parent_phone.trim(),
        parent_job: formData.parent_job || '',
        address: formData.address.trim(),
        status: formData.status || 'menunggu',
      })
      .eq('id', editingReg.id);

    if (error) {
      alert('Gagal mengupdate pendaftaran: ' + error.message);
    } else {
      setFormOpen(false);
      fetchRegistrations();
    }
  } else {
    // Create
    const newReg = {
      id: isSupabaseConfigured ? crypto.randomUUID() : `reg-${Date.now()}`,
      full_name: formData.full_name.trim(),
      dob: formData.dob,
      birth_place: formData.birth_place || '',
      nik: formData.nik || '',
      current_belt: formData.current_belt || 'Putih',
      weight: formData.weight ? Number(formData.weight) : null,
      height: formData.height ? Number(formData.height) : null,
      parent_name: formData.parent_name.trim(),
      parent_phone: formData.parent_phone.trim(),
      parent_job: formData.parent_job || '',
      address: formData.address.trim(),
      status: formData.status || 'menunggu',
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('registrations').insert([newReg]);
    if (error) {
      alert('Gagal menambahkan pendaftaran: ' + error.message);
    } else {
      setFormOpen(false);
      fetchRegistrations();
    }
  }
  setSaving(false);
};

const handleDeleteConfirm = async () => {
  if (!deleteTarget) return;
  setDeleting(true);
  const { error } = await supabase.from('registrations').delete().eq('id', deleteTarget.id);
  if (error) {
    alert('Gagal menghapus pendaftaran: ' + error.message);
  } else {
    setDeleteTarget(null);
    fetchRegistrations();
  }
  setDeleting(false);
};
```

- [ ] **Step 3: Render "+ Tambah Pendaftaran" header button, Edit & Delete action buttons on cards**

Header update:
```tsx
<button onClick={openCreateModal} className="m3-btn-filled text-xs py-2 px-4 flex items-center gap-1.5">
  <span>➕</span> Tambah Pendaftaran
</button>
```

Card actions update:
```tsx
<div className="flex gap-2">
  <button onClick={() => openEditModal(reg)} className="m3-btn-tonal text-xs py-1 px-2.5">
    ✏️ Edit
  </button>
  <button onClick={() => setDeleteTarget(reg)} className="m3-btn-outlined text-xs py-1 px-2.5 text-red-600 border-red-200 hover:bg-red-50">
    🗑️ Hapus
  </button>
</div>
```

- [ ] **Step 4: Render M3Dialog modals for Form and Delete Confirmation**

- [ ] **Step 5: Verify build & functionality**

Run `npm run build` or test dev server to verify code compilation and clean execution without TypeScript errors.

- [ ] **Step 6: Commit changes**

```bash
git add src/app/owner/registrations/page.tsx
git commit -m "feat: add full CRUD capabilities to owner registrations page"
```
