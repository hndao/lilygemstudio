'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDict } from '@/context/DictionaryContext';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/lib/commerceApi';
import type { Address, AddressInput } from '@/types';

// ── Empty address form values ──────────────────────────────────────────────────

const EMPTY_FORM: AddressInput = {
  recipient_name: '',
  phone: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country_code: 'VN',
  label: '',
  is_default: false,
};

// ── Address form ───────────────────────────────────────────────────────────────

interface AddressFormProps {
  initial: AddressInput;
  onSubmit: (data: AddressInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}

function AddressForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: AddressFormProps) {
  const dict = useDict();
  const a = dict.account;
  const [form, setForm] = useState<AddressInput>(initial);
  const [formError, setFormError] = useState<string | null>(null);

  function set(key: keyof AddressInput, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.recipient_name.trim()) {
      setFormError(a.valid_recipient_name);
      return;
    }
    if (!form.line1.trim()) {
      setFormError(a.valid_address_line1);
      return;
    }
    if (!form.city.trim()) {
      setFormError(a.valid_city);
      return;
    }
    try {
      await onSubmit(form);
    } catch (err) {
      setFormError((err as Error).message ?? a.err_save_address);
    }
  }

  const inputCls =
    'h-11 w-full rounded-[10px] border border-(--color-border) bg-white px-4 text-sm outline-none focus:border-(--color-cta) transition-colors';
  const labelCls = 'block text-[12px] font-600 text-(--color-stone) mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div>
        <label className={labelCls}>
          {a.field_recipient_name} <span className="text-red-500">*</span>
        </label>
        <input
          className={inputCls}
          value={form.recipient_name}
          onChange={(e) => set('recipient_name', e.target.value)}
          autoComplete="name"
        />
      </div>

      <div>
        <label className={labelCls}>{a.field_phone}</label>
        <input
          className={inputCls}
          value={form.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
          autoComplete="tel"
          inputMode="tel"
        />
      </div>

      <div>
        <label className={labelCls}>{dict.auth.email}</label>
        <input
          className={inputCls}
          type="email"
          value={form.email ?? ''}
          onChange={(e) => set('email', e.target.value)}
          autoComplete="email"
        />
      </div>

      <div>
        <label className={labelCls}>
          {a.field_address_line1} <span className="text-red-500">*</span>
        </label>
        <input
          className={inputCls}
          value={form.line1}
          onChange={(e) => set('line1', e.target.value)}
          autoComplete="address-line1"
        />
      </div>

      <div>
        <label className={labelCls}>{a.field_address_line2}</label>
        <input
          className={inputCls}
          value={form.line2 ?? ''}
          onChange={(e) => set('line2', e.target.value)}
          autoComplete="address-line2"
        />
      </div>

      <div>
        <label className={labelCls}>
          {a.field_city} <span className="text-red-500">*</span>
        </label>
        <input
          className={inputCls}
          value={form.city}
          onChange={(e) => set('city', e.target.value)}
          autoComplete="address-level2"
        />
      </div>

      <div>
        <label className={labelCls}>{a.field_district}</label>
        <input
          className={inputCls}
          value={form.state ?? ''}
          onChange={(e) => set('state', e.target.value)}
          autoComplete="address-level1"
        />
      </div>

      <div>
        <label className={labelCls}>{a.field_postal_code}</label>
        <input
          className={inputCls}
          value={form.postal_code ?? ''}
          onChange={(e) => set('postal_code', e.target.value)}
          inputMode="numeric"
        />
      </div>

      <div>
        <label className={labelCls}>
          {a.field_country} <span className="text-red-500">*</span>
        </label>
        <input
          className={inputCls}
          value={form.country_code}
          onChange={(e) => set('country_code', e.target.value.toUpperCase())}
          maxLength={2}
        />
      </div>

      {formError && (
        <p className="text-[12px] text-red-600 bg-red-50 rounded-[8px] px-3 py-2">
          {formError}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-[12px] bg-(--color-cta) px-5 text-sm font-700 text-white hover:bg-(--color-cta-hover) disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? a.saving : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-11 rounded-[12px] border border-(--color-border) bg-(--color-surface) px-5 text-sm font-600 text-(--color-stone) hover:border-(--color-cta) transition-colors"
        >
          {a.cancel}
        </button>
      </div>
    </form>
  );
}

// ── Address card ───────────────────────────────────────────────────────────────

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isEditOpen: boolean;
  onEditSubmit: (data: AddressInput) => Promise<void>;
  onEditCancel: () => void;
  submitting: boolean;
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isEditOpen,
  onEditSubmit,
  onEditCancel,
  submitting,
}: AddressCardProps) {
  const dict = useDict();
  const a = dict.account;

  const initial: AddressInput = {
    recipient_name: address.recipientName,
    phone: address.phone ?? '',
    email: address.email ?? '',
    line1: address.line1,
    line2: address.line2 ?? '',
    city: address.city,
    state: address.state ?? '',
    postal_code: address.postalCode ?? '',
    country_code: address.countryCode,
    label: address.label ?? '',
  };

  return (
    <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-600 text-sm text-(--color-stone)">
              {address.recipientName}
            </span>
            {address.isDefault && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-600 text-green-700">
                {a.default_address}
              </span>
            )}
            {address.label && (
              <span className="rounded-full bg-(--color-quartz-mist) px-2 py-0.5 text-[11px] text-(--color-stone)">
                {address.label}
              </span>
            )}
          </div>
          {address.phone && (
            <p className="text-sm text-(--color-sand-dark)">{address.phone}</p>
          )}
          <p className="text-sm text-(--color-stone)">{address.line1}</p>
          {address.line2 && (
            <p className="text-sm text-(--color-stone)">{address.line2}</p>
          )}
          <p className="text-sm text-(--color-stone)">
            {[address.city, address.state].filter(Boolean).join(', ')}
          </p>
          <p className="text-sm text-(--color-sand-dark)">{address.countryCode}</p>
        </div>
      </div>

      {!isEditOpen && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onEdit}
            className="text-[12px] font-600 text-(--color-cta) hover:text-(--color-cta-hover) transition-colors"
          >
            {a.edit}
          </button>
          {!address.isDefault && (
            <>
              <span className="text-(--color-border)">·</span>
              <button
                onClick={onSetDefault}
                className="text-[12px] font-600 text-(--color-stone) hover:text-(--color-cta) transition-colors"
              >
                {a.set_default}
              </button>
            </>
          )}
          <span className="text-(--color-border)">·</span>
          <button
            onClick={onDelete}
            className="text-[12px] font-600 text-red-500 hover:text-red-700 transition-colors"
          >
            {a.delete}
          </button>
        </div>
      )}

      {isEditOpen && (
        <div className="border-t border-(--color-border) mt-3">
          <AddressForm
            initial={initial}
            onSubmit={onEditSubmit}
            onCancel={onEditCancel}
            submitting={submitting}
            submitLabel={a.update_address_btn}
          />
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AddressesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] ?? 'vi';
  const dict = useDict();
  const a = dict.account;

  const { customer, isLoading } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !customer) {
      router.replace(`/${lang}/auth`);
    }
  }, [isLoading, customer, router, lang]);

  const loadAddresses = useCallback(async () => {
    setFetchLoading(true);
    try {
      const res = await getAddresses();
      setAddresses(res);
    } catch {
      setGlobalError(a.err_load_addresses);
    } finally {
      setFetchLoading(false);
    }
  }, [a.err_load_addresses]);

  useEffect(() => {
    if (!customer) return;
    loadAddresses();
  }, [customer, loadAddresses]);

  async function handleCreate(data: AddressInput) {
    setSubmitting(true);
    setGlobalError(null);
    try {
      await createAddress(data);
      setShowAddForm(false);
      await loadAddresses();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id: number, data: AddressInput) {
    setSubmitting(true);
    setGlobalError(null);
    try {
      await updateAddress(id, data);
      setEditingId(null);
      await loadAddresses();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm(a.confirm_delete_address)) return;
    setGlobalError(null);
    try {
      await deleteAddress(id);
      await loadAddresses();
    } catch {
      setGlobalError(a.err_delete_address);
    }
  }

  async function handleSetDefault(id: number) {
    setGlobalError(null);
    try {
      await setDefaultAddress(id);
      await loadAddresses();
    } catch {
      setGlobalError(a.err_set_default_address);
    }
  }

  if (isLoading || !customer) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-[20px] font-700 text-(--color-stone)">
          {a.my_addresses_title}
        </h1>
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
            className="h-9 rounded-[12px] bg-(--color-cta) px-4 text-[13px] font-700 text-white hover:bg-(--color-cta-hover) transition-colors"
          >
            {a.add_new_address_btn}
          </button>
        )}
      </div>

      {globalError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-[10px] px-4 py-2 mb-4">
          {globalError}
        </p>
      )}

      {showAddForm && (
        <div className="rounded-[14px] border border-(--color-cta) bg-(--color-surface) p-5 mb-4">
          <h2 className="font-heading text-[15px] font-700 text-(--color-stone) mb-1">
            {a.add_address_heading}
          </h2>
          <AddressForm
            initial={EMPTY_FORM}
            onSubmit={handleCreate}
            onCancel={() => setShowAddForm(false)}
            submitting={submitting}
            submitLabel={a.add_address_btn}
          />
        </div>
      )}

      {fetchLoading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 rounded-[14px] bg-(--color-border)" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) py-14 text-center text-sm text-(--color-sand-dark)">
          {a.no_addresses_hint}
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((addr) => (
            <li key={addr.id}>
              <AddressCard
                address={addr}
                isEditOpen={editingId === addr.id}
                submitting={submitting}
                onEdit={() => {
                  setEditingId(addr.id);
                  setShowAddForm(false);
                }}
                onEditCancel={() => setEditingId(null)}
                onEditSubmit={(data) => handleUpdate(addr.id, data)}
                onDelete={() => handleDelete(addr.id)}
                onSetDefault={() => handleSetDefault(addr.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
