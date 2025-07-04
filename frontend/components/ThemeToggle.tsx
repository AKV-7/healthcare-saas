'use client';

import { useTheme } from '@/components/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="group relative flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-50 to-rose-100 p-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-rose-100 hover:to-rose-200 hover:shadow-md dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-400/10 to-amber-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {theme === 'light' ? (
        // Moon icon for dark mode
        <svg
          className="size-5 rotate-0 text-rose-600 transition-all duration-300 dark:rotate-180 dark:text-rose-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg
          className="size-5 rotate-0 text-rose-600 transition-all duration-300 dark:rotate-180 dark:text-rose-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}

      <span className="sr-only">
        {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      </span>
    </button>
  );
}
