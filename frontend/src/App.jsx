import React, { useState, useEffect } from 'react';

export default function App() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [health, setHealth] = useState(null);
  const [activeTab, setActiveTab] = useState('views');
  const [showNewModal, setShowNewModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState('masked'); // 'masked' or 'original'

  // New Case Form State
  const [newCaseId, setNewCaseId] = useState('');
  const [newFiles, setNewFiles] = useState([]);

  useEffect(() => {
    fetchHealth();
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetail(selectedCaseId);
    }
  }, [selectedCaseId]);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      console.error('Health fetch failed:', e);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      setCases(data.cases || []);
      if (!selectedCaseId && data.cases && data.cases.length > 0) {
        setSelectedCaseId(data.cases[0].case_id);
      }
    } catch (e) {
      console.error('Failed to fetch cases:', e);
    }
  };

  const fetchCaseDetail = async (id) => {
    try {
      const res = await fetch(`/api/cases/${id}`);
      const data = await res.json();
      setCaseDetail(data);
    } catch (e) {
      console.error('Failed to fetch case detail:', e);
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newCaseId || newFiles.length === 0) {
      alert('Please provide a Case ID and at least one image file.');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('case_id', newCaseId);
    for (let i = 0; i < newFiles.length; i++) {
      formData.append('files', newFiles[i]);
    }

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setShowNewModal(false);
        setNewCaseId('');
        setNewFiles([]);
        await fetchCases();
        setSelectedCaseId(data.case_id);
      } else {
        alert(`Processing error: ${data.detail || 'Failed'}`);
      }
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!selectedCaseId) return;
    try {
      const res = await fetch(`/api/cases/${selectedCaseId}/tamper`, { method: 'POST' });
      const data = await res.json();
      alert(`Tamper Simulation Result: ${data.message} | Audit Valid: ${data.is_valid}`);
      await fetchCaseDetail(selectedCaseId);
      await fetchCases();
    } catch (e) {
      alert('Tamper simulation request failed');
    }
  };

  const handleRestoreAudit = async () => {
    if (!selectedCaseId) return;
    try {
      const res = await fetch(`/api/cases/${selectedCaseId}/restore-audit`, { method: 'POST' });
      const data = await res.json();
      alert(`Audit Restored: ${data.message} | Audit Valid: ${data.is_valid}`);
      await fetchCaseDetail(selectedCaseId);
      await fetchCases();
    } catch (e) {
      alert('Audit restore failed');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Top Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🔍</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Forensic Crime Scene Analysis & Reconstruction
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            AI-assisted evidentiary ingestion, person de-identification, incident classification, and cryptographic chain of custody.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Accelerator:</span>
            <span className="badge badge-blue">{health?.accelerator || 'DirectML / NPU'}</span>
          </div>

          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            + Ingest New Case
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* Left Sidebar: Cases List */}
        <aside>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Active Cases ({cases.length})</h2>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={fetchCases}>
                ↻ Refresh
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {cases.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No cases ingested yet. Click <strong>+ Ingest New Case</strong> to start.
                </div>
              ) : (
                cases.map((c) => {
                  const isSelected = c.case_id === selectedCaseId;
                  return (
                    <div
                      key={c.case_id}
                      onClick={() => setSelectedCaseId(c.case_id)}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '8px',
                        background: isSelected ? '#1e293b' : '#0f172a',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid #1e293b',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.case_id}</span>
                        <span className={`badge ${c.audit_log_valid ? 'badge-success' : 'badge-danger'}`}>
                          {c.audit_log_valid ? 'VERIFIED' : 'TAMPERED'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Type: <strong style={{ color: '#e2e8f0' }}>{c.incident_type || 'Processing'}</strong></span>
                        <span>{c.view_count} views</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Right Content: Selected Case Inspector */}
        <main>
          {caseDetail ? (
            <div>
              {/* Case Header Card */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Case: {caseDetail.case_id}</h2>
                      <span className={`badge ${caseDetail.audit_log_valid ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem' }}>
                        {caseDetail.audit_log_valid ? '✓ Cryptographic Chain Valid' : '⚠ Audit Chain Tampered'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Predicted Incident Classification: <strong style={{ color: '#60a5fa' }}>{caseDetail.incident_type}</strong> | Processed on {caseDetail.accelerator || 'Hardware Accelerator'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button className="btn btn-secondary" onClick={handleSimulateTamper}>
                      ⚠ Test Tamper Detection
                    </button>
                    {!caseDetail.audit_log_valid && (
                      <button className="btn btn-primary" onClick={handleRestoreAudit}>
                        ↺ Restore Integrity
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs Header */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginTop: '1.25rem' }}>
                  {[
                    { id: 'views', label: `Views & Evidence (${caseDetail.views?.length || 0})` },
                    { id: 'contact', label: 'Contact Sheet' },
                    { id: 'timeline', label: 'Timeline & Reconstruction' },
                    { id: 'audit', label: `Audit Trail (${caseDetail.audit_log?.length || 0})` }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '0.6rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === tab.id ? '#60a5fa' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab 1: Views & Evidence */}
              {activeTab === 'views' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      De-identification blackouts protect bystander identities before scene evidence reasoning.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', background: '#0f172a', padding: '0.25rem', borderRadius: '6px' }}>
                      <button
                        className={`btn ${viewMode === 'masked' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => setViewMode('masked')}
                      >
                        Privacy Masked
                      </button>
                      <button
                        className={`btn ${viewMode === 'original' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => setViewMode('original')}
                      >
                        Raw View
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {caseDetail.views?.map((v) => (
                      <div key={v.view_number} className="card" style={{ padding: '0.85rem' }}>
                        <div style={{ position: 'relative', width: '100%', height: '180px', background: '#020617', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                          <img
                            src={viewMode === 'masked' ? v.masked_url : v.image_url}
                            alt={`View ${v.view_number}`}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <span style={{ position: 'absolute', top: 8, left: 8, background: '#f59e0b', color: '#000', fontWeight: 700, fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                            #{v.view_number}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Persons De-identified:</span>
                            <span style={{ fontWeight: 600 }}>{v.people_masked}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Evidence Found: </span>
                            {v.evidence && v.evidence.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                                {v.evidence.map((ev, i) => (
                                  <span key={i} className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                                    {ev.label} ({Math.round(ev.conf * 100)}%)
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None detected</span>
                            )}
                          </div>
                          <div style={{ marginTop: '0.25rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                            SHA: {v.sha256.substring(0, 16)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Contact Sheet */}
              {activeTab === 'contact' && (
                <div className="card" style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Numbered Forensic Contact Sheet</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Tiled matrix of all verified views with reference badges used by the Vision-Language Model for reconstruction.
                  </p>
                  {caseDetail.contact_sheet_url ? (
                    <img
                      src={caseDetail.contact_sheet_url}
                      alt="Contact Sheet"
                      style={{ maxWidth: '100%', maxHeight: '650px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    />
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No contact sheet generated for this case.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Timeline & Reconstruction */}
              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Chronological Incident Timeline</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      Every event statement is strictly grounded and cites verified view badges.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {caseDetail.reconstruction?.timeline?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: '#0f172a', borderRadius: '8px' }}>
                          <span className="badge badge-blue" style={{ height: 'fit-content' }}>
                            Views {item.views?.join(', ')}
                          </span>
                          <span style={{ fontSize: '0.875rem' }}>{item.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="card">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Physical Evidence Catalog</h4>
                      {caseDetail.reconstruction?.key_evidence?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {caseDetail.reconstruction.key_evidence.map((ev, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.4rem 0.6rem', background: '#0f172a', borderRadius: '4px' }}>
                              <span><strong>{ev.item}</strong> (conf: {ev.confidence || '0.90'})</span>
                              <span style={{ color: 'var(--text-muted)' }}>Cited in #{ev.views?.join(', #')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No physical weapons or evidence catalogs flagged.</p>
                      )}
                    </div>

                    <div className="card">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Entry Point & Access Verdicts</h4>
                      {caseDetail.reconstruction?.entry_points?.map((ep, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.4rem 0.6rem', background: '#0f172a', borderRadius: '4px' }}>
                          <span>{ep.location}</span>
                          <span className={`badge ${ep.verdict === 'ruled_in' ? 'badge-success' : 'badge-warning'}`}>
                            {ep.verdict}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ fontSize: '0.8rem', color: '#f87171' }}>
                      <strong>Forensic Advisory:</strong> {caseDetail.reconstruction?.disclaimer}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 4: Cryptographic Audit Trail */}
              {activeTab === 'audit' && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>SHA-256 Hash-Chained Audit Trail</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Deterministic tamper verification. Each record seals the cryptographic hash of the preceding entry.
                      </p>
                    </div>
                    <span className={`badge ${caseDetail.audit_log_valid ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                      {caseDetail.audit_log_valid ? '✓ HASH INTEGRITY VERIFIED' : '✖ TAMPER DETECTED'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
                    {caseDetail.audit_log?.map((entry, idx) => (
                      <div key={idx} style={{ padding: '0.75rem', background: '#0f172a', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                            [{entry.index}] {entry.action}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {new Date(entry.ts * 1000).toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          <div>Prev: {entry.prev_hash}</div>
                          <div style={{ color: '#a78bfa' }}>Hash: {entry.entry_hash}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>Select a case from the sidebar or click <strong>+ Ingest New Case</strong> to begin.</p>
            </div>
          )}
        </main>
      </div>

      {/* Ingest Case Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '520px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ingest Crime Scene Case</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Upload incident photos or CCTV keyframe stills. The pipeline will automatically SHA-256 hash, dedup, mask people, detect weapons, and reconstruct.
            </p>

            <form onSubmit={handleCreateCase}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Case ID / Incident Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Case-2026-BURGLARY-04"
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: '#0f172a',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Scene Photos / Video Keyframes:
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setNewFiles(Array.from(e.target.files))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: '#0f172a',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Selected: {newFiles.length} file(s)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)} disabled={isProcessing}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isProcessing}>
                  {isProcessing ? 'Processing Pipeline on NPU...' : 'Run Pipeline & Ingest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
