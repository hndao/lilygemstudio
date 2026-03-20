/**
 * Global Error Boundary — catches unhandled errors in the ROOT layout.
 *
 * WHY global-error.tsx: Next.js App Router does NOT wrap the root layout itself
 * in the regular error.tsx boundary. If RootLayout throws (e.g. <head> or <body>
 * level crash), only global-error.tsx catches it. This file MUST define its own
 * <html> and <body> because the root layout is NOT rendered when this fires.
 *
 * WHY CLIENT COMPONENT: Error boundaries require `useEffect` for recovery and
 * `reset()` callback — these are inherently client-side APIs.
 *
 * DESIGN: Matches the 404 page aesthetic — warm, editorial, brand-consistent.
 * No Header/Footer because the root layout (which renders them) has crashed.
 */
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to external error tracking (Sentry, etc.) when available
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Something went wrong | DARIIV</title>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Montserrat:wght@600;700&display=swap');
          
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          
          body {
            font-family: 'Inter', system-ui, sans-serif;
            background: #FDFAF6;
            color: #2D3436;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-font-smoothing: antialiased;
          }
          
          .error-container {
            text-align: center;
            padding: 2rem;
            max-width: 520px;
            animation: fadeIn 0.6s ease-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .error-icon {
            width: 72px;
            height: 72px;
            margin: 0 auto 1.5rem;
            border-radius: 50%;
            background: linear-gradient(135deg, #EAD8C0, #F5EDE0);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 24px rgba(45, 52, 54, 0.08);
          }
          
          .error-icon svg {
            width: 32px;
            height: 32px;
            color: #76885B;
          }

          .error-label {
            font-family: 'Montserrat', system-ui, sans-serif;
            font-size: 0.6875rem;
            font-weight: 600;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #6B7280;
            margin-bottom: 0.75rem;
          }
          
          .error-heading {
            font-family: 'Montserrat', system-ui, sans-serif;
            font-size: clamp(1.5rem, 4vw, 2rem);
            font-weight: 700;
            color: #2D3436;
            line-height: 1.2;
            margin-bottom: 1rem;
          }
          
          .error-body {
            font-size: 1rem;
            line-height: 1.6;
            color: #6B7280;
            margin-bottom: 2rem;
          }
          
          .error-actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
          }
          
          @media (min-width: 480px) {
            .error-actions { flex-direction: row; justify-content: center; }
          }
          
          .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            background: #5C6B45;
            color: #fff;
            font-family: 'Montserrat', system-ui, sans-serif;
            font-size: 0.875rem;
            font-weight: 600;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: background 0.2s ease;
          }
          
          .btn-primary:hover { background: #2D3436; }
          
          .btn-secondary {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            background: transparent;
            color: #2D3436;
            font-family: 'Montserrat', system-ui, sans-serif;
            font-size: 0.875rem;
            font-weight: 600;
            text-decoration: none;
            border: 1px solid #E8D5BE;
            cursor: pointer;
            transition: background 0.2s ease;
          }
          
          .btn-secondary:hover { background: #EAD8C0; }
          
          .divider {
            width: 3rem;
            height: 2px;
            background: #76885B;
            border-radius: 2px;
            margin: 0 auto 1.5rem;
          }
        `}} />
      </head>
      <body>
        <div className="error-container">
          {/* Sage-toned icon */}
          <div className="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>

          <div className="divider" />

          <p className="error-label">Unexpected Error</p>

          <h1 className="error-heading">Oops, Something Went Wrong</h1>

          <p className="error-body">
            We hit an unexpected snag while loading this page.
            Our artisans are looking into it — please try again or head back to safety.
          </p>

          <div className="error-actions">
            <button onClick={() => reset()} className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              Try Again
            </button>
            <a href="/" className="btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
