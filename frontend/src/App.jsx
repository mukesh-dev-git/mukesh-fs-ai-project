import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
  Eye,
  Grid,
  FileText,
  Clock,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Camera,
  Cpu,
  Crosshair,
  Sparkles,
  UploadCloud,
  Lock,
  Tag
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');
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

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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
      const list = data.cases || [];
      setCases(list);
      if (!selectedCaseId && list.length > 0) {
        setSelectedCaseId(list[0].case_id);
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

  const handleLoadDemoPreset = async (presetKey) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/demo-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: presetKey })
      });
      const data = await res.json();
      if (res.ok) {
        setShowNewModal(false);
        await fetchCases();
        setSelectedCaseId(data.case_id);
      } else {
        alert(`Failed to load demo case: ${data.detail || data.error}`);
      }
    } catch (err) {
      alert(`Network error loading demo: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!selectedCaseId) return;
    try {
      const res = await fetch(`/api/cases/${selectedCaseId}/tamper`, { method: 'POST' });
      const data = await res.json();
      alert(`Tamper Simulation Triggered: ${data.message}`);
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
      alert(`Audit Restored: ${data.message}`);
      await fetchCaseDetail(selectedCaseId);
      await fetchCases();
    } catch (e) {
      alert('Audit restore failed');
    }
  };

  // Compute aggregate probabilities if views exist
  const getTopProbabilities = () => {
    if (!caseDetail || !caseDetail.views || caseDetail.views.length === 0) return [];
    const scoreMap = {};
    let totalScore = 0;
    caseDetail.views.forEach(v => {
      (v.scene_top3 || []).forEach(([cls, prob]) => {
        scoreMap[cls] = (scoreMap[cls] || 0) + prob;
        totalScore += prob;
      });
    });
    if (totalScore === 0) return [];
    return Object.entries(scoreMap)
      .map(([cls, score]) => ({
        label: cls,
        pct: Math.round((score / totalScore) * 100)
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  };

  const topProbs = getTopProbabilities();
  const threatLevel = caseDetail?.reconstruction?.threat_level || 'ROUTINE / LOW';
  const isThreatHigh = threatLevel.includes('CRITICAL') || threatLevel.includes('WEAPON');

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Clean Vector SVG Logo */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}
          >
            <Shield size={24} strokeWidth={2.2} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Forensic Crime Scene Analysis & Reconstruction
              </h1>
              <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>IEEE PROTOTYPE</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
              Evidentiary ingestion, privacy de-identification, incident classification, and SHA-256 chain of custody.
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Accelerator Status Badge */}
          <div className="card" style={{ padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={16} color="var(--accent-green)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accelerator:</span>
            <span className="badge badge-blue" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
              {health?.ai_service?.accelerator || health?.accelerator || 'DirectML / NPU'}
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn-icon"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* New Case Button */}
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <Plus size={16} />
            <span>Ingest Incident</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Sidebar + Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* Left Sidebar: Case Dossier List */}
        <aside>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} color="var(--accent-blue)" />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Active Cases ({cases.length})</h2>
              </div>
              <button
                className="btn-icon"
                style={{ padding: '0.35rem' }}
                onClick={fetchCases}
                title="Refresh case dossier"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Quick Demo Case Selector */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Sparkles size={14} color="var(--accent-amber)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Instant Demo Cases:</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0.35rem 0.6rem' }}
                  onClick={() => handleLoadDemoPreset('armed_evidence')}
                  disabled={isProcessing}
                >
                  <Crosshair size={13} color="var(--accent-red)" />
                  <span>Armed Weapon Scene</span>
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0.35rem 0.6rem' }}
                  onClick={() => handleLoadDemoPreset('burglary_sequence')}
                  disabled={isProcessing}
                >
                  <Camera size={13} color="var(--accent-blue)" />
                  <span>UCF Burglary Sequence</span>
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0.35rem 0.6rem' }}
                  onClick={() => handleLoadDemoPreset('vehicular_accident')}
                  disabled={isProcessing}
                >
                  <AlertTriangle size={13} color="var(--accent-amber)" />
                  <span>Vehicular Collision</span>
                </button>
              </div>
            </div>

            {/* Case List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '560px', overflowY: 'auto' }}>
              {cases.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No cases available. Click <strong>Ingest Incident</strong> to begin.
                </div>
              ) : (
                cases.map((c) => {
                  const isSelected = c.case_id === selectedCaseId;
                  return (
                    <div
                      key={c.case_id}
                      onClick={() => setSelectedCaseId(c.case_id)}
                      style={{
                        padding: '0.8rem',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                        border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {c.case_id}
                        </span>
                        {c.audit_log_valid ? (
                          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                            <ShieldCheck size={11} /> VALID
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                            <ShieldAlert size={11} /> TAMPERED
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Type: <strong style={{ color: 'var(--text-secondary)' }}>{c.incident_type || 'Processing'}</strong></span>
                        <span>{c.view_count} view(s)</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Right Content Area: Detailed Forensic Inspector */}
        <main>
          {caseDetail ? (
            <div>
              {/* Comprehensive Incident Dossier Header Card */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Case: {caseDetail.case_id}</h2>
                      
                      {/* Cryptographic Chain Badge */}
                      {caseDetail.audit_log_valid ? (
                        <span className="badge badge-success">
                          <ShieldCheck size={14} /> Chain Valid
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <ShieldAlert size={14} /> Chain Tampered
                        </span>
                      )}

                      {/* Threat Level Badge */}
                      <span className={`badge ${isThreatHigh ? 'badge-danger' : 'badge-warning'}`}>
                        <Crosshair size={14} /> {threatLevel}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Predicted Classification: <strong style={{ color: 'var(--accent-blue)' }}>{caseDetail.incident_type}</strong>
                      {' | '}
                      Accelerator: <strong style={{ color: 'var(--text-secondary)' }}>{caseDetail.accelerator || 'Hardware Acceleration'}</strong>
                    </p>

                    {caseDetail.reconstruction?.verdict_summary && (
                      <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <strong>Forensic Summary:</strong> {caseDetail.reconstruction.verdict_summary}
                      </p>
                    )}
                  </div>

                  {/* Tamper Simulation Controls */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={handleSimulateTamper} title="Simulate cryptographic tamper in block #1">
                      <AlertTriangle size={15} color="var(--accent-amber)" />
                      <span>Tamper Test</span>
                    </button>
                    {!caseDetail.audit_log_valid && (
                      <button className="btn btn-primary" onClick={handleRestoreAudit} title="Recalculate hash chain and restore proof">
                        <RotateCcw size={15} />
                        <span>Restore Integrity</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Classification Probability Breakdown Meters */}
                {topProbs.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Tag size={14} color="var(--accent-blue)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Incident Classification Confidence Breakdown (ResNet-18 ONNX):
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                      {topProbs.map((p, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                            <span>{p.label}</span>
                            <span style={{ color: idx === 0 ? 'var(--accent-blue)' : 'var(--text-muted)' }}>{p.pct}%</span>
                          </div>
                          <div className="prob-bar-container">
                            <div
                              className="prob-bar-fill"
                              style={{
                                width: `${p.pct}%`,
                                background: idx === 0 ? 'var(--accent-blue)' : 'var(--accent-cyan)'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabs Header */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginTop: '1.25rem' }}>
                  {[
                    { id: 'views', label: `Views & Evidence (${caseDetail.views?.length || 0})`, icon: Eye },
                    { id: 'contact', label: 'Forensic Contact Sheet', icon: Grid },
                    { id: 'timeline', label: 'Timeline & Reconstruction', icon: Clock },
                    { id: 'audit', label: `Audit Trail (${caseDetail.audit_log?.length || 0})`, icon: Lock }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.65rem 1rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                          color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon size={15} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab 1: Views & Detected Evidence */}
              {activeTab === 'views' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      YOLOv8n-seg automated blackout de-identifies subjects. YOLOv8s highlights detected evidence and weapons.
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <button
                        className={`btn ${viewMode === 'masked' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => setViewMode('masked')}
                      >
                        <Shield size={13} />
                        <span>Privacy Masked + Boxes</span>
                      </button>
                      <button
                        className={`btn ${viewMode === 'original' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => setViewMode('original')}
                      >
                        <Camera size={13} />
                        <span>Raw View</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {caseDetail.views?.map((v) => (
                      <div key={v.view_number} className="card" style={{ padding: '0.85rem' }}>
                        {/* Image Canvas */}
                        <div style={{ position: 'relative', width: '100%', height: '210px', background: '#020617', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={viewMode === 'masked' ? v.masked_url : v.image_url}
                            alt={`View ${v.view_number}`}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              background: 'var(--accent-amber)',
                              color: '#000000',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}
                          >
                            View #{v.view_number}
                          </span>
                        </div>

                        {/* View Metadata */}
                        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Persons De-identified:</span>
                            <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                              {v.people_masked} subject(s)
                            </span>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                              Detected Evidence Objects:
                            </span>
                            {v.evidence && v.evidence.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {v.evidence.map((ev, i) => {
                                  const isWeapon = ['knife', 'scissors', 'pistol', 'gun', 'baseball bat'].includes(ev.label.toLowerCase());
                                  return (
                                    <span
                                      key={i}
                                      className={`badge ${isWeapon ? 'badge-danger' : 'badge-warning'}`}
                                      style={{ fontSize: '0.7rem' }}
                                    >
                                      {ev.label.toUpperCase()} ({Math.round(ev.conf * 100)}%)
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                                No physical evidence detected in this frame
                              </span>
                            )}
                          </div>

                          {/* View Top Classification */}
                          {v.scene_top3 && v.scene_top3.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.3rem', borderTop: '1px solid var(--border-color)' }}>
                              <span>View Indicator:</span>
                              <strong style={{ color: 'var(--text-secondary)' }}>
                                {v.scene_top3[0][0]} ({Math.round(v.scene_top3[0][1] * 100)}%)
                              </strong>
                            </div>
                          )}

                          <div style={{ paddingTop: '0.3rem', borderTop: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                            SHA-256: {v.sha256.substring(0, 20)}...
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <Grid size={18} color="var(--accent-blue)" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tiled Forensic Contact Sheet</h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Standardized matrix of all incident views with reference badges for sequential reasoning and reconstruction.
                  </p>
                  {caseDetail.contact_sheet_url ? (
                    <img
                      src={caseDetail.contact_sheet_url}
                      alt="Contact Sheet"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '650px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: '#0f172a'
                      }}
                    />
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No contact sheet generated for this incident.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Timeline & Grounded Reconstruction */}
              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Single Unified Case Story Card */}
                  {caseDetail.reconstruction?.case_story && (
                    <div
                      className="card"
                      style={{
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
                        borderColor: 'var(--accent-blue)',
                        borderWidth: '1.5px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <Sparkles size={18} color="var(--accent-blue)" />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                          Synthesized Incident Narrative & Forensic Story
                        </h3>
                        <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>EVIDENTIARY DEDUCTION</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.65', color: 'var(--text-primary)' }}>
                        {caseDetail.reconstruction.case_story}
                      </p>
                    </div>
                  )}

                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <Clock size={18} color="var(--accent-blue)" />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Chronological Incident Timeline</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      Every statement is strictly grounded and cites verified camera viewpoint badges.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {caseDetail.reconstruction?.timeline?.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: '1rem',
                            padding: '0.75rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            alignItems: 'center'
                          }}
                        >
                          <span className="badge badge-blue" style={{ height: 'fit-content' }}>
                            Views {item.views?.join(', ')}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Physical Evidence Catalog */}
                    <div className="card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Tag size={16} color="var(--accent-amber)" />
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Physical Evidence Catalog</h4>
                      </div>
                      {caseDetail.reconstruction?.key_evidence?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {caseDetail.reconstruction.key_evidence.map((ev, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem',
                                padding: '0.4rem 0.65rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)'
                              }}
                            >
                              <span>
                                <strong>{ev.item}</strong> ({Math.round((ev.confidence || 0.9) * 100)}% conf)
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>View #{ev.views?.join(', #')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No physical weapons or evidence catalogs flagged in inspected frames.
                        </p>
                      )}
                    </div>

                    {/* Entry Point Verdicts */}
                    <div className="card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Crosshair size={16} color="var(--accent-cyan)" />
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Access & Perimeter Verdicts</h4>
                      </div>
                      {caseDetail.reconstruction?.entry_points?.map((ep, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                            padding: '0.4rem 0.65rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            marginBottom: '0.4rem'
                          }}
                        >
                          <span>{ep.location}</span>
                          <span className={`badge ${ep.verdict === 'ruled_in' ? 'badge-success' : 'badge-warning'}`}>
                            {ep.verdict.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Forensic Disclaimer Callout */}
                  <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={18} color="var(--accent-red)" />
                      <p style={{ fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                        <strong>Forensic Review Notice:</strong> {caseDetail.reconstruction?.disclaimer}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Cryptographic Audit Trail */}
              {activeTab === 'audit' && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Lock size={18} color="var(--accent-green)" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>SHA-256 Hash-Chained Audit Trail</h3>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Deterministic chain-of-custody verification. Each block cryptographically seals the previous entry's SHA-256 hash.
                      </p>
                    </div>

                    {caseDetail.audit_log_valid ? (
                      <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                        <CheckCircle2 size={14} /> HASH INTEGRITY VERIFIED
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                        <XCircle size={14} /> TAMPER DETECTED IN CHAIN
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
                    {caseDetail.audit_log?.map((entry, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                            [{entry.index}] {entry.action.toUpperCase()}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {new Date(entry.ts * 1000).toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          <div>Prev: {entry.prev_hash}</div>
                          <div style={{ color: 'var(--accent-cyan)' }}>Seal: {entry.entry_hash}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
              <Shield size={40} color="var(--accent-blue)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Case Selected</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Select an incident dossier from the left sidebar or launch an instant preset demo.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => handleLoadDemoPreset('armed_evidence')}>
                  <Crosshair size={15} />
                  <span>Launch Armed Evidence Demo</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setShowNewModal(true)}>
                  <Plus size={15} />
                  <span>Upload Custom Incident</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Ingest Case Modal */}
      {showNewModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div className="card" style={{ width: '540px', maxWidth: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UploadCloud size={20} color="var(--accent-blue)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ingest Crime Scene Case</h3>
              </div>
              <button
                className="btn-icon"
                style={{ padding: '0.3rem' }}
                onClick={() => setShowNewModal(false)}
              >
                <XCircle size={16} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Upload incident photos or CCTV keyframe stills. The pipeline will automatically SHA-256 hash, dedup, mask persons, detect weapons, and reconstruct.
            </p>

            {/* Quick Demo Option inside Modal */}
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Or load pre-configured benchmark case:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => handleLoadDemoPreset('armed_evidence')}
                  disabled={isProcessing}
                >
                  <Crosshair size={13} color="var(--accent-red)" />
                  <span>Armed Knife Scene</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => handleLoadDemoPreset('burglary_sequence')}
                  disabled={isProcessing}
                >
                  <Camera size={13} color="var(--accent-blue)" />
                  <span>UCF Burglary</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCase}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Case ID / Incident Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Case-2026-ARMED-01"
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)'
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
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Selected: {newFiles.length} file(s) from local machine or test_images/
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewModal(false)}
                  disabled={isProcessing}
                >
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
