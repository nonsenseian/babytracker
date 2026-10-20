import React from 'react';
import { Plus, Sparkles, Eye } from 'lucide-react';

interface AddWidgetShelfProps {
    hiddenSections: string[];
    onRestoreSection: (sectionId: string) => void;
    onRestoreAll?: () => void;
    onStreamline?: () => void;
}

interface ToolDefinition {
    id: string;
    label: string;
    emoji: string;
    description: string;
}

const AVAILABLE_TRACKER_TOOLS: ToolDefinition[] = [
    {
        id: 'sweet-nap',
        label: 'SweetNap Predictor',
        emoji: '😴',
        description: 'Wake window & next-nap AI forecasting'
    },
    {
        id: 'sound-machine',
        label: 'Sound Machine',
        emoji: '🎶',
        description: 'Calming nursery white noise & ambient audio'
    },
    {
        id: 'timeline-ribbon',
        label: '24h Timeline Ribbon',
        emoji: '⏱️',
        description: 'Full day-at-a-glance visual timeline'
    },
    {
        id: 'reminders',
        label: 'Pediatric Reminders',
        emoji: '⏰',
        description: 'Feeding & diaper interval countdowns'
    }
];

export const AddWidgetShelf: React.FC<AddWidgetShelfProps> = ({
    hiddenSections,
    onRestoreSection,
    onRestoreAll,
    onStreamline
}) => {
    const hiddenTools = AVAILABLE_TRACKER_TOOLS.filter(t => hiddenSections.includes(t.id));

    // When all tools are active, offer a discreet 1-tap option to streamline
    if (hiddenTools.length === 0) {
        return (
            <div
                id="add-widget-shelf"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.06)',
                    border: '1px dashed var(--border-color)',
                    margin: '12px 0 20px 0',
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={13} style={{ color: '#f59e0b' }} />
                    <span>All tracker features active</span>
                </div>
                {onStreamline && (
                    <button
                        type="button"
                        id="btn-streamline-dashboard"
                        onClick={onStreamline}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#f59e0b',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                        title="Hide optional cards to keep your feed clean and compact"
                    >
                        <span>🌿 Streamline View</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <section
            id="add-widget-shelf"
            aria-label="Personalize Your Dashboard Tool Shelf"
            style={{
                padding: '16px 18px',
                borderRadius: '16px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '2px dashed rgba(245, 158, 11, 0.4)',
                margin: '14px 0 24px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Sparkles size={15} />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Personalize Your Dashboard
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Tap to add optional tools when you're ready, or keep your feed clean:
                        </div>
                    </div>
                </div>

                {onRestoreAll && hiddenTools.length > 1 && (
                    <button
                        type="button"
                        id="btn-add-all-widgets"
                        onClick={onRestoreAll}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '8px',
                            color: '#f59e0b',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <Eye size={12} />
                        <span>Show All ({hiddenTools.length})</span>
                    </button>
                )}
            </div>

            {/* Pill Buttons for each hidden tool */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'center'
            }}>
                {hiddenTools.map(tool => (
                    <button
                        key={tool.id}
                        type="button"
                        id={`btn-add-widget-${tool.id}`}
                        onClick={() => onRestoreSection(tool.id)}
                        aria-label={`Add ${tool.label} to dashboard`}
                        title={tool.description}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '999px',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)'
                        }}
                    >
                        <span>{tool.emoji}</span>
                        <span>{tool.label}</span>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#f59e0b',
                            color: '#ffffff',
                            marginLeft: '2px'
                        }}>
                            <Plus size={12} strokeWidth={3} />
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
};
