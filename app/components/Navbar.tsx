'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SenateLogo from './SenateLogo';
import { useTheme } from './ThemeProvider';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Admin', href: '/admin' },
  { label: 'Reports', href: '/reports' },
  { label: 'Proposals', href: '/proposals' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-senate-border dark:border-dark-border bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <SenateLogo variant={theme === 'dark' ? 'dark' : 'light'} size="sm" />
          </Link>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-600/10 text-orange-600 dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-senate-border dark:border-dark-border bg-white dark:bg-dark-surface text-gray-500 dark:text-gray-400 transition-all hover:bg-gray-100 dark:hover:bg-dark-card"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 border border-emerald-200 dark:border-emerald-700">
              <span className="pulse-live h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">CRE Connected</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
