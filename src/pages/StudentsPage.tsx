import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AppShell } from '../components/AppShell';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Student } from '../types/models';

export function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const q = query(collection(db, 'students'), where('ownerUid', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Student, 'id'>),
        })) as Student[];

        // Filter by name (fuzzy substring search)
        const searchNormalized = search.trim().toUpperCase();
        const filtered = searchNormalized
          ? list.filter((s) => s.nameNormalized && s.nameNormalized.includes(searchNormalized))
          : list;

        // Sort by createdAt descending
        const sorted = filtered.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setStudents(sorted);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, search]);

  const activeCount = useMemo(() => students.filter((student) => student.status === 'active').length, [students]);

  return (
    <AppShell title="Students">
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-4 gap-3">
        <div>
          <h2 className="h4 mb-1">Students</h2>
          <p className="text-muted mb-0">Search, view, and manage student records.</p>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-primary" to="/students/new">Add Student</Link>
          <Link className="btn btn-outline-primary" to="/charges/new">Add Charge</Link>
        </div>
      </div>

      <div className="card card-shadow p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="search"
                placeholder="Search student by name"
                className="form-control border-start-0 ps-0"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="bg-light rounded p-3 text-center text-sm-start">
              <div className="text-uppercase text-secondary small">Active Students</div>
              <div className="h3 mb-0 fw-bold">{activeCount}</div>
            </div>
          </div>
        </div>
      </div>

      {loading && students.length === 0 ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile View: Clean Responsive Cards */}
          <div className="d-block d-md-none">
            {students.length === 0 ? (
              <div className="text-center text-muted py-4 card card-shadow">
                No students found.
              </div>
            ) : (
              <div className="row g-3">
                {students.map((student) => (
                  <div className="col-12" key={student.id}>
                    <div className="card card-shadow p-3 student-card">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h3 className="h6 mb-0 fw-bold text-primary">
                          <Link to={`/students/${student.id}`} className="text-decoration-none">
                            {student.name}
                          </Link>
                        </h3>
                        <span className={`badge bg-${student.status === 'active' ? 'success' : 'secondary'} ms-2`}>
                          {student.status}
                        </span>
                      </div>
                      <div className="student-card-details small text-secondary">
                        <div className="mb-1"><i className="bi bi-person-fill me-1"></i> Father: {student.fatherName}</div>
                        <div className="mb-1"><i className="bi bi-book-fill me-1"></i> Class: {student.className} {student.section ? `(${student.section})` : ''}</div>
                        <div className="mb-1"><i className="bi bi-card-text me-1"></i> Adm No: {student.admissionNumber}</div>
                        {student.mobile && (
                          <div className="mb-1"><i className="bi bi-telephone-fill me-1"></i> Mobile: {student.mobile}</div>
                        )}
                      </div>
                      <div className="d-flex gap-2 mt-3">
                        <Link to={`/students/${student.id}`} className="btn btn-sm btn-outline-primary flex-grow-1">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop/Tablet View: Table */}
          <div className="d-none d-md-block card card-shadow p-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Father's Name</th>
                    <th>Class</th>
                    <th>Admission No.</th>
                    <th>Mobile</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="fw-semibold">
                        <Link to={`/students/${student.id}`} className="text-decoration-none">
                          {student.name}
                        </Link>
                      </td>
                      <td>{student.fatherName}</td>
                      <td>{student.className} {student.section ? `(${student.section})` : ''}</td>
                      <td>{student.admissionNumber}</td>
                      <td>{student.mobile || <span className="text-muted">-</span>}</td>
                      <td>
                        <span className={`badge bg-${student.status === 'active' ? 'success' : 'secondary'}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link to={`/students/${student.id}`} className="btn btn-sm btn-outline-primary">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
