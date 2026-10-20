import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ActivityCategory, ActivityLog } from '../../types/log';
import { PediatricGuardrails, ML_PER_OZ } from '../../engines/guardrails';
import { X, Check } from 'lucide-react';

interface LogActivityModalProps {
    initialCategory: ActivityCategory;
    initialSubType?: string;
    editingLog?: ActivityLog | null;
    onClose: () => void;
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
    initialCategory,
    initialSubType,
    editingLog,
    onClose
}) => {
    const { unit, addLog, updateLog } = useApp();
    const isOz = unit === 'oz';

    const [category, setCategory] = useState<ActivityCategory>(editingLog?.category || initialCategory);
    const [subType, setSubType] = useState<string>(() => {
        if (editingLog?.subType) return editingLog.subType;
        if (initialSubType) return initialSubType;
        if (initialCategory === 'feeding') return 'formula';
        if (initialCategory === 'diaper') return 'pee';
        if (initialCategory === 'health') return 'medication';
        return '';
    });
    const [dateStr, setDateStr] = useState<string>(editingLog?.dateStr || new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState<string>(editingLog?.notes || '');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Feeding & Pumping
    const [amount, setAmount] = useState<string>(editingLog?.amountMl ? (isOz ? (editingLog.amountMl / ML_PER_OZ).toFixed(1) : `${editingLog.amountMl}`) : '');
    const [leftAmount, setLeftAmount] = useState<string>(editingLog?.leftAmountMl ? (isOz ? (editingLog.leftAmountMl / ML_PER_OZ).toFixed(1) : `${editingLog.leftAmountMl}`) : '');
    const [rightAmount, setRightAmount] = useState<string>(editingLog?.rightAmountMl ? (isOz ? (editingLog.rightAmountMl / ML_PER_OZ).toFixed(1) : `${editingLog.rightAmountMl}`) : '');
    const [duration, setDuration] = useState<string>(editingLog?.durationMinutes ? `${editingLog.durationMinutes}` : (category === 'sleep' ? '60' : (category === 'tummy' ? '10' : '')));

    // Solids (under Feeding)
    const [foodName, setFoodName] = useState<string>(editingLog?.foodName || '');
    const [portion, setPortion] = useState<string>(editingLog?.portion || '');
    const [reaction, setReaction] = useState<'loved' | 'neutral' | 'disliked' | 'allergic_reaction' | undefined>(editingLog?.reaction || 'loved');

    // Medication (under Health)
    const [medicationName, setMedicationName] = useState<string>(editingLog?.medicationName || '');
    const [dosage, setDosage] = useState<string>(editingLog?.dosage || '');
    const [medRoute, setMedRoute] = useState<string>(editingLog?.medRoute || 'Oral syringe');

    // Vitals (under Health)
    const [temperature, setTemperature] = useState<string>(editingLog?.temperature ? `${editingLog.temperature}` : '');
    const [tempUnit, setTempUnit] = useState<'F' | 'C'>(editingLog?.tempUnit || 'F');
    const [measurementSite, setMeasurementSite] = useState<string>(editingLog?.measurementSite || 'Forehead');
    const [pulseBpm, setPulseBpm] = useState<string>(editingLog?.pulseBpm ? `${editingLog.pulseBpm}` : '');

    // Diaper
    const [diaperSize, setDiaperSize] = useState<string>(editingLog?.size || 'nb');

    // Growth
    const [weightLbs, setWeightLbs] = useState<string>(editingLog?.weightLbs ? `${editingLog.weightLbs}` : '');
    const [weightOz, setWeightOz] = useState<string>(editingLog?.weightOz ? `${editingLog.weightOz}` : '');
    const [heightInches, setHeightInches] = useState<string>(editingLog?.heightInches ? `${editingLog.heightInches}` : '');
    const [headCirc, setHeadCirc] = useState<string>(editingLog?.headCircumference ? `${editingLog.headCircumference}` : '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        let parsedAmountMl: number | undefined;
        let parsedLeftMl: number | undefined;
        let parsedRightMl: number | undefined;

        if (amount && subType !== 'solids') {
            const raw = parseFloat(amount) || 0;
            parsedAmountMl = isOz ? Math.round(raw * ML_PER_OZ) : raw;
        }

        if (leftAmount || rightAmount) {
            const rawL = parseFloat(leftAmount) || 0;
            const rawR = parseFloat(rightAmount) || 0;
            parsedLeftMl = isOz ? Math.round(rawL * ML_PER_OZ) : rawL;
            parsedRightMl = isOz ? Math.round(rawR * ML_PER_OZ) : rawR;
            if (!parsedAmountMl) parsedAmountMl = parsedLeftMl + parsedRightMl;
        }

        let effectiveNotes = notes.trim();
        if (!effectiveNotes) {
            if (category === 'feeding' && subType === 'solids' && foodName) {
                effectiveNotes = `${foodName}${portion ? ` (${portion})` : ''}`;
            } else if (category === 'health' && subType === 'medication' && medicationName) {
                effectiveNotes = `${medicationName}${dosage ? ` (${dosage})` : ''}`;
            } else if (category === 'health' && subType === 'vitals' && temperature) {
                effectiveNotes = `${temperature}°${tempUnit} via ${measurementSite}`;
            }
        }

        const logData: Partial<ActivityLog> = {
            category,
            subType,
            dateStr,
            notes: effectiveNotes,
            amountMl: parsedAmountMl,
            leftAmountMl: parsedLeftMl,
            rightAmountMl: parsedRightMl,
            durationMinutes: duration ? parseFloat(duration) : undefined,
            size: diaperSize,
            weightLbs: weightLbs ? parseFloat(weightLbs) : undefined,
            weightOz: weightOz ? parseFloat(weightOz) : undefined,
            heightInches: heightInches ? parseFloat(heightInches) : undefined,
            headCircumference: headCirc ? parseFloat(headCirc) : undefined,
            foodName: foodName || undefined,
            portion: portion || undefined,
            reaction: reaction || undefined,
            medicationName: medicationName || undefined,
            dosage: dosage || undefined,
            medRoute: medRoute || undefined,
            temperature: temperature ? parseFloat(temperature) : undefined,
            tempUnit,
            measurementSite: measurementSite || undefined,
            pulseBpm: pulseBpm ? parseInt(pulseBpm, 10) : undefined
        };

        const error = PediatricGuardrails.validateLogActivity(logData);
        if (error) {
            setErrorMessage(error);
            return;
        }

        if (editingLog) {
            updateLog({ ...editingLog, ...logData } as ActivityLog);
        } else {
            addLog(logData as any);
        }

        onClose();
    };

    return (
        <div
            id="log-activity-modal"
            className="modal-backdrop"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(4px)',
                padding: '16px'
            }}
        >
            <div className="surface-card" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                        {editingLog ? 'Edit Activity' : 'Log New Activity'}
                    </h3>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }} aria-label="Close dialog">
                        <X size={18} />
                    </button>
                </div>

                {errorMessage && (
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '14px'
                    }}>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Category Selector */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Activity Type</label>
                        <select
                            id="log-activity-category-select"
                            value={category}
                            onChange={(e) => {
                                const nextCat = e.target.value as ActivityCategory;
                                setCategory(nextCat);
                                if (!editingLog) {
                                    if (nextCat === 'feeding') setSubType('formula');
                                    else if (nextCat === 'health') setSubType('medication');
                                    else if (nextCat === 'diaper') setSubType('pee');
                                    else if (nextCat === 'other') setSubType('');
                                }
                            }}
                            className="input-field"
                            style={{ marginTop: '4px' }}
                        >
                            <option value="feeding">🍼 Feeding (Bottle / Nursing / Solids)</option>
                            <option value="health">💊 Medication & Vitals</option>
                            <option value="diaper">✨ Diaper Change</option>
                            <option value="pumping">💧 Pumping Output</option>
                            <option value="sleep">🌙 Sleep & Nap</option>
                            <option value="tummy">🐢 Tummy Time</option>
                            <option value="growth">📏 Growth Vitals</option>
                            <option value="milestone">🏆 Milestone Memory</option>
                            <option value="bath">🛁 Bath Time</option>
                            <option value="other">📝 Other Activity</option>
                        </select>
                    </div>

                    {/* Dynamic Fields per Category */}
                    {category === 'feeding' && (
                        <>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Feed Type</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '4px' }}>
                                    {[
                                        { id: 'formula', label: '🍼 Formula' },
                                        { id: 'breastmilk', label: '🥛 Milk' },
                                        { id: 'nursing', label: '🤱 Nurse' },
                                        { id: 'solids', label: '🥣 Solids' }
                                    ].map(t => (
                                        <button
                                            type="button"
                                            key={t.id}
                                            id={`feed-type-${t.id}`}
                                            onClick={() => setSubType(t.id)}
                                            style={{
                                                padding: '8px 4px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: subType === t.id ? 'var(--primary-accent)' : 'transparent',
                                                color: subType === t.id ? '#fff' : 'var(--text-primary)',
                                                fontWeight: 700,
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {subType !== 'solids' ? (
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                                        Amount ({isOz ? 'oz' : 'mL'})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        id="feed-amount-input"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder={isOz ? 'e.g. 4.0 oz' : 'e.g. 120 mL'}
                                        className="input-field"
                                        style={{ marginTop: '4px' }}
                                    />
                                </div>
                            ) : (
                                <>
                                    {/* Solids Details */}
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Food / Puree Name</label>
                                        <input
                                            type="text"
                                            id="solids-food-name-input"
                                            value={foodName}
                                            onChange={(e) => setFoodName(e.target.value)}
                                            placeholder="e.g. Sweet Potato, Avocado puree, Oatmeal"
                                            className="input-field"
                                            style={{ marginTop: '4px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                            {['Sweet Potato', 'Avocado', 'Oatmeal', 'Banana', 'Carrots'].map(f => (
                                                <button
                                                    type="button"
                                                    key={f}
                                                    onClick={() => setFoodName(f)}
                                                    style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-surface-elevated)',
                                                        fontSize: '11px',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Portion / Quantity</label>
                                        <input
                                            type="text"
                                            id="solids-portion-input"
                                            value={portion}
                                            onChange={(e) => setPortion(e.target.value)}
                                            placeholder="e.g. 2 tbsp, 1/2 jar, 2 oz"
                                            className="input-field"
                                            style={{ marginTop: '4px' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Baby Reaction</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                            {[
                                                { id: 'loved', label: '😋 Loved it' },
                                                { id: 'neutral', label: '😐 Neutral' },
                                                { id: 'disliked', label: '😣 Disliked' }
                                            ].map(r => (
                                                <button
                                                    type="button"
                                                    key={r.id}
                                                    onClick={() => setReaction(r.id as any)}
                                                    style={{
                                                        padding: '8px 4px',
                                                        borderRadius: '8px',
                                                        border: reaction === r.id ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                                                        background: reaction === r.id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                                        color: 'var(--text-primary)',
                                                        fontWeight: 700,
                                                        fontSize: '11px',
                                                        cursor: 'pointer',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {category === 'health' && (
                        <>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Health Record Type</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                    {[
                                        { id: 'medication', label: '💊 Medication' },
                                        { id: 'vitals', label: '🩺 Vitals & Temp' }
                                    ].map(h => (
                                        <button
                                            type="button"
                                            key={h.id}
                                            id={`health-type-${h.id}`}
                                            onClick={() => setSubType(h.id)}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: subType === h.id ? 'var(--primary-accent)' : 'transparent',
                                                color: subType === h.id ? '#fff' : 'var(--text-primary)',
                                                fontWeight: 700,
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {h.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {subType === 'medication' ? (
                                <>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Medication Name</label>
                                        <input
                                            type="text"
                                            id="medication-name-input"
                                            value={medicationName}
                                            onChange={(e) => setMedicationName(e.target.value)}
                                            placeholder="e.g. Infant Tylenol, Vitamin D, Motrin"
                                            className="input-field"
                                            style={{ marginTop: '4px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                            {['Infant Tylenol', 'Vitamin D Drops', 'Infant Motrin', 'Gas Relief Drops', 'Probiotics', 'Amoxicillin'].map(m => (
                                                <button
                                                    type="button"
                                                    key={m}
                                                    onClick={() => setMedicationName(m)}
                                                    style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-surface-elevated)',
                                                        fontSize: '11px',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Dose & Unit</label>
                                            <input
                                                type="text"
                                                id="medication-dosage-input"
                                                value={dosage}
                                                onChange={(e) => setDosage(e.target.value)}
                                                placeholder="e.g. 1.25 mL, 400 IU, 2 drops"
                                                className="input-field"
                                                style={{ marginTop: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Route / Method</label>
                                            <select
                                                id="medication-route-select"
                                                value={medRoute}
                                                onChange={(e) => setMedRoute(e.target.value)}
                                                className="input-field"
                                                style={{ marginTop: '4px' }}
                                            >
                                                <option value="Oral syringe">Oral syringe</option>
                                                <option value="Oral drops">Oral drops</option>
                                                <option value="Topical / Ointment">Topical / Ointment</option>
                                                <option value="Inhalation / Nebulizer">Inhalation / Nebulizer</option>
                                                <option value="Rectal suppository">Rectal suppository</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Vitals Form */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Body Temperature</label>
                                            <div style={{ display: 'flex', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                                <button
                                                    type="button"
                                                    id="btn-temp-unit-f"
                                                    onClick={() => setTempUnit('F')}
                                                    style={{
                                                        padding: '2px 8px',
                                                        border: 'none',
                                                        background: tempUnit === 'F' ? 'var(--primary-accent)' : 'transparent',
                                                        color: tempUnit === 'F' ? '#fff' : 'var(--text-muted)',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    °F
                                                </button>
                                                <button
                                                    type="button"
                                                    id="btn-temp-unit-c"
                                                    onClick={() => setTempUnit('C')}
                                                    style={{
                                                        padding: '2px 8px',
                                                        border: 'none',
                                                        background: tempUnit === 'C' ? 'var(--primary-accent)' : 'transparent',
                                                        color: tempUnit === 'C' ? '#fff' : 'var(--text-muted)',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    °C
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.1"
                                            id="vitals-temperature-input"
                                            value={temperature}
                                            onChange={(e) => setTemperature(e.target.value)}
                                            placeholder={tempUnit === 'F' ? 'e.g. 98.6' : 'e.g. 37.0'}
                                            className="input-field"
                                            style={{ marginTop: '4px' }}
                                        />
                                        {temperature && parseFloat(temperature) >= (tempUnit === 'F' ? 100.4 : 38.0) && (
                                            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginTop: '4px' }}>
                                                ⚠️ Pediatric Fever Range ({tempUnit === 'F' ? '≥ 100.4°F' : '≥ 38.0°C'}). Keep comfortable and consult pediatrician if persistent.
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Measurement Site</label>
                                            <select
                                                id="vitals-site-select"
                                                value={measurementSite}
                                                onChange={(e) => setMeasurementSite(e.target.value)}
                                                className="input-field"
                                                style={{ marginTop: '4px' }}
                                            >
                                                <option value="Forehead">Forehead (Temporal)</option>
                                                <option value="Ear">Ear (Tympanic)</option>
                                                <option value="Underarm">Underarm (Axillary)</option>
                                                <option value="Rectal">Rectal</option>
                                                <option value="Oral">Oral</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Pulse (bpm, optional)</label>
                                            <input
                                                type="number"
                                                id="vitals-pulse-input"
                                                value={pulseBpm}
                                                onChange={(e) => setPulseBpm(e.target.value)}
                                                placeholder="e.g. 120"
                                                className="input-field"
                                                style={{ marginTop: '4px' }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {category === 'pumping' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Left Breast ({isOz ? 'oz' : 'mL'})</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={leftAmount}
                                    onChange={(e) => setLeftAmount(e.target.value)}
                                    placeholder="e.g. 100"
                                    className="input-field"
                                    style={{ marginTop: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Right Breast ({isOz ? 'oz' : 'mL'})</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={rightAmount}
                                    onChange={(e) => setRightAmount(e.target.value)}
                                    placeholder="e.g. 100"
                                    className="input-field"
                                    style={{ marginTop: '4px' }}
                                />
                            </div>
                        </div>
                    )}

                    {category === 'diaper' && (
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Diaper Contents</label>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                {[
                                    { id: 'pee', label: '🟡 Wet (Pee)' },
                                    { id: 'poop', label: '💩 Dirty (Poop)' },
                                    { id: 'both', label: '🟣 Both' }
                                ].map(d => (
                                    <button
                                        type="button"
                                        key={d.id}
                                        onClick={() => setSubType(d.id)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: subType === d.id ? 'var(--primary-accent)' : 'transparent',
                                            color: subType === d.id ? '#fff' : 'var(--text-primary)',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Diaper Size</label>
                                <select
                                    value={diaperSize}
                                    onChange={(e) => setDiaperSize(e.target.value)}
                                    className="input-field"
                                    style={{ marginTop: '4px' }}
                                >
                                    <option value="nb">Newborn (NB)</option>
                                    <option value="1">Size 1</option>
                                    <option value="2">Size 2</option>
                                    <option value="3">Size 3</option>
                                    <option value="4">Size 4+</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {(category === 'sleep' || category === 'tummy') && (
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                                Duration (Minutes)
                            </label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="e.g. 45"
                                className="input-field"
                                style={{ marginTop: '4px' }}
                            />
                        </div>
                    )}

                    {category === 'growth' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Weight (Lbs)</label>
                                    <input
                                        type="number"
                                        value={weightLbs}
                                        onChange={(e) => setWeightLbs(e.target.value)}
                                        placeholder="e.g. 11"
                                        className="input-field"
                                        style={{ marginTop: '4px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Weight (Oz)</label>
                                    <input
                                        type="number"
                                        value={weightOz}
                                        onChange={(e) => setWeightOz(e.target.value)}
                                        placeholder="e.g. 8"
                                        className="input-field"
                                        style={{ marginTop: '4px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Length (Inches)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={heightInches}
                                        onChange={(e) => setHeightInches(e.target.value)}
                                        placeholder="e.g. 21.5"
                                        className="input-field"
                                        style={{ marginTop: '4px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Head Circ. (Inches)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={headCirc}
                                        onChange={(e) => setHeadCirc(e.target.value)}
                                        placeholder="e.g. 14.2"
                                        className="input-field"
                                        style={{ marginTop: '4px' }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {category === 'other' && (
                        <>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                                    Activity Title / Name
                                </label>
                                <input
                                    type="text"
                                    id="log-other-title-input"
                                    value={subType}
                                    onChange={(e) => setSubType(e.target.value)}
                                    placeholder="e.g. Stroller Walk, Reading, Playdate, Massage"
                                    className="input-field"
                                    style={{ marginTop: '4px' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                                    Duration (Minutes, optional)
                                </label>
                                <input
                                    type="number"
                                    id="log-other-duration-input"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="e.g. 20"
                                    className="input-field"
                                    style={{ marginTop: '4px' }}
                                />
                            </div>
                        </>
                    )}

                    {category === 'bath' && (
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                                Bath Duration (Minutes)
                            </label>
                            <input
                                type="number"
                                id="log-bath-duration-input"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="e.g. 15"
                                className="input-field"
                                style={{ marginTop: '4px' }}
                            />
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Date</label>
                        <input
                            type="date"
                            value={dateStr}
                            onChange={(e) => setDateStr(e.target.value)}
                            className="input-field"
                            style={{ marginTop: '4px' }}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Notes / Comments</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Calm session, burped smoothly"
                            className="input-field"
                            style={{ marginTop: '4px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" id="btn-save-log-activity" className="btn-primary">
                            <Check size={16} />
                            <span>Save Activity</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
