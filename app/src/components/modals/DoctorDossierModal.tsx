import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateDoctorDossier, type DoctorDossierReport } from '../../engines/dossierEngine';
import { X, Printer, Copy, Check, FileText, Activity, ShieldCheck, HeartPulse, Moon, Baby } from 'lucide-react';

interface DoctorDossierModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DoctorDossierModal: React.FC<DoctorDossierModalProps> = ({ isOpen, onClose }) => {
    const { activeChild, logs, unit } = useApp();
    const [daysCount, setDaysCount] = useState<number>(7);
    const [copied, setCopied] = useState<boolean>(false);

    if (!isOpen) return null;

    const report: DoctorDossierReport = generateDoctorDossier(activeChild, logs, daysCount);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(report.formattedClinicalSummary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = report.formattedClinicalSummary;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate maximum intake volume for chart scaling
    const maxDayMl = Math.max(100, ...report.dailyBreakdown.map(d => d.totalMilkMl));

    return (
        <div
            id="doctor-dossier-modal-backdrop"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                id="doctor-dossier-modal"
                style={{
                    width: '100%',
                    maxWidth: '820px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
                    overflow: 'hidden',
                    color: 'var(--text-primary)'
                }}
            >
                {/* Header Row - Hidden in Print */}
                <div
                    className="no-print"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 20px',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-surface-elevated)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Activity size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: 800,
                                letterSpacing: '-0.01em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                Pediatrician Visit Dossier
                            </h2>
                            <p style={{
                                margin: '2px 0 0 0',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'var(--text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                Clinical Summary for Dr. {report.pediatrician} • {report.clinic}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {/* Timeframe Selector Pills */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '2px'
                        }}>
                            {[7, 14, 30].map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDaysCount(d)}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: daysCount === d ? 'var(--primary-accent)' : 'transparent',
                                        color: daysCount === d ? '#ffffff' : 'var(--text-muted)',
                                        transition: 'background-color 0.15s ease'
                                    }}
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            id="dossier-btn-close"
                            onClick={onClose}
                            aria-label="Close modal"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '6px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifySelf: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Printable Content Body */}
                <div
                    id="doctor-dossier-print-content"
                    style={{
                        padding: '20px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}
                >
                    {/* Clinical Letterhead / Demographics Card */}
                    <div
                        style={{
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '16px'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>
                                        {report.childName}
                                    </span>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16, 185, 129, 0.25)'
                                    }}>
                                        {report.ageLabel}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                    marginTop: '6px',
                                    fontWeight: 500
                                }}>
                                    <span>DOB: <strong style={{ color: 'var(--text-primary)' }}>{report.birthDate || 'N/A'}</strong></span>
                                    <span>Sex: <strong style={{ color: 'var(--text-primary)' }}>{report.gender}</strong></span>
                                    <span>Weight: <strong style={{ color: 'var(--text-primary)' }}>{report.weight}</strong></span>
                                    <span>Length: <strong style={{ color: 'var(--text-primary)' }}>{report.height}</strong></span>
                                    <span>Allergies: <strong style={{ color: '#ef4444' }}>{report.allergies}</strong></span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', fontSize: '11px', minWidth: 0 }}>
                                <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {report.clinic}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                                    Physician: {report.pediatrician}
                                </div>
                                <div style={{ color: '#10b981', fontWeight: 700, fontSize: '11px', marginTop: '4px' }}>
                                    Period: {report.dateRangeLabel}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4 Clinical Highlights Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                        gap: '12px'
                    }}>
                        {/* Daily Feeding Card */}
                        <div style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '12px 14px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: 'var(--text-muted)'
                            }}>
                                <Baby size={13} style={{ color: '#f59e0b' }} />
                                <span>Daily Milk Intake</span>
                            </div>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: 900,
                                color: 'var(--text-primary)',
                                margin: '4px 0 2px 0'
                            }}>
                                {unit === 'oz' ? `${report.avgDailyMilkOz} oz` : `${report.avgDailyMilkMl} mL`}
                                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>/ day</span>
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                {report.formulaRatioPercent}% Formula • {report.breastmilkRatioPercent}% Breast
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', marginTop: '3px' }}>
                                ~{report.avgFeedsPerDay} feeds/day ({report.avgVolumePerFeedMl} mL/feed)
                            </div>
                        </div>

                        {/* Diaper & Hydration Card */}
                        <div style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '12px 14px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: 'var(--text-muted)'
                            }}>
                                <ShieldCheck size={13} style={{ color: '#10b981' }} />
                                <span>Hydration & Output</span>
                            </div>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: 900,
                                color: 'var(--text-primary)',
                                margin: '4px 0 2px 0'
                            }}>
                                {report.avgWetPerDay} Wet 🟡 • {report.avgDirtyPerDay} Bowel
                            </div>
                            <div style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: report.isHydrationAdequate ? '#10b981' : '#f59e0b'
                            }}>
                                {report.isHydrationAdequate ? '✓ Meets AAP Standard (≥6/day)' : '⚠ Borderline Hydration'}
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginTop: '3px' }}>
                                Total: {report.totalWetDiapers} wet, {report.totalDirtyDiapers} dirty
                            </div>
                        </div>

                        {/* Sleep Architecture Card */}
                        <div style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '12px 14px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: 'var(--text-muted)'
                            }}>
                                <Moon size={13} style={{ color: '#6366f1' }} />
                                <span>Sleep Distribution</span>
                            </div>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: 900,
                                color: 'var(--text-primary)',
                                margin: '4px 0 2px 0'
                            }}>
                                {report.avgDailySleepHours}h <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' }}>/ 24 hrs</span>
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                Night: {report.avgNightSleepHours}h • Naps: {report.avgNapSleepHours}h
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1', marginTop: '3px' }}>
                                Max Stretch: {Math.floor(report.longestSleepStretchMinutes / 60)}h {report.longestSleepStretchMinutes % 60}m
                            </div>
                        </div>

                        {/* Development & Care Card */}
                        <div style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '12px 14px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: 'var(--text-muted)'
                            }}>
                                <HeartPulse size={13} style={{ color: '#f43f5e' }} />
                                <span>Development & Meds</span>
                            </div>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: 900,
                                color: 'var(--text-primary)',
                                margin: '4px 0 2px 0'
                            }}>
                                {report.avgDailyTummyMinutes}m <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' }}>Tummy Time/day</span>
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                Vitamin D: {report.vitaminDaysLogged} of {report.daysCount} days logged
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', marginTop: '3px' }}>
                                Adherence: {Math.round((report.vitaminDaysLogged / report.daysCount) * 100)}%
                            </div>
                        </div>
                    </div>

                    {/* Visual SVG Chart: Feeding Volume & Diaper Tallies */}
                    <div
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '14px'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '10px'
                        }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Daily Intake & Output Trend
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#38bdf8', display: 'inline-block' }} /> Formula
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#facc15', display: 'inline-block' }} /> Breastmilk
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} /> Wet Diaper
                                </span>
                            </span>
                        </div>

                        {/* High-density SVG bar graph */}
                        <div style={{ width: '100%', overflowX: 'auto' }}>
                            <svg viewBox="0 0 560 140" style={{ width: '100%', height: '130px', userSelect: 'none' }} preserveAspectRatio="none">
                                {/* Horizontal grid guide lines */}
                                <line x1="0" y1="20" x2="560" y2="20" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />
                                <line x1="0" y1="60" x2="560" y2="60" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />
                                <line x1="0" y1="100" x2="560" y2="100" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />

                                {report.dailyBreakdown.map((d, idx) => {
                                    const colWidth = 560 / report.dailyBreakdown.length;
                                    const barWidth = Math.min(32, colWidth * 0.6);
                                    const x = idx * colWidth + (colWidth - barWidth) / 2;

                                    const formulaHeight = maxDayMl > 0 ? (d.formulaMl / maxDayMl) * 80 : 0;
                                    const breastHeight = maxDayMl > 0 ? (d.breastmilkMl / maxDayMl) * 80 : 0;

                                    const formulaY = 105 - formulaHeight;
                                    const breastY = formulaY - breastHeight;

                                    return (
                                        <g key={d.dateStr}>
                                            {/* Formula bar segment */}
                                            {d.formulaMl > 0 && (
                                                <rect
                                                    x={x}
                                                    y={formulaY}
                                                    width={barWidth}
                                                    height={formulaHeight}
                                                    rx="2"
                                                    fill="#38bdf8"
                                                />
                                            )}
                                            {/* Breastmilk bar segment */}
                                            {d.breastmilkMl > 0 && (
                                                <rect
                                                    x={x}
                                                    y={breastY}
                                                    width={barWidth}
                                                    height={breastHeight}
                                                    rx="2"
                                                    fill="#facc15"
                                                />
                                            )}
                                            {/* Total volume text tag */}
                                            <text
                                                x={x + barWidth / 2}
                                                y={Math.max(12, breastY - 4)}
                                                textAnchor="middle"
                                                fontSize="9"
                                                fontWeight="bold"
                                                fill="var(--text-secondary)"
                                            >
                                                {unit === 'oz' ? `${Math.round(d.totalMilkMl / 29.5735)}oz` : `${d.totalMilkMl}`}
                                            </text>

                                            {/* Wet diaper pin badge */}
                                            <circle
                                                cx={x + barWidth / 2}
                                                cy="114"
                                                r="7"
                                                fill="#10b981"
                                            />
                                            <text
                                                x={x + barWidth / 2}
                                                y="117"
                                                textAnchor="middle"
                                                fontSize="8"
                                                fontWeight="bold"
                                                fill="#ffffff"
                                            >
                                                {d.wetDiapers}
                                            </text>

                                            {/* Date label */}
                                            <text
                                                x={x + barWidth / 2}
                                                y="134"
                                                textAnchor="middle"
                                                fontSize="9"
                                                fontWeight="600"
                                                fill="var(--text-muted)"
                                            >
                                                {d.displayDate.split(',')[0]}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    {/* Clinical Summary Text Box Preview */}
                    <div
                        style={{
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '14px',
                            overflowX: 'auto'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: 'var(--text-muted)'
                        }}>
                            <span>Clinical EHR Portal Note Preview</span>
                            <span style={{ fontWeight: 400, textTransform: 'lowercase' }}>ready for MyChart / Epic paste</span>
                        </div>
                        <pre style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            lineHeight: '1.5',
                            color: 'var(--text-secondary)'
                        }}>
                            {report.formattedClinicalSummary}
                        </pre>
                    </div>
                </div>

                {/* Footer Action Bar - Hidden in Print */}
                <div
                    className="no-print"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 20px',
                        borderTop: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        flexWrap: 'wrap',
                        gap: '10px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', minWidth: 0 }}>
                        <FileText size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Exportable PDF / Clinic EHR summary with 0 cloud lag
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="btn-ghost"
                            style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                color: copied ? '#10b981' : 'var(--text-primary)',
                                borderColor: copied ? '#10b981' : 'var(--border-color)'
                            }}
                        >
                            {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                            <span>{copied ? 'Copied to Clipboard!' : 'Copy Clinical Note'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="btn-primary"
                            style={{
                                padding: '7px 16px',
                                fontSize: '12px',
                                backgroundColor: 'var(--primary-accent)',
                                color: '#ffffff'
                            }}
                        >
                            <Printer size={14} />
                            <span>Print / Save PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
