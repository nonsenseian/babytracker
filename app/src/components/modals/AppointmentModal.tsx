import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { BabyAppointment } from '../../types/appointment';
import { X, Check } from 'lucide-react';

interface AppointmentModalProps {
    appointmentToEdit?: BabyAppointment | null;
    onClose: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ appointmentToEdit, onClose }) => {
    const { addAppointment, updateAppointment, activeChild, selectedDate, appointments } = useApp();

    const isEditing = !!appointmentToEdit;

    const [title, setTitle] = useState(appointmentToEdit ? appointmentToEdit.title : 'Well-Baby Checkup & Vaccines');
    const [date, setDate] = useState(appointmentToEdit ? appointmentToEdit.date : selectedDate || new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(appointmentToEdit ? appointmentToEdit.time : '10:00');
    const [durationMinutes, setDurationMinutes] = useState(appointmentToEdit ? appointmentToEdit.durationMinutes : 30);
    const [location, setLocation] = useState(appointmentToEdit?.location || activeChild.clinic || 'Westside Pediatrics');
    const [doctorName, setDoctorName] = useState(appointmentToEdit?.doctorName || activeChild.pediatrician || 'Dr. Sarah Smith, MD');
    const [notes, setNotes] = useState(appointmentToEdit?.notes || '');

    const commonPresets = [
        '2-Week Newborn Checkup',
        '1-Month Pediatric Checkup',
        '2-Month Well-Baby & Vaccines',
        '4-Month Checkup & Rotavirus',
        '6-Month Growth & Milestones',
        '9-Month Wellness Visit',
        '12-Month First Year Checkup',
        'Lactation Consultant Visit',
        'Urgent / Sick Visit'
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !date || !time) return;

        if (!isEditing && appointments && appointments.length >= 100) {
            alert('⚠️ Capacity reached: Maximum 100 scheduled checkups can be stored.');
            return;
        }

        if (isEditing && appointmentToEdit) {
            updateAppointment({
                ...appointmentToEdit,
                title: title.trim().slice(0, 100),
                date,
                time,
                durationMinutes: Math.min(480, Math.max(5, Number(durationMinutes) || 30)),
                location: location.trim().slice(0, 120),
                doctorName: doctorName.trim().slice(0, 80),
                notes: notes.trim().slice(0, 1000)
            });
        } else {
            addAppointment({
                childId: activeChild.id,
                title: title.trim().slice(0, 100),
                date,
                time,
                durationMinutes: Math.min(480, Math.max(5, Number(durationMinutes) || 30)),
                location: location.trim().slice(0, 120),
                doctorName: doctorName.trim().slice(0, 80),
                notes: notes.trim().slice(0, 1000)
            });
        }
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            padding: '16px'
        }}>
            <div className="surface-card" style={{ width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🩺</span>
                        <h3 style={{ fontSize: '16px', fontWeight: 900 }}>
                            {isEditing ? 'Edit Baby Appointment' : 'Add Baby Appointment'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Quick Presets */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>Common Checkups</label>
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginTop: '4px' }}>
                            {commonPresets.slice(0, 5).map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setTitle(preset)}
                                    style={{
                                        fontSize: '11px',
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: title === preset ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-surface-elevated)',
                                        color: title === preset ? '#0284c7' : 'var(--text-secondary)',
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Appointment Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. 2-Month Well-Baby & Vaccines"
                            className="input-field"
                            style={{ marginTop: '4px' }}
                            maxLength={100}
                            required
                        />
                    </div>

                    {/* Date & Time */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="input-field"
                                style={{ marginTop: '4px' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="input-field"
                                style={{ marginTop: '4px' }}
                                required
                            />
                        </div>
                    </div>

                    {/* Duration & Pediatrician */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Duration</label>
                            <select
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                className="input-field"
                                style={{ marginTop: '4px' }}
                            >
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>1 hour</option>
                                <option value={90}>1.5 hours</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Doctor / Provider</label>
                            <input
                                type="text"
                                value={doctorName}
                                onChange={(e) => setDoctorName(e.target.value)}
                                placeholder="e.g. Dr. Sarah Smith"
                                className="input-field"
                                style={{ marginTop: '4px' }}
                                maxLength={80}
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Clinic / Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Westside Pediatrics, Suite 200"
                            className="input-field"
                            style={{ marginTop: '4px' }}
                            maxLength={120}
                        />
                    </div>

                    {/* Clinical / Question Notes */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Notes & Questions for Doctor</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Ask doctor about cradle cap, tummy time stiffness, and sleep schedule."
                            rows={3}
                            className="input-field"
                            style={{ marginTop: '4px', resize: 'vertical' }}
                            maxLength={1000}
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            <Check size={16} />
                            <span>{isEditing ? 'Save Changes' : 'Schedule Appointment'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
