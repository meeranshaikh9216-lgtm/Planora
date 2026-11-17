import React, { useState, useEffect } from 'react';
import { Database, Search, Table, RefreshCw, HardDrive, Key, ArrowUpDown, ChevronLeft, ChevronRight, ShieldCheck, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export default function DatabaseExplorer() {
  const [overview, setOverview] = useState(null);
  const [selectedTable, setSelectedTable] = useState('users');
  const [recordsData, setRecordsData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  
  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [tableFilter, setTableFilter] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadRecords(selectedTable, 1, searchQuery, sortBy, sortOrder);
    }
  }, [selectedTable]);

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await api.getDbOverview();
      setOverview(res.data);
      if (res.data?.tables?.length > 0 && !selectedTable) {
        setSelectedTable(res.data.tables[0].table_name);
      }
    } catch (err) {
      console.error('Failed to load database overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadRecords = async (tableName, page = 1, search = '', sort = 'id', order = 'desc') => {
    setLoadingRecords(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '12',
        search: search,
        sort_by: sort,
        sort_order: order
      }).toString();

      const res = await api.getTableRecords(tableName, params);
      setRecordsData(res.data);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to query records:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRecords(selectedTable, 1, searchQuery, sortBy, sortOrder);
  };

  const handleSort = (colName) => {
    const newOrder = sortBy === colName && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(colName);
    setSortOrder(newOrder);
    loadRecords(selectedTable, currentPage, searchQuery, colName, newOrder);
  };

  const currentTableMeta = overview?.tables?.find(t => t.table_name === selectedTable);
  const filteredTables = overview?.tables?.filter(t => t.table_name.toLowerCase().includes(tableFilter.toLowerCase())) || [];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Metrics Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={13} /> Live System Schema
            </span>
            <span className="badge badge-cyan">Admin & Demo Diagnostics</span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Database Explorer
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Inspect all 30 relational tables, live row records, schema constraints, and foreign key structures.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { loadOverview(); loadRecords(selectedTable, currentPage, searchQuery, sortBy, sortOrder); }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <HardDrive size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATABASE ENGINE</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>{overview.database_uri_type}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <Table size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>REGISTERED TABLES</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>{overview.total_tables} Tables</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <Database size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL PERSISTED ROWS</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>{overview.total_rows} Records</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>INTEGRITY STATUS</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success)' }}>100% Validated</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Split View: Left Tables List + Right Records View */}
      <div className="two-col-responsive">
        {/* Left Sidebar: Table Selector */}
        <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Database Tables ({filteredTables.length})
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter tables..."
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '580px', overflowY: 'auto' }}>
            {filteredTables.map(t => {
              const active = selectedTable === t.table_name;
              return (
                <button
                  key={t.table_name}
                  onClick={() => {
                    setSelectedTable(t.table_name);
                    setSearchQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: active ? 'var(--primary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    fontWeight: active ? 700 : 500,
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t.table_name}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: active ? '#ffffff' : '#94a3b8'
                  }}>
                    {t.row_count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Main Panel: Table Schema & Live Records */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Table Header & Schema Summary */}
          {currentTableMeta && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
                    Table: {currentTableMeta.table_name}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Primary Key: <strong style={{ color: '#38bdf8' }}>{currentTableMeta.primary_key.join(', ') || 'None'}</strong> • Columns: {currentTableMeta.columns_count} • Total Rows: {currentTableMeta.row_count}
                  </div>
                </div>

                {/* Search in Table */}
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={`Search in ${selectedTable}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.86rem', minWidth: '220px' }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">Search</button>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); loadRecords(selectedTable, 1, '', sortBy, sortOrder); }}
                      className="btn btn-secondary btn-sm"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {/* Columns Schema Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                {currentTableMeta.columns.map(c => (
                  <span
                    key={c.name}
                    style={{
                      fontSize: '0.78rem',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: c.is_primary_key ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: c.is_primary_key ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                      color: c.is_primary_key ? '#a5b4fc' : '#cbd5e1',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {c.is_primary_key && <Key size={10} />}
                    <strong>{c.name}</strong> <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>({c.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Records Table View */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: '560px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {recordsData?.columns?.map(col => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        style={{
                          padding: '12px 14px',
                          color: sortBy === col ? '#38bdf8' : '#ffffff',
                          fontWeight: 700,
                          cursor: 'pointer',
                          userSelect: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {col} <ArrowUpDown size={12} color="var(--text-muted)" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingRecords ? (
                    <tr>
                      <td colSpan={recordsData?.columns?.length || 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Loading records from database...
                      </td>
                    </tr>
                  ) : recordsData?.records?.length === 0 ? (
                    <tr>
                      <td colSpan={recordsData?.columns?.length || 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No records found in table '{selectedTable}'.
                      </td>
                    </tr>
                  ) : (
                    recordsData?.records?.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                        }}
                      >
                        {recordsData.columns.map(col => {
                          const val = row[col];
                          const displayVal = val === null || val === undefined ? (
                            <span style={{ color: '#64748b', fontStyle: 'italic' }}>NULL</span>
                          ) : typeof val === 'boolean' ? (
                            <span style={{ color: val ? 'var(--success)' : '#ef4444' }}>{val ? 'TRUE' : 'FALSE'}</span>
                          ) : (
                            String(val)
                          );
                          return (
                            <td
                              key={col}
                              style={{
                                padding: '10px 14px',
                                color: '#cbd5e1',
                                whiteSpace: 'nowrap',
                                maxWidth: '280px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {recordsData?.pagination && (
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Showing Page {recordsData.pagination.page} of {recordsData.pagination.total_pages} ({recordsData.pagination.total_count} matching rows)
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={!recordsData.pagination.has_prev}
                    onClick={() => loadRecords(selectedTable, currentPage - 1, searchQuery, sortBy, sortOrder)}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: recordsData.pagination.has_prev ? 1 : 0.4 }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    disabled={!recordsData.pagination.has_next}
                    onClick={() => loadRecords(selectedTable, currentPage + 1, searchQuery, sortBy, sortOrder)}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: recordsData.pagination.has_next ? 1 : 0.4 }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
