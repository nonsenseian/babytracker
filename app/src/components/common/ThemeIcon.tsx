import React from 'react';

export type IconName = 'pee' | 'poop' | 'formula' | 'breastmilk' | 'pump' | 'sleep' | 'tummy' | 'vitamins' | 'nursing' | 'bottle' | 'solids' | 'temp' | 'growth' | 'milestone' | 'bath' | 'other';

interface ThemeIconProps {
    name: IconName;
    className?: string;
    style?: React.CSSProperties;
}

export const ThemeIcon: React.FC<ThemeIconProps> = ({ name, className = '', style }) => {
    switch (name) {
        case 'pee':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-svg text-yellow-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" fillOpacity="0.25" />
                        </svg>
                    </span>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">💧</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#854d0e" d="M7 0h2v1h-2z M6 1h1v1h-1z M9 1h1v1h-1z M6 2h1v1h-1z M9 2h1v1h-1z M5 3h1v1h-1z M5 4h1v1h-1z M4 5h1v1h-1z M12 5h1v1h-1z M4 6h1v1h-1z M12 6h1v1h-1z M3 7h1v1h-1z M13 7h1v1h-1z M3 8h1v1h-1z M13 8h1v1h-1z M2 9h1v1h-1z M14 9h1v1h-1z M2 10h1v1h-1z M14 10h1v1h-1z M2 11h1v1h-1z M14 11h1v1h-1z M3 12h1v1h-1z M13 12h1v1h-1z M4 13h1v1h-1z M12 13h1v1h-1z M5 14h7v1h-7z" />
                            <path fill="#facc15" d="M7 1h2v1h-2z M7 2h2v1h-2z M6 3h1v1h-1z M9 3h2v1h-2z M6 4h1v1h-1z M9 4h2v1h-2z M5 5h2v1h-2z M9 5h3v1h-3z M5 6h7v1h-7z M4 7h9v1h-9z M4 8h9v1h-9z M3 9h11v1h-11z M3 10h11v1h-11z M3 11h11v1h-11z M4 12h9v1h-9z M5 13h7v1h-7z" />
                            <path fill="#fef08a" d="M7 3h2v1h-2z M7 4h2v1h-2z M7 5h2v1h-2z" />
                        </svg>
                    </span>
                </span>
            );

        case 'poop':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-svg text-amber-700">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M 11.78 3.88 C 12.0 4.32, 12.44 5.42, 14.2 6.3 C 16.4 7.4, 16.62 9.6, 15.08 10.92 C 17.5 11.58, 18.38 13.56, 17.72 15.1 C 20.36 15.76, 20.8 17.74, 19.92 19.28 C 19.04 20.38, 16.4 20.6, 12.0 20.6 C 7.6 20.6, 4.96 20.38, 4.08 19.28 C 3.2 17.74, 3.64 15.76, 6.28 15.1 C 5.62 13.56, 6.5 11.58, 8.92 10.92 C 7.38 9.6, 7.6 7.4, 9.8 6.3 C 11.34 5.42, 11.56 4.32, 11.78 3.88 Z" fill="currentColor" fillOpacity="0.25" />
                        </svg>
                    </span>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">💩</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#451a03" d="M7 0h2v1h-2z M6 1h1v1h-1z M9 1h1v1h-1z M5 2h1v1h-1z M10 2h1v1h-1z M4 3h1v1h-1z M3 4h2v1h-2z M12 4h2v1h-2z M2 5h1v1h-1z M14 5h1v1h-1z M1 6h1v1h-1z M14 6h1v1h-1z M1 7h1v1h-1z M14 7h1v1h-1z M0 8h2v1h-2z M15 8h1v1h-1z M0 9h1v1h-1z M15 9h1v1h-1z M0 10h1v1h-1z M15 10h1v1h-1z M0 11h1v1h-1z M15 11h1v1h-1z M1 12h1v1h-1z M14 12h1v1h-1z M2 13h2v1h-2z M12 13h2v1h-2z M4 14h8v1h-8z" />
                            <path fill="#b45309" d="M7 1h2v1h-2z M6 2h4v1h-4z M5 3h1v1h-1z M7 3h5v1h-5z M5 4h7v1h-7z M3 5h11v1h-11z M2 6h2v1h-2z M5 6h9v1h-9z M2 7h12v1h-12z M2 8h13v1h-13z M1 9h14v1h-14z M1 10h1v1h-1z M3 10h12v1h-12z M1 11h14v1h-14z M2 12h12v1h-12z M4 13h8v1h-8z" />
                            <path fill="#fef3c7" d="M6 3h1v1h-1z M4 6h1v1h-1z M2 10h1v1h-1z" />
                        </svg>
                    </span>
                </span>
            );

        case 'formula':
        case 'bottle':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-svg text-sky-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 2h6v2H9z" />
                            <path d="M8 4h8a1 1 0 0 1 1 1v2a3 3 0 0 1-2 2.83V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9.83A3 3 0 0 1 7 7V5a1 1 0 0 1 1-1z" fill="currentColor" fillOpacity="0.25" />
                            <line x1="10" y1="13" x2="14" y2="13" />
                            <line x1="10" y1="16" x2="13" y2="16" />
                        </svg>
                    </span>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">🍼</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M6 0h1v1h-1z M9 0h1v1h-1z M6 1h1v1h-1z M9 1h1v1h-1z M5 2h2v1h-2z M9 2h2v1h-2z M4 3h1v1h-1z M11 3h1v1h-1z M4 4h1v1h-1z M11 4h1v1h-1z M3 5h1v1h-1z M12 5h1v1h-1z M3 6h1v1h-1z M12 6h1v1h-1z M3 7h1v1h-1z M6 7h3v1h-3z M12 7h1v1h-1z M3 8h1v1h-1z M12 8h1v1h-1z M3 9h1v1h-1z M6 9h3v1h-3z M12 9h1v1h-1z M3 10h1v1h-1z M12 10h1v1h-1z M3 11h1v1h-1z M12 11h1v1h-1z M3 12h1v1h-1z M12 12h1v1h-1z M3 13h1v1h-1z M12 13h1v1h-1z M4 14h8v1h-8z" />
                            <path fill="#f59e0b" d="M7 0h2v1h-2z M7 1h2v1h-2z M7 2h2v1h-2z" />
                            <path fill="#38bdf8" d="M5 3h6v1h-6z M5 4h6v1h-6z" />
                            <path fill="#94a3b8" d="M4 5h8v1h-8z M4 6h1v1h-1z M11 6h1v1h-1z M4 7h1v1h-1z M11 7h1v1h-1z M4 8h1v1h-1z M11 8h1v1h-1z M4 9h1v1h-1z M11 9h1v1h-1z M4 10h1v1h-1z M11 10h1v1h-1z M4 11h1v1h-1z M11 11h1v1h-1z M4 12h1v1h-1z M11 12h1v1h-1z M4 13h8v1h-8z" />
                            <path fill="#e2e8f0" d="M5 6h1v1h-1z M10 6h1v1h-1z M5 7h1v1h-1z M10 7h1v1h-1z M5 8h1v1h-1z M10 8h1v1h-1z M5 9h1v1h-1z M10 9h1v1h-1z M5 10h1v1h-1z M10 10h1v1h-1z M5 11h1v1h-1z M10 11h1v1h-1z M5 12h1v1h-1z M10 12h1v1h-1z" />
                            <path fill="#ffffff" d="M6 6h4v1h-4z M9 7h1v1h-1z M6 8h4v1h-4z M9 9h1v1h-1z M6 10h4v1h-4z M6 11h4v1h-4z M6 12h4v1h-4z" />
                        </svg>
                    </span>
                </span>
            );

        case 'breastmilk':
        case 'nursing':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-svg text-rose-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="currentColor" fillOpacity="0.25" />
                            <circle cx="12" cy="10" r="2" fill="currentColor" />
                        </svg>
                    </span>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">🤱</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M2 1h4v1h-4z M10 1h4v1h-4z M1 2h1v1h-1z M6 2h1v1h-1z M9 2h1v1h-1z M14 2h1v1h-1z M1 3h1v1h-1z M6 3h4v1h-4z M14 3h1v1h-1z M0 4h1v1h-1z M15 4h1v1h-1z M0 5h1v1h-1z M15 5h1v1h-1z M0 6h1v1h-1z M15 6h1v1h-1z M1 7h1v1h-1z M14 7h1v1h-1z M2 8h1v1h-1z M13 8h1v1h-1z M3 9h1v1h-1z M12 9h1v1h-1z M4 10h1v1h-1z M11 10h1v1h-1z M5 11h1v1h-1z M10 11h1v1h-1z M6 12h1v1h-1z M9 12h1v1h-1z M7 13h2v1h-2z" />
                            <path fill="#f43f5e" d="M2 2h4v1h-4z M10 2h4v1h-4z M2 3h1v1h-1z M5 3h1v1h-1z M10 3h4v1h-4z M1 4h2v1h-2z M5 4h10v1h-10z M1 5h14v1h-14z M1 6h14v1h-14z M2 7h12v1h-12z M3 8h10v1h-10z M4 9h8v1h-8z M5 10h6v1h-6z M6 11h4v1h-4z M7 12h2v1h-2z" />
                            <path fill="#ffffff" d="M3 3h2v1h-2z M3 4h2v1h-2z" />
                        </svg>
                    </span>
                </span>
            );

        case 'pump':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-svg text-purple-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 3h4v4H7z" />
                            <path d="M11 5h6l3 4v2h-9" />
                            <rect x="7" y="11" width="8" height="10" rx="2" fill="currentColor" fillOpacity="0.25" />
                            <line x1="9" y1="15" x2="13" y2="15" />
                        </svg>
                    </span>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">🥛</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M4 0h4v1h-4z M3 1h1v1h-1z M9 1h1v1h-1z M3 2h1v1h-1z M9 2h4v1h-4z M4 3h2v1h-2z M7 3h2v1h-2z M13 3h1v1h-1z M5 4h1v1h-1z M8 4h1v1h-1z M13 4h1v1h-1z M5 5h1v1h-1z M8 5h5v1h-5z M4 6h1v1h-1z M8 6h1v1h-1z M3 7h1v1h-1z M9 7h1v1h-1z M3 8h1v1h-1z M9 8h1v1h-1z M3 9h1v1h-1z M9 9h1v1h-1z M3 10h1v1h-1z M9 10h1v1h-1z M3 11h1v1h-1z M9 11h1v1h-1z M3 12h1v1h-1z M9 12h1v1h-1z M3 13h1v1h-1z M9 13h1v1h-1z M4 14h5v1h-5z" />
                            <path fill="#a855f7" d="M4 1h1v1h-1z M8 1h1v1h-1z M4 2h1v1h-1z M8 2h1v1h-1z M6 3h1v1h-1z M6 4h1v1h-1z M6 5h1v1h-1z M5 6h3v1h-3z" />
                            <path fill="#c084fc" d="M5 1h3v1h-3z" />
                            <path fill="#ffffff" d="M5 2h3v1h-3z M5 8h3v1h-3z M5 9h3v1h-3z M5 10h3v1h-3z M5 11h3v1h-3z M5 12h3v1h-3z" />
                            <path fill="#38bdf8" d="M9 3h4v1h-4z M7 4h1v1h-1z M9 4h4v1h-4z M7 5h1v1h-1z" />
                            <path fill="#64748b" d="M4 7h5v1h-5z M4 8h1v1h-1z M8 8h1v1h-1z M4 9h1v1h-1z M8 9h1v1h-1z M4 10h1v1h-1z M8 10h1v1h-1z M4 11h1v1h-1z M8 11h1v1h-1z M4 12h1v1h-1z M8 12h1v1h-1z M4 13h5v1h-5z" />
                        </svg>
                    </span>
                </span>
            );

        case 'sleep':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-svg text-indigo-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" fillOpacity="0.25" />
                            <path d="M19 3v4" />
                            <path d="M21 5h-4" />
                        </svg>
                    </span>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">😴</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M6 0h4v1h-4z M4 1h2v1h-2z M10 1h2v1h-2z M13 1h2v1h-2z M3 2h1v1h-1z M12 2h2v1h-2z M15 2h1v1h-1z M2 3h1v1h-1z M7 3h5v1h-5z M13 3h2v1h-2z M1 4h1v1h-1z M6 4h1v1h-1z M1 5h1v1h-1z M6 5h1v1h-1z M1 6h1v1h-1z M6 6h1v1h-1z M13 6h2v1h-2z M1 7h1v1h-1z M6 7h1v1h-1z M12 7h2v1h-2z M15 7h1v1h-1z M1 8h1v1h-1z M6 8h1v1h-1z M13 8h2v1h-2z M1 9h1v1h-1z M6 9h1v1h-1z M2 10h1v1h-1z M7 10h5v1h-5z M3 11h1v1h-1z M12 11h1v1h-1z M4 12h2v1h-2z M10 12h2v1h-2z M6 13h4v1h-4z" />
                            <path fill="#facc15" d="M6 1h4v1h-4z M4 2h8v1h-8z M3 3h4v1h-4z M2 4h4v1h-4z M2 5h4v1h-4z M2 6h4v1h-4z M2 7h4v1h-4z M2 8h4v1h-4z M2 9h4v1h-4z M3 10h4v1h-4z M4 11h8v1h-8z M6 12h4v1h-4z" />
                            <path fill="#ffffff" d="M14 2h1v1h-1z M14 7h1v1h-1z" />
                        </svg>
                    </span>
                </span>
            );

        case 'tummy':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-svg text-emerald-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <ellipse cx="12" cy="13" rx="6" ry="4" fill="currentColor" fillOpacity="0.25" />
                            <circle cx="19" cy="13" r="2.5" />
                            <path d="M8 9l-2-2M16 9l2-2M8 17l-2 2M16 17l2 2" />
                        </svg>
                    </span>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">🐢</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M6 1h4v1h-4z M4 2h2v1h-2z M10 2h2v1h-2z M3 3h1v1h-1z M7 3h2v1h-2z M12 3h1v1h-1z M2 4h1v1h-1z M5 4h2v1h-2z M9 4h2v1h-2z M13 4h1v1h-1z M2 5h1v1h-1z M5 5h2v1h-2z M9 5h2v1h-2z M13 5h1v1h-1z M1 6h1v1h-1z M3 6h2v1h-2z M7 6h2v1h-2z M11 6h2v1h-2z M14 6h1v1h-1z M1 7h1v1h-1z M14 7h1v1h-1z M0 8h4v1h-4z M12 8h4v1h-4z M0 9h1v1h-1z M3 9h1v1h-1z M12 9h1v1h-1z M15 9h1v1h-1z M0 10h4v1h-4z M12 10h4v1h-4z M1 11h1v1h-1z M14 11h1v1h-1z M2 12h1v1h-1z M13 12h1v1h-1z M0 13h2v1h-2z M3 13h2v1h-2z M11 13h2v1h-2z M14 13h2v1h-2z M0 14h1v1h-1z M2 14h1v1h-1z M5 14h6v1h-6z M13 14h1v1h-1z M15 14h1v1h-1z M0 15h2v1h-2z M14 15h2v1h-2z" />
                            <path fill="#22c55e" d="M6 2h4v1h-4z M4 3h3v1h-3z M9 3h3v1h-3z M3 4h2v1h-2z M7 4h2v1h-2z M11 4h2v1h-2z M3 5h2v1h-2z M7 5h2v1h-2z M11 5h2v1h-2z M2 6h1v1h-1z M5 6h2v1h-2z M9 6h2v1h-2z M13 6h1v1h-1z M2 7h12v1h-12z M4 8h8v1h-8z M4 9h8v1h-8z M4 10h8v1h-8z M2 11h12v1h-12z M3 12h10v1h-10z M5 13h6v1h-6z" />
                            <path fill="#86efac" d="M1 9h2v1h-2z M13 9h2v1h-2z M1 14h1v1h-1z M14 14h1v1h-1z" />
                        </svg>
                    </span>
                </span>
            );

        case 'vitamins':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-svg text-teal-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" fill="currentColor" fillOpacity="0.25" />
                            <path d="m8.5 8.5 7 7" />
                        </svg>
                    </span>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">💊</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M7 0h4v1h-4z M5 1h2v1h-2z M11 1h2v1h-2z M4 2h1v1h-1z M13 2h1v1h-1z M3 3h1v1h-1z M14 3h1v1h-1z M2 4h1v1h-1z M15 4h1v1h-1z M2 5h1v1h-1z M15 5h1v1h-1z M1 6h1v1h-1z M15 6h1v1h-1z M1 7h1v1h-1z M15 7h1v1h-1z M1 8h1v1h-1z M15 8h1v1h-1z M1 9h1v1h-1z M15 9h1v1h-1z M2 10h1v1h-1z M13 10h1v1h-1z M3 11h1v1h-1z M12 11h1v1h-1z M4 12h2v1h-2z M10 12h2v1h-2z M6 13h4v1h-4z" />
                            <path fill="#10b981" d="M7 1h4v1h-4z M5 2h8v1h-8z M4 3h2v1h-2z M8 3h6v1h-6z M3 4h2v1h-2z M7 4h6v1h-6z M3 5h6v1h-6z M2 6h6v1h-6z M2 7h4v1h-4z" />
                            <path fill="#ffffff" d="M6 3h2v1h-2z M5 4h2v1h-2z" />
                            <path fill="#f59e0b" d="M13 4h2v1h-2z M9 5h6v1h-6z M8 6h7v1h-7z M6 7h9v1h-9z M2 8h13v1h-13z M2 9h13v1h-13z M3 10h10v1h-10z M4 11h8v1h-8z M6 12h4v1h-4z" />
                        </svg>
                    </span>
                </span>
            );

        case 'solids':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">🥣</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M1 6h14v2h-1z M2 8h12v3h-12z M3 11h10v2h-10z M5 13h6v2h-6z" />
                            <path fill="#ea580c" d="M2 7h12v1h-12z M3 8h10v3h-10z M4 11h8v2h-8z" />
                            <path fill="#fdba74" d="M3 8h10v1h-10z" />
                        </svg>
                    </span>
                </span>
            );

        case 'temp':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">🌡️</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M6 1h4v8h1v3a3 3 0 0 1-6 0v-3h1z" />
                            <path fill="#ef4444" d="M7 2h2v9h-2z M6 11h4v2a2 2 0 0 1-4 0z" />
                            <path fill="#ffffff" d="M7 3h1v6h-1z" />
                        </svg>
                    </span>
                </span>
            );

        case 'growth':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">📏</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M1 4h14v8h-14z" />
                            <path fill="#3b82f6" d="M2 5h12v6h-12z" />
                            <path fill="#ffffff" d="M4 5h1v3h-1z M7 5h1v4h-1z M10 5h1v3h-1z M12 5h1v4h-1z" />
                        </svg>
                    </span>
                </span>
            );

        case 'milestone':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">⭐</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M7 0h2v3h1l2 2h3v2l-2 2 1 3-2 1-3-2-3 2-2-1 1-3-2-2v-2h3l2-2h1z" />
                            <path fill="#fbbf24" d="M7 2h2v2l2 2h2v1l-2 2 1 2-2 1-2-2-2 2-2-1 1-2-2-2v-1h2l2-2z" />
                            <path fill="#fef08a" d="M7 3h2v2h-2z" />
                        </svg>
                    </span>
                </span>
            );

        case 'bath':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">🛁</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M1 6h14v2h-1v5h-12v-5h-1z M2 13h2v2h-2z M12 13h2v2h-2z" />
                            <path fill="#06b6d4" d="M2 7h12v5h-12z" />
                            <path fill="#ffffff" d="M3 7h10v2h-10z" />
                        </svg>
                    </span>
                </span>
            );

        case 'other':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">📝</span>
                    <span className="theme-icon-pixel" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="24" height="24" className="pixel-sprite" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <path fill="#0f172a" d="M3 1h10v14h-10z" />
                            <path fill="#8b5cf6" d="M4 2h8v12h-8z" />
                            <path fill="#ffffff" d="M6 4h4v1h-4z M6 7h4v1h-4z M6 10h4v1h-4z" />
                        </svg>
                    </span>
                </span>
            );

        default:
            return null;
    }
};
