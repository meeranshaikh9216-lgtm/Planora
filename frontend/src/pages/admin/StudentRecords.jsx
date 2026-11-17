import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { api } from '../../services/api';
import StudentDetail from './StudentDetail';

export default function StudentRecords() {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => {
    const inspectId = searchParams.get('inspect');
    if (inspectId) {
      setSelectedStudentId(parseInt(inspectId));
    }
  }, [searchParams]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '15',
        search: search.trim(),
        stream: streamFilter,
        board: boardFilter
      }).toString();

      const res = await api.getAdminStudents(params);
      setStudents(res.data?.students || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [page, streamFilter, boardFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadStudents();
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('planora_token');
    fetch('/api/admin/reports/export-students', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planora_students_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => alert('Failed to export CSV: ' + err.message));
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
            Student Records Directory
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Complete database registry of all registered students, academic onboarding profiles, and learning progress.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={loadStudents}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} /> Refresh
          </button>

          <button
            onClick={handleExportCsv}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="input"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="select"
            value={streamFilter}
            onChange={(e) => { setStreamFilter(e.target.value); setPage(1); }}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">All Streams</option>
            <option value="Science">Science (PCM / PCB)</option>
            <option value="Commerce">Commerce</option>
            <option value="Engineering">Engineering</option>
            <option value="Humanities">Humanities / Arts</option>
          </select>

          <select
            className="select"
            value={boardFilter}
            onChange={(e) => { setBoardFilter(e.target.value); setPage(1); }}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="">All Boards</option>
            <option value="CBSE">CBSE</option>
            <option value="ICSE">ICSE / ISC</option>
            <option value="State">State Board</option>
            <option value="IB">IB / Cambridge</option>
          </select>

          <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px' }}>
            Filter
          </button>
        </form>
      </div>

      {/* Students Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, width: '60px' }}>#ID</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>Student</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>Stream & Board</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>Class</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>AI Plan Status</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>Registered</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ color: '#ef4444', margin: '0 auto 8px' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Querying database...</span>
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((st) => (
                  <tr
                    key={st.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      #{st.id}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{st.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{st.email}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{st.stream}</div>
                      <div style={{ fontSize: '0.78rem', color: '#818cf8' }}>{st.board}</div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#94a3b8' }}>
                      {st.grade_class}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {st.has_active_plan ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          <CheckCircle size={12} /> Active Plan
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#94a3b8',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          No Plan
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(st.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedStudentId(st.id)}
                        className="btn btn-secondary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Eye size={14} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No students match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div>Showing {students.length} of {total} registered students</div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary"
              style={{ padding: '6px 12px' }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ padding: '6px 12px', fontWeight: 600, color: '#ffffff' }}>Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={students.length < 15}
              className="btn btn-secondary"
              style={{ padding: '6px 12px' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Deep Inspection Modal */}
      {selectedStudentId && (
        <StudentDetail
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}
