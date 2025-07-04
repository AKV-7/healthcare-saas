'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (!mounted) return;
    
    try {
      if (isAnchor && href.startsWith('#')) {
        // Handle anchor links
        const element = document.getElementById(href.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          // If element not found and we're not on home page, go to home first
          if (window.location.pathname !== '/') {
            window.location.href = `/${href}`;
          }
        }
      } else {
        // Handle regular navigation
        try {
          router.push(href);
        } catch (error) {
          console.warn('Router.push failed, using fallback:', error);
          window.location.href = href;
        }
      }
    } catch (error) {
      console.warn('Navigation error, using fallback:', error);
      window.location.href = href;
    }
  };

  if (!mounted) {
    // Return regular anchor tag during SSR
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

export default RobustNavLink;
