'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  isAnchor?: boolean;
}

export function RobustNavLink({ href, children, className = '', isAnchor = false }: NavLinkProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
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
      return;
    }

    // Handle regular navigation
    try {
      router.push(href);
    } catch {
      window.location.href = href;
    }
  }, [mounted, router, href, isAnchor]);

  // Return regular anchor tag during SSR
  if (!mounted) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
