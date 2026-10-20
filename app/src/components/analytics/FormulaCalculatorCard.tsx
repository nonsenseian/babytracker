import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
    calculateFormulaMix,
    type WaterUnit,
    ML_PER_FL_OZ
} from '../../engines/formulaEngine';
import { Calculator, Check, Info, Plus, Minus, RotateCcw, Lightbulb } from 'lucide-react';

interface SavedCalculatorState {
    waterVolume: number;
    waterUnit: WaterUnit;
    customMixTsp: number;
    customWaterVolume: number;
    customWaterUnit: WaterUnit;
}

const STORAGE_KEY = 'bt_formula_calc_state_v2';

export const FormulaCalculatorCard: React.FC = () => {
    const { unit, addLog } = useApp();
    const isGlobalOz = unit === 'oz';

    // Load initial state from localStorage or defaults
    const [state, setState] = useState<SavedCalculatorState>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('bt_formula_calc_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    waterVolume: typeof parsed.waterVolume === 'number' ? parsed.waterVolume : (isGlobalOz ? 4 : 120),
                    waterUnit: parsed.waterUnit || (isGlobalOz ? 'oz' : 'ml'),
                    customMixTsp: typeof parsed.customMixTsp === 'number' ? parsed.customMixTsp : (isGlobalOz ? 3 : 1.5),
                    customWaterVolume: typeof parsed.customWaterVolume === 'number' ? parsed.customWaterVolume : (isGlobalOz ? 2 : 75),
                    customWaterUnit: parsed.customWaterUnit || (isGlobalOz ? 'oz' : 'ml')
                };
            }
        } catch (e) {
            // fallback
        }
        return {
            waterVolume: isGlobalOz ? 4 : 120,
            waterUnit: isGlobalOz ? 'oz' : 'ml',
            customMixTsp: isGlobalOz ? 3 : 1.5,
            customWaterVolume: isGlobalOz ? 2 : 75,
            customWaterUnit: isGlobalOz ? 'oz' : 'ml'
        };
    });

    const [justLogged, setJustLogged] = useState<boolean>(false);
    const [showSafetyTips, setShowSafetyTips] = useState<boolean>(false);

    // Save to localStorage whenever custom settings change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // ignore
        }
    }, [state]);

    // Calculate required formula mix based purely on custom ratio
    const result = calculateFormulaMix(
        state.waterVolume,
        state.waterUnit,
        state.customMixTsp,
        state.customWaterVolume,
        state.customWaterUnit,
        3
    );

    // Bottle chips presets
    const bottleChips = state.waterUnit === 'oz'
        ? [2, 3, 4, 5, 6, 8]
        : [60, 90, 120, 150, 180, 240];

    const stepAmount = state.waterUnit === 'oz' ? 0.5 : 15;

    const handleStepVolume = (direction: 'up' | 'down') => {
        setState(prev => {
            const next = direction === 'up'
                ? prev.waterVolume + stepAmount
                : Math.max(stepAmount, prev.waterVolume - stepAmount);
            return {
                ...prev,
                waterVolume: Math.round(next * 10) / 10
            };
        });
    };

    const handleLogFeed = () => {
        const volumeMl = state.waterUnit === 'oz'
            ? Math.round(state.waterVolume * ML_PER_FL_OZ)
            : Math.round(state.waterVolume);

        const success = addLog({
            category: 'feeding',
            subType: 'formula',
            amountMl: volumeMl,
            notes: `Formula Bottle: ${state.waterVolume} ${state.waterUnit} water + ${result.requiredTspFormatted} formula mix`
        });

        if (success) {
            setJustLogged(true);
            setTimeout(() => setJustLogged(false), 3000);
        }
    };

    return (
        <div
            id="formula-ratio-calculator"
            style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '20px',
                marginTop: '20px',
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                boxSizing: 'border-box',
                maxWidth: '100%'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                marginBottom: '16px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Calculator size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                            Formula Calculator
                        </h3>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        onClick={() => setShowSafetyTips(!showSafetyTips)}
                        title="AAP/CDC Safe preparation guidelines"
                        aria-label="Toggle safe preparation guidelines"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '16px',
                            backgroundColor: showSafetyTips ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface-elevated)',
                            color: showSafetyTips ? 'var(--primary-accent)' : 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        <Info size={13} />
                        <span>Safety Tips</span>
                    </button>

                    <button
                        onClick={() => {
                            setState({
                                waterVolume: isGlobalOz ? 4 : 120,
                                waterUnit: isGlobalOz ? 'oz' : 'ml',
                                customMixTsp: isGlobalOz ? 3 : 1.5,
                                customWaterVolume: isGlobalOz ? 2 : 75,
                                customWaterUnit: isGlobalOz ? 'oz' : 'ml'
                            });
                        }}
                        title="Reset to standard defaults"
                        aria-label="Reset calculator to standard defaults"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 8px',
                            borderRadius: '16px',
                            backgroundColor: 'transparent',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            fontSize: '11px',
                            cursor: 'pointer'
                        }}
                    >
                        <RotateCcw size={12} />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* Safety Tips Banner (Collapsible) */}
            {showSafetyTips && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    marginBottom: '16px',
                    fontSize: '12px',
                    lineHeight: '1.5'
                }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary-accent)', marginBottom: '4px' }}>
                        💧 AAP & CDC Safe Preparation Guardrails
                    </div>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                        <li><strong>Water first:</strong> Always pour water before adding powder mix. Adding powder first displaces water and creates dangerously hyper-concentrated formula.</li>
                        <li><strong>Level, don't pack:</strong> Use a clean, flat knife edge to level scoops. Never pack formula powder down.</li>
                        <li><strong>Swirl gently:</strong> Swirl bottle to dissolve powder rather than shaking vigorously to prevent colic-causing air bubbles.</li>
                    </ul>
                </div>
            )}

            {/* Customize Formula-to-Water Ratio (Only option) */}
            <div style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                marginBottom: '16px'
            }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>
                    Customize Formula-to-Water Ratio:
                </div>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Add</span>
                        <input
                            id="formula-custom-mix-tsp"
                            type="number"
                            min="0.25"
                            step="0.25"
                            value={state.customMixTsp}
                            onChange={(e) => setState(prev => ({ ...prev, customMixTsp: parseFloat(e.target.value) || 0 }))}
                            style={{
                                width: '64px',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontWeight: 700,
                                fontSize: '13px'
                            }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>tsp formula mix</span>
                    </div>

                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>per</span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                            id="formula-custom-water-vol"
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={state.customWaterVolume}
                            onChange={(e) => setState(prev => ({ ...prev, customWaterVolume: parseFloat(e.target.value) || 1 }))}
                            style={{
                                width: '64px',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontWeight: 700,
                                fontSize: '13px'
                            }}
                        />
                        <select
                            id="formula-custom-water-unit"
                            value={state.customWaterUnit}
                            onChange={(e) => setState(prev => ({ ...prev, customWaterUnit: e.target.value as WaterUnit }))}
                            style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="oz">fl oz</option>
                            <option value="ml">mL</option>
                        </select>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>water</span>
                    </div>
                </div>
            </div>

            {/* Desired Water Volume */}
            <div style={{ marginBottom: '18px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                }}>
                    <label style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px'
                    }}>
                        Desired Water Volume
                    </label>

                    {/* Unit Switcher */}
                    <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-surface-elevated)', padding: '2px', borderRadius: '8px' }}>
                        {(['oz', 'ml'] as WaterUnit[]).map(u => (
                            <button
                                key={u}
                                onClick={() => {
                                    if (u === state.waterUnit) return;
                                    setState(prev => ({
                                        ...prev,
                                        waterUnit: u,
                                        waterVolume: u === 'ml'
                                            ? Math.round(prev.waterVolume * ML_PER_FL_OZ)
                                            : Math.round((prev.waterVolume / ML_PER_FL_OZ) * 10) / 10
                                    }));
                                }}
                                style={{
                                    padding: '3px 8px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    backgroundColor: state.waterUnit === u ? 'var(--primary-accent)' : 'transparent',
                                    color: state.waterUnit === u ? '#fff' : 'var(--text-muted)',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                {u === 'oz' ? 'fl oz' : 'mL'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stepper + Input */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px'
                }}>
                    <button
                        onClick={() => handleStepVolume('down')}
                        aria-label={`Decrease water volume by ${stepAmount} ${state.waterUnit}`}
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Minus size={16} />
                    </button>

                    <div style={{ position: 'relative', flex: 1, maxWidth: '160px' }}>
                        <input
                            id="formula-desired-water-input"
                            type="number"
                            min="0.5"
                            step={state.waterUnit === 'oz' ? '0.5' : '10'}
                            value={state.waterVolume}
                            onChange={(e) => setState(prev => ({ ...prev, waterVolume: parseFloat(e.target.value) || 0 }))}
                            aria-label={`Water volume in ${state.waterUnit}`}
                            style={{
                                width: '100%',
                                padding: '8px 36px 8px 12px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontSize: '16px',
                                fontWeight: 800,
                                textAlign: 'left',
                                boxSizing: 'border-box'
                            }}
                        />
                        <span style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--text-muted)'
                        }}>
                            {state.waterUnit}
                        </span>
                    </div>

                    <button
                        onClick={() => handleStepVolume('up')}
                        aria-label={`Increase water volume by ${stepAmount} ${state.waterUnit}`}
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Bottle Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {bottleChips.map(vol => {
                        const isCurrent = state.waterVolume === vol;
                        return (
                            <button
                                key={vol}
                                onClick={() => setState(prev => ({ ...prev, waterVolume: vol }))}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '14px',
                                    border: isCurrent ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                                    backgroundColor: isCurrent ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface-elevated)',
                                    color: isCurrent ? '#f59e0b' : 'var(--text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: isCurrent ? 800 : 600,
                                    cursor: 'pointer'
                                }}
                            >
                                {vol} {state.waterUnit}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Decluttered Hero Output Banner */}
            <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '2px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '16px'
            }}>
                <div style={{
                    fontSize: '11.5px',
                    fontWeight: 800,
                    color: '#d97706',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px'
                }}>
                    Required Formula Mix
                </div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {result.requiredTspFormatted}
                </div>
            </div>

            {/* Log This Prepared Bottle Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <button
                    id="btn-log-formula-bottle"
                    onClick={handleLogFeed}
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: justLogged ? '#10b981' : 'var(--primary-accent)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    {justLogged ? (
                        <>
                            <Check size={16} />
                            <span>✓ Logged to Daily Feed Stream!</span>
                        </>
                    ) : (
                        <>
                            <span>🍼</span>
                            <span>Log This Prepared Bottle ({state.waterVolume} {state.waterUnit})</span>
                        </>
                    )}
                </button>
            </div>

            {/* Pediatric Intake Recommendation (Underneath Log Bottle Box) */}
            <div
                id="formula-calc-pediatric-intake"
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                marginTop: '16px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ color: 'var(--primary-accent)', flexShrink: 0, marginTop: '2px' }}>
                    <Lightbulb size={18} />
                </div>
                <div style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', marginRight: '6px' }}>
                        Pediatric Intake Recommendation:
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        AAP guidelines suggest ~150 mL/kg/day total intake for newborns up to 3 months, divided across 8-12 daily feeds.
                    </span>
                </div>
            </div>
        </div>
    );
};
