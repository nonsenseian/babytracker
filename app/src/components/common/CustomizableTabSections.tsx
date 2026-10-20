import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowUp, ArrowDown, Minus, Plus, RotateCcw, Check } from 'lucide-react';
import { AddWidgetShelf } from '../tracker/AddWidgetShelf';

export interface CustomizableTabSectionsProps {
    tabId: string;
    sectionOrder: string[];
    defaultOrder: string[];
    hiddenSections: string[];
    sectionComponents: Record<string, { label: string; element: React.ReactNode }>;
    onUpdateOrder: (newOrder: string[]) => void;
    onHideSection: (id: string) => void;
    onRestoreSection: (id: string) => void;
    onResetLayout: () => void;
}

export const CustomizableTabSections: React.FC<CustomizableTabSectionsProps> = ({
    tabId,
    sectionOrder,
    defaultOrder,
    hiddenSections,
    sectionComponents,
    onUpdateOrder,
    onHideSection,
    onRestoreSection,
    onResetLayout
}) => {
    const { settings, updateSettings } = useApp();

    // Compute effective order:
    // Filter raw order to known keys in sectionComponents
    const knownKeys = Object.keys(sectionComponents);
    const rawList = sectionOrder && sectionOrder.length > 0 ? sectionOrder : defaultOrder;
    let order = rawList.filter(id => knownKeys.includes(id));
    for (const key of knownKeys) {
        if (!order.includes(key) && !hiddenSections.includes(key)) {
            order.push(key);
        }
    }

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= order.length) return;
        const newOrder = [...order];
        const temp = newOrder[index];
        newOrder[index] = newOrder[targetIndex];
        newOrder[targetIndex] = temp;
        onUpdateOrder(newOrder);
    };

    return (
        <div>
            {/* Dashboard Layout Customization Sticky Floating Bar (When Active) */}
            {settings.isLayoutEditMode && (
                <div
                    id={`layout-edit-bar-${tabId}`}
                    style={{
                        position: 'sticky',
                        top: '12px',
                        zIndex: 120,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 18px',
                        borderRadius: '16px',
                        backgroundColor: 'var(--bg-surface-elevated, #1c1917)',
                        backgroundImage: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.08) 100%)',
                        border: '2px solid #f59e0b',
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        marginBottom: '20px',
                        animation: 'fadeIn 0.2s ease'
                    }}
                >
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>
                            🛠️ Dashboard Customization Active
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Rearrange cards or pin quick activities. Changes save automatically.
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={onResetLayout}
                            className="btn-ghost"
                            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <RotateCcw size={13} />
                            <span>Reset Layout</span>
                        </button>

                        <button
                            type="button"
                            id={`layout-edit-done-btn-${tabId}`}
                            onClick={() => updateSettings({ isLayoutEditMode: false })}
                            className="btn-primary"
                            style={{
                                fontSize: '12px',
                                padding: '6px 16px',
                                backgroundColor: '#f59e0b',
                                borderColor: '#f59e0b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: 800
                            }}
                        >
                            <Check size={14} />
                            <span>Save & Done</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden Sections Restore Shelf (for non-tracker tabs or when not using in-feed shelf) */}
            {tabId !== 'tracker' && hiddenSections.length > 0 && (
                <div
                    id={`layout-restore-shelf-${tabId}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        marginBottom: '18px'
                    }}
                >
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
                        Hidden Sections (+ Tap to Restore):
                    </span>
                    {hiddenSections.map(sId => (
                        <button
                            key={sId}
                            type="button"
                            onClick={() => onRestoreSection(sId)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '16px',
                                border: '1px dashed var(--primary-accent)',
                                backgroundColor: 'transparent',
                                color: 'var(--primary-accent)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={12} />
                            <span>{sectionComponents[sId]?.label || sId}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Dynamic Ordered & Filtered Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(() => {
                    let hasRenderedShelf = false;
                    const elements: React.ReactNode[] = [];

                    order.forEach((sectionId, index) => {
                        if (hiddenSections.includes(sectionId)) return;
                        const sec = sectionComponents[sectionId];
                        if (!sec || (!sec.element && !settings.isLayoutEditMode)) return;

                        elements.push(
                            <div
                                key={sectionId}
                                id={`section-${sectionId}`}
                                className={`layout-card-block ${settings.isLayoutEditMode ? 'layout-customizing-active' : ''}`}
                                style={{
                                    position: 'relative',
                                    cursor: settings.isLayoutEditMode ? 'grab' : 'default'
                                }}
                                draggable={settings.isLayoutEditMode}
                                onDragStart={(e) => {
                                    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('[data-drag-inner="true"]')) {
                                        return;
                                    }
                                    e.dataTransfer.setData(`application/x-dashboard-section-${tabId}`, String(index));
                                    e.dataTransfer.setData('text/plain', `section:${index}`);
                                    e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragOver={(e) => {
                                    if (settings.isLayoutEditMode) {
                                        if (e.dataTransfer.types.includes('application/x-quicklog-id') || e.dataTransfer.types.includes('application/x-timer-id')) {
                                            return;
                                        }
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                    }
                                }}
                                onDrop={(e) => {
                                    if (!settings.isLayoutEditMode) return;
                                    if (e.dataTransfer.types.includes('application/x-quicklog-id') || e.dataTransfer.types.includes('application/x-timer-id')) {
                                        return;
                                    }
                                    const raw = e.dataTransfer.getData(`application/x-dashboard-section-${tabId}`) || e.dataTransfer.getData('text/plain');
                                    if (!raw) return;
                                    const fromIndex = raw.startsWith('section:')
                                        ? parseInt(raw.replace('section:', ''), 10)
                                        : parseInt(raw, 10);
                                    if (!isNaN(fromIndex) && fromIndex !== index) {
                                        e.preventDefault();
                                        const nextOrder = [...order];
                                        const [moved] = nextOrder.splice(fromIndex, 1);
                                        nextOrder.splice(index, 0, moved);
                                        onUpdateOrder(nextOrder);
                                    }
                                }}
                            >
                                {/* Dashboard Edit Controls (Visible Only in Edit Mode) */}
                                {settings.isLayoutEditMode && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        right: '10px',
                                        zIndex: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        {/* Reorder Buttons */}
                                        <button
                                            type="button"
                                            onClick={() => moveSection(index, 'up')}
                                            disabled={index === 0}
                                            aria-label={`Move ${sec.label} up`}
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--bg-surface-elevated)',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                                opacity: index === 0 ? 0.3 : 1,
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <ArrowUp size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveSection(index, 'down')}
                                            disabled={index === order.length - 1}
                                            aria-label={`Move ${sec.label} down`}
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--bg-surface-elevated)',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: index === order.length - 1 ? 'not-allowed' : 'pointer',
                                                opacity: index === order.length - 1 ? 0.3 : 1,
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <ArrowDown size={12} />
                                        </button>

                                        {/* Minus Remove Badge */}
                                        <button
                                            type="button"
                                            onClick={() => onHideSection(sectionId)}
                                            className="layout-remove-badge"
                                            aria-label={`Remove ${sec.label} section`}
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '50%',
                                                backgroundColor: '#ef4444',
                                                border: '2px solid #fff',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                                            }}
                                        >
                                            <Minus size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                )}

                                {sec.element}
                            </div>
                        );
                    });

                    // If activity-log was hidden or not in order, render AddWidgetShelf at bottom of tracker list
                    if (tabId === 'tracker' && !hasRenderedShelf) {
                        elements.push(
                            <AddWidgetShelf
                                key="tracker-add-widget-shelf"
                                hiddenSections={hiddenSections}
                                onRestoreSection={onRestoreSection}
                                onRestoreAll={() => {
                                    const toRestore = ['sweet-nap', 'sound-machine', 'timeline-ribbon', 'reminders'];
                                    const nextHidden = hiddenSections.filter(id => !toRestore.includes(id));
                                    updateSettings({ hiddenSections: nextHidden });
                                }}
                                onStreamline={() => {
                                    const toHide = ['sweet-nap', 'sound-machine', 'timeline-ribbon', 'reminders'];
                                    const nextHidden = Array.from(new Set([...hiddenSections, ...toHide]));
                                    updateSettings({ hiddenSections: nextHidden });
                                }}
                            />
                        );
                    }

                    return elements;
                })()}
            </div>
        </div>
    );
};
