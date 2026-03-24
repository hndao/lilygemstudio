'use client';

/**
 * SpecsBox — collapsible product specs grid.
 *
 * Renders fields with display_position="specs_box" in a 2-column grid
 * matching mockup Section 01:
 *   - Border + rounded container
 *   - Toggle header "Thông số chi tiết" with chevron
 *   - Grid cells: LABEL (11px muted uppercase) / VALUE (15px semibold)
 *   - Odd cells have a right border divider
 *
 * Default state: open on desktop, closed on mobile (set via useEffect after mount
 * to avoid hydration mismatch).
 */

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FieldWithValue, CustomFieldDefinition } from '@/types';

interface SpecsBoxProps {
  fields: FieldWithValue[];
  title: string;
  className?: string;
}

export function SpecsBox({ fields, title, className = '' }: SpecsBoxProps) {
  // Default open; collapse on mobile after mount to avoid hydration mismatch
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 768) setOpen(false);
  }, []);

  if (fields.length === 0) return null;

  return (
    <div className={`overflow-hidden rounded-[12px] border border-(--color-border) ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-black/[0.02]"
        aria-expanded={open}
        aria-controls="specs-body"
      >
        <span className="text-[14px] font-600 text-(--color-stone)">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-(--color-muted) transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id="specs-body" className="grid grid-cols-2">
          {fields.map(({ definition: def, value }, i) => (
            <div
              key={def.name}
              className={[
                'flex flex-col gap-[3px] border-t border-(--color-border) px-4 py-3',
                i % 2 === 0 ? 'border-r border-(--color-border)' : '',
              ].join(' ')}
            >
              <span className="text-[11px] font-500 uppercase tracking-[0.05em] text-(--color-muted)">
                {def.label}
              </span>
              <span className="text-[15px] font-600 text-(--color-stone)">
                {def.type === 'color' && def.hex ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-(--color-border)"
                      style={{ backgroundColor: def.hex }}
                    />
                    {formatSpecValue(def, value)}
                  </span>
                ) : formatSpecValue(def, value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatSpecValue(def: CustomFieldDefinition, value: string | number | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (def.type === 'number' && def.unit) return `${value} ${def.unit}`;
  return String(value);
}
