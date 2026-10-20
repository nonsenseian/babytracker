import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppTheme } from '../types/state';

interface ThemeContextType {
    theme: AppTheme;
    setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'simple-daylight',
    setTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<AppTheme>(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlTheme = params.get('theme') as AppTheme;
            if (urlTheme) return urlTheme;
        } catch (e) {}
        const saved = localStorage.getItem('bt_app_theme');
        return (saved as AppTheme) || 'simple-daylight';
    });

    const setTheme = (newTheme: AppTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('bt_app_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
