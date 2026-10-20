import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ChartMode, TimeframeOption } from '../../types/analytics';
import {
    computeDailyAggregations,
    computeDonutSlices,
    computeHourlyBuckets,
    getDatesForTimeframe
} from '../../engines/analyticsEngine';
import { KpiCards } from './KpiCards';
import { SplineChart } from './SplineChart';
import { StackedBarChart } from './StackedBarChart';
import { DonutChart } from './DonutChart';
import { TimelineRibbon } from './TimelineRibbon';
import { ClinicalInsightCard } from './ClinicalInsightCard';
import { FormulaCalculatorCard } from './FormulaCalculatorCard';
import { AppointmentsCard } from '../tracker/AppointmentsCard';
import { MonthlyActivityCalendar } from '../tracker/MonthlyActivityCalendar';
import { CustomizableTabSections } from '../common/CustomizableTabSections';
import type { ActivityCategory } from '../../types/log';

export interface AnalyticsDashboardProps {
    onOpenAddAppointment?: () => void;
    onOpenEditAppointment?: (apt: any) => void;
    onOpenDoctorDossier?: () => void;
    onEditLog?: (log: any) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
    onOpenAddAppointment,
    onOpenEditAppointment,
    onOpenDoctorDossier,
    onEditLog
}) => {
    const { logs, unit, settings, updateSettings } = useApp();
    const isOz = unit === 'oz';

    const [metric, setMetric] = useState<ActivityCategory>('feeding');
    const [timeframe, setTimeframe] = useState<TimeframeOption>('7D');
    const [chartMode, setChartMode] = useState<ChartMode>('spline');
    const [filterText, setFilterText] = useState<string>('');

    const timeframesList: TimeframeOption[] = ['7D', '14D', '30D', '90D', 'All'];

    const chartModesList: { id: ChartMode; label: string }[] = [
        { id: 'spline', label: '📈 Spline' },
        { id: 'bar', label: '📊 Bar' },
        { id: 'donut', label: '🍩 Donut' },
        { id: 'timeline', label: '⏰ 24-Hr' }
    ];

    const query = filterText.trim().toLowerCase();
    const filteredLogs = React.useMemo(() => {
        if (!query) return logs;
        return logs.filter(l => {
            if (l.category && l.category.toLowerCase().includes(query)) return true;
            if (l.subType && l.subType.toLowerCase().includes(query)) return true;
            if (l.notes && l.notes.toLowerCase().includes(query)) return true;
            if (l.foodName && l.foodName.toLowerCase().includes(query)) return true;
            if (l.medicationName && l.medicationName.toLowerCase().includes(query)) return true;
            if (query === 'breast' && (l.subType === 'nursing' || l.subType === 'breastmilk')) return true;
            return false;
        });
    }, [logs, query]);

    const dates = getDatesForTimeframe(timeframe, filteredLogs);
    const dailyData = computeDailyAggregations(filteredLogs, dates, metric);
    const donutData = computeDonutSlices(dailyData, metric, isOz);
    const hourlyData = computeHourlyBuckets(filteredLogs, dates, metric, isOz);

    const defaultMetricsSections = ['health-analytics', 'clinical-guidelines', 'formula-calculator', 'appointments', 'calendar'];

    const metricsSectionComponents: Record<string, { label: string; element: React.ReactNode }> = {
        'health-analytics': {
            label: '📈 Trends & Analytics',
            element: (
                <div className="surface-card" style={{ marginBottom: 0 }}>
                    {/* Header: Controls & Timeframe */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '16px'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Trends & Analytics</h2>
                        </div>

                        {/* Timeframe selector */}
                        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: '10px' }}>
                            {timeframesList.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTimeframe(t)}
                                    style={{
                                        padding: '4px 10px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: timeframe === t ? 'var(--primary-accent)' : 'transparent',
                                        color: timeframe === t ? '#fff' : 'var(--text-secondary)',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Dropdown and Activity Filter */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '16px'
                    }}>
                        {/* Category Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 180px' }}>
                            <label htmlFor="metrics-category-select" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                Category:
                            </label>
                            <select
                                id="metrics-category-select"
                                value={metric}
                                onChange={(e) => setMetric(e.target.value as ActivityCategory)}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-surface-elevated)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="feeding">🍼 Feeds</option>
                                <option value="pumping">💧 Pumping</option>
                                <option value="diaper">✨ Diapers</option>
                                <option value="sleep">🌙 Sleep</option>
                                <option value="tummy">🐢 Tummy</option>
                                <option value="growth">📏 Growth</option>
                            </select>
                        </div>

                        {/* Filter Textbox */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 200px', position: 'relative' }}>
                            <input
                                id="metrics-filter-input"
                                type="text"
                                placeholder="Filter activities (e.g. Formula, breast)..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 28px 8px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-surface-elevated)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12.5px',
                                    fontWeight: 500,
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {filterText && (
                                <button
                                    type="button"
                                    onClick={() => setFilterText('')}
                                    aria-label="Clear filter"
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '2px',
                                        fontSize: '14px',
                                        lineHeight: 1
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* KPIs */}
                    <KpiCards dailyData={dailyData} metric={metric} isOz={isOz} />

                    {/* Chart Mode Switcher */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '12px',
                        gap: '4px'
                    }}>
                        <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: '10px' }}>
                            {chartModesList.map(mode => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => setChartMode(mode.id)}
                                    style={{
                                        padding: '6px 12px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: chartMode === mode.id ? 'var(--bg-surface)' : 'transparent',
                                        color: chartMode === mode.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        boxShadow: chartMode === mode.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Render Active Chart Mode */}
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '14px',
                        padding: '16px'
                    }}>
                        {chartMode === 'spline' && (
                            <SplineChart dailyData={dailyData} metric={metric} isOz={isOz} />
                        )}
                        {chartMode === 'bar' && (
                            <StackedBarChart dailyData={dailyData} metric={metric} isOz={isOz} />
                        )}
                        {chartMode === 'donut' && (
                            <DonutChart
                                slices={donutData.slices}
                                totalVal={donutData.totalVal}
                                unitStr={donutData.unitStr}
                                metric={metric}
                                isOz={isOz}
                            />
                        )}
                        {chartMode === 'timeline' && (
                            <TimelineRibbon
                                buckets={hourlyData.buckets}
                                maxVal={hourlyData.maxVal}
                                totalPeriodValue={hourlyData.totalPeriodValue}
                                metric={metric}
                            />
                        )}
                    </div>
                </div>
            )
        },
        'clinical-guidelines': {
            label: '🩺 Pediatric Insights',
            element: metric === 'feeding' ? null : <ClinicalInsightCard metric={metric} />
        },
        'formula-calculator': {
            label: '🍼 Formula Calculator',
            element: <FormulaCalculatorCard />
        },
        'appointments': {
            label: '🩺 Appointments',
            element: (
                <AppointmentsCard
                    onOpenAddModal={onOpenAddAppointment || (() => {})}
                    onOpenEditModal={onOpenEditAppointment || (() => {})}
                    onOpenDoctorDossier={onOpenDoctorDossier || (() => {})}
                />
            )
        },
        'calendar': {
            label: '🗓️ Activity Calendar',
            element: <MonthlyActivityCalendar onEditLog={onEditLog || (() => {})} />
        }
    };

    return (
        <CustomizableTabSections
            tabId="metrics"
            sectionOrder={settings.metricsSectionOrder || defaultMetricsSections}
            defaultOrder={defaultMetricsSections}
            hiddenSections={settings.hiddenMetricsSections || []}
            sectionComponents={metricsSectionComponents}
            onUpdateOrder={(newOrder) => updateSettings({ metricsSectionOrder: newOrder })}
            onHideSection={(id) => updateSettings({ hiddenMetricsSections: [...(settings.hiddenMetricsSections || []), id] })}
            onRestoreSection={(id) => updateSettings({ hiddenMetricsSections: (settings.hiddenMetricsSections || []).filter(s => s !== id) })}
            onResetLayout={() => updateSettings({ metricsSectionOrder: defaultMetricsSections, hiddenMetricsSections: [] })}
        />
    );
};
