import React from 'react';

export type IconName =
    | 'pee'
    | 'poop'
    | 'formula'
    | 'breastmilk'
    | 'pump'
    | 'sleep'
    | 'tummy'
    | 'vitamins'
    | 'nursing'
    | 'bottle'
    | 'solids'
    | 'temp'
    | 'growth'
    | 'milestone'
    | 'bath'
    | 'other';

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
                </span>
            );

        case 'solids':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">🥣</span>
                </span>
            );

        case 'temp':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">🌡️</span>
                </span>
            );

        case 'growth':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">📏</span>
                </span>
            );

        case 'milestone':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">⭐</span>
                </span>
            );

        case 'bath':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">🛁</span>
                </span>
            );

        case 'other':
            return (
                <span className={`inline-flex items-center justify-center ${className}`} style={style}>
                    <span className="theme-icon-emoji text-2xl" aria-hidden="true">📝</span>
                </span>
            );

        default:
            return null;
    }
};
