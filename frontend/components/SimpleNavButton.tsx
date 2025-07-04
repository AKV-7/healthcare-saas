'use client';

import { useState, useEffect } from 'react';

interface SimpleNavButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  isAnchor?: boolean;
}

export function SimpleNavButton({ href, children, className = '', isAnchor = false }: SimpleNavButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    if (!mounted) return;
    
    if (isAnchor && href.startsWith('#')) {
      // Handle anchor links
      const element = document.getElementById(href.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else if (window.location.pathname !== '/') {
        // If element not found and we're not on home page, go to home first
        window.location.href = `/${href}`;
      }
    } else {
      // Handle regular navigation with window.location (most reliable)
      window.location.href = href;
    }
  };

  if (!mounted) {
    // Return a span during SSR to avoid hydration mismatch
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${className} cursor-pointer`}
      style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', textAlign: 'inherit' }}
    >
      {children}
    </button>
  );
}

export default SimpleNavButton;
