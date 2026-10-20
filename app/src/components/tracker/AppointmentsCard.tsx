import React from 'react';
import { useApp } from '../../context/AppContext';
import type { BabyAppointment } from '../../types/appointment';
import { Plus, Edit2, Trash2, MapPin, ExternalLink, Download } from 'lucide-react';

interface AppointmentsCardProps {
    onOpenAddModal: () => void;
    onOpenEditModal: (apt: BabyAppointment) => void;
    onOpenDoctorDossier?: () => void;
}

export const AppointmentsCard: React.FC<AppointmentsCardProps> = ({ onOpenAddModal, onOpenEditModal, onOpenDoctorDossier }) => {
    const { appointments, deleteAppointment, activeChild } = useApp();

    // Sort chronologically
    const sorted = [...appointments].sort((a, b) => {
        const dtA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        const dtB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        return dtA - dtB;
    });

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStartEndDates = (apt: BabyAppointment) => {
        const [y, m, d] = apt.date.split('-').map(Number);
        const [hh, mm] = (apt.time || '10:00').split(':').map(Number);
        const start = new Date(y, m - 1, d, hh, mm);
        const end = new Date(start.getTime() + ((apt.durationMinutes || 30) * 60 * 1000));
        return { start, end };
    };

    const exportToGoogle = (apt: BabyAppointment) => {
        const { start, end } = getStartEndDates(apt);

        const formatGDate = (dt: Date) => {
            return dt.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };

        const startStr = formatGDate(start);
        const endStr = formatGDate(end);
        const details = encodeURIComponent((apt.notes ? apt.notes + '\n\n' : '') + `Baby: ${activeChild.name}\nPediatrician: ${apt.doctorName || activeChild.pediatrician || 'Pediatrician'}\nTracked via NovaBaby`);
        const title = encodeURIComponent(`${activeChild.name} - ${apt.title}`);
        const loc = encodeURIComponent(apt.location || '');

        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${loc}`;
        window.open(url, '_blank');
    };

    const exportToApple = (apt: BabyAppointment) => {
        const { start, end } = getStartEndDates(apt);

        const formatIcsDate = (dt: Date) => {
            return dt.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };

        const startStr = formatIcsDate(start);
        const endStr = formatIcsDate(end);
        const nowStr = formatIcsDate(new Date());
        const baby = activeChild.name || 'Baby';
        const summary = `${baby} - ${apt.title}`.replace(/[\r\n]/g, ' ');
        const description = ((apt.notes ? apt.notes + '\\n\\n' : '') + `Baby: ${baby}\\nTracked via NovaBaby`).replace(/[\r\n]/g, '\\n');
        const location = (apt.location || '').replace(/[\r\n]/g, ' ');

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Nonsenseian//NovaBaby//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${apt.id}@nonsenseian.novababy`,
            `DTSTAMP:${nowStr}`,
            `DTSTART:${startStr}`,
            `DTEND:${endStr}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location}`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${apt.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <section id="appointments-card" className="surface-card" style={{ marginBottom: '24px' }}>
            {/* Header (Matches Image 2) */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🗓️</span>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{
                                fontSize: '14px',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                Appointments
                            </h3>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                color: '#0284c7',
                                border: '1px solid rgba(56, 189, 248, 0.3)'
                            }}>
                                {sorted.length} SCHEDULED
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {onOpenDoctorDossier && (
                        <button
                            type="button"
                            id="btn-open-doctor-dossier"
                            onClick={onOpenDoctorDossier}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span>🩺</span>
                            <span>Doctor Visit Dossier</span>
                        </button>
                    )}

                    {/* + Add Appointment Button */}
                    <button
                        onClick={onOpenAddModal}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Plus size={16} />
                        <span>Add Appointment</span>
                    </button>
                </div>
            </div>

            {/* Empty State (Matches Image 2) */}
            {sorted.length === 0 ? (
                <div style={{
                    padding: '32px 20px',
                    textAlign: 'center',
                    borderRadius: '16px',
                    border: '1px dashed var(--border-color)',
                    backgroundColor: 'var(--bg-surface-elevated)'
                }}>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🗓️</span>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        No baby appointments scheduled yet
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Track pediatrician visits, vaccine milestones, and checkups with calendar sync.
                    </p>
                </div>
            ) : (
                /* Appointments List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sorted.map(apt => {
                        const dur = apt.durationMinutes ? `${apt.durationMinutes} min` : '30 min';
                        const dateFormatted = formatDisplayDate(apt.date);

                        return (
                            <div
                                key={apt.id}
                                style={{
                                    padding: '14px 16px',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-surface-elevated)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px' }}>🩺</span>
                                            <h4 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                                                {apt.title}
                                            </h4>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            gap: '12px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: '#0284c7',
                                            marginTop: '4px'
                                        }}>
                                            <span>📅 {dateFormatted} at {apt.time} ({dur})</span>
                                            {apt.location && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
                                                    <MapPin size={12} />
                                                    <span>{apt.location}</span>
                                                </span>
                                            )}
                                            {apt.doctorName && (
                                                <span style={{ color: 'var(--text-muted)' }}>
                                                    👨‍⚕️ {apt.doctorName}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons: Edit & Delete */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <button
                                            onClick={() => onOpenEditModal(apt)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                backgroundColor: 'transparent',
                                                color: 'var(--text-secondary)',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            title="Edit Appointment"
                                        >
                                            <Edit2 size={12} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Delete appointment "${apt.title}"?`)) {
                                                    deleteAppointment(apt.id);
                                                }
                                            }}
                                            style={{
                                                padding: '4px 6px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                                color: '#ef4444',
                                                cursor: 'pointer'
                                            }}
                                            title="Delete Appointment"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {apt.notes && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--text-secondary)',
                                        backgroundColor: 'var(--bg-surface)',
                                        padding: '8px 12px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-subtle)'
                                    }}>
                                        📝 {apt.notes}
                                    </div>
                                )}

                                {/* 1-Tap Calendar Export Buttons */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: '8px',
                                    paddingTop: '6px',
                                    borderTop: '1px solid var(--border-subtle)'
                                }}>
                                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                        Sync To:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => exportToGoogle(apt)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                            color: '#0284c7',
                                            border: '1px solid rgba(56, 189, 248, 0.3)',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span>🌐</span>
                                        <span>Add to Google Calendar</span>
                                        <ExternalLink size={10} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => exportToApple(apt)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(100, 116, 139, 0.1)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span>🍏</span>
                                        <span>Add to Apple Calendar (.ics)</span>
                                        <Download size={10} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};
