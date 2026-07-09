import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AppShell } from '../components/AppShell';
import { addStudent } from '../services/studentService';
import { normalizeMobile, normalizeText } from '../utils/strings';
import { z } from 'zod';

const studentSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  fatherName: z.string().min(1, 'Father name is required.'),
  className: z.string().min(1, 'Class is required.'),
  admissionNumber: z.string().min(1, 'Admission number is required.'),
  mobile: z.string().optional(),
  section: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

export function StudentFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    fatherName: '',
    className: '',
    admissionNumber: '',
    section: '',
    mobile: '',
    status: 'active',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const parsed = studentSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid form');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      addStudent({
        ownerUid: user.uid,
        name: form.name,
        nameNormalized: normalizeText(form.name),
        fatherName: form.fatherName,
        fatherNameNormalized: normalizeText(form.fatherName),
        className: form.className,
        section: form.section || undefined,
        mobile: form.mobile || undefined,
        mobileNormalized: form.mobile ? normalizeMobile(form.mobile) : undefined,
        admissionNumber: form.admissionNumber,
        admissionNumberNormalized: normalizeText(form.admissionNumber),
        status: form.status as 'active' | 'inactive',
      });
      navigate('/students');
    } catch (err) {
      setError('Unable to save student.');
      setSaving(false);
    }
  };

  return (
    <AppShell title="Add student">
      <div className="card card-shadow p-4 animate-fade-in" style={{ maxWidth: 640 }}>
        <h2 className="h5 mb-3">Add student</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Student name</label>
            <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Father name</label>
            <input className="form-control" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} required />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Class</label>
              <input className="form-control" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Admission number</label>
              <input className="form-control" value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} required />
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Section</label>
              <input className="form-control" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Mobile</label>
              <input className="form-control" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={saving}>{saving ? 'Saving...' : 'Save student'}</button>
        </form>
      </div>
    </AppShell>
  );
}
