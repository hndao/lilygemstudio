'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
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
  submitLabel?: string;
}

function AddressForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = 'Lưu địa chỉ',
}: AddressFormProps) {
  const [form, setForm] = useState<AddressInput>(initial);
  const [formError, setFormError] = useState<string | null>(null);

  function set(key: keyof AddressInput, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.recipient_name.trim()) {
      setFormError('Vui lòng nhập tên người nhận.');
      return;
    }
    if (!form.line1.trim()) {
      setFormError('Vui lòng nhập địa chỉ.');
      return;
    }
    if (!form.city.trim()) {
      setFormError('Vui lòng nhập thành phố.');
      return;
    }
    try {
      await onSubmit(form);
    } catch (err) {
      setFormError((err as Error).message ?? 'Lỗi lưu địa chỉ.');
    }
  }

  const inputCls =
    'h-11 w-full rounded-[10px] border border-(--color-border) bg-white px-4 text-sm outline-none focus:border-(--color-cta) transition-colors';
  const labelCls = 'block text-[12px] font-600 text-(--color-stone) mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      {/* Recipient name */}
      <div>
        <label className={labelCls}>
          Tên người nhận <span className="text-red-500">*</span>
        </label>
        <input
          className={inputCls}
          value={form.recipient_name}
          onChange={(e) => set('recipient_name', e.target.value)}
          placeholder="Nguyễn Thị A"
          autoComplete="name"
        />
      </div>

      {/* Phone */}
      <div>
        <label className={labelCls}>Số điện thoại</label>
        <input
          className={inputCls}
          value={form.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="0901 234 567"
          autoComplete="tel"
          inputMode="tel"
        />
      </div>

      {/* Email */}
      <div>
        <label className={labelCls}>Email</label>
        <input
          className={inputCls}
          type="email"
          value={form.email ?? ''}
          onChange={(e) => set('email', e.target.value)}
          placeholder="email@example.com"
          autoComplete="email"
        />
      </div>

      {/* Line 1 */}
      <div>
        <label className={labelCls}>
          Địa chỉ <span className="text-red-500">*</span>
        </label>
        <input
          className={inputCls}
          value={form.line1}
          onChange={(e) => set('line1', e.target.value)}
          placeholder="Số nhà, tên đường, phường/xã"
          autoComplete="address-line1"
        />
      </div>

      {/* Line 2 */}
      <div>
        <label className={labelCls}>Địa chỉ (tiếp theo)</label>
        <input
          className={inputCls}
          value={form.line2 ?? ''}
          onChange={(e) => set('line2', e.target.value)}
          placeholder="Toà nhà, căn hộ (không bắt buộc)"
          autoComplete="address-line2"
        />
      </div>

      {/* City */}
      <div>
        <label className={labelCls}>
          Thành phố / Tỉnh <span className="text-red-500">*</span>
        </label>
        <input
          className={inputCls}
          value={form.city}
          onChange={(e) => set('city', e.target.value)}
          placeholder="TP. Hồ Chí Minh"
          autoComplete="address-level2"
        />
      </div>

      {/* State / district */}
      <div>
        <label className={labelCls}>Quận / Huyện</label>
        <input
          className={inputCls}
          value={form.state ?? ''}
          onChange={(e) => set('state', e.target.value)}
          placeholder="Quận 1"
          autoComplete="address-level1"
        />
      </div>

      {/* Postal code */}
      <div>
        <label className={labelCls}>Mã bưu chính</label>
        <input
          className={inputCls}
          value={form.postal_code ?? ''}
          onChange={(e) => set('postal_code', e.target.value)}
          placeholder="700000"
          inputMode="numeric"
        />
      </div>

      {/* Country code */}
      <div>
        <label className={labelCls}>
          Quốc gia <span className="text-red-500">*</span>
        </label>
        <input
          className={inputCls}
          value={form.country_code}
          onChange={(e) => set('country_code', e.target.value.toUpperCase())}
          placeholder="VN"
          maxLength={2}
        />
      </div>

      {formError && (
        <p className="text-[12px] text-red-600 bg-red-50 rounded-[8px] px-3 py-2">
          {formError}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-[12px] bg-(--color-cta) px-5 text-sm font-700 text-white hover:bg-(--color-cta-hover) disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Đang lưu...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-11 rounded-[12px] border border-(--color-border) bg-(--color-surface) px-5 text-sm font-600 text-(--color-stone) hover:border-(--color-cta) transition-colors"
        >
          {/* Cancel */}
          Hủy
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
      {/* Address details */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-600 text-sm text-(--color-stone)">
              {address.recipientName}
            </span>
            {address.isDefault && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-600 text-green-700">
                {/* Default */}
                Mặc định
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

      {/* Action buttons */}
      {!isEditOpen && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onEdit}
            className="text-[12px] font-600 text-(--color-cta) hover:text-(--color-cta-hover) transition-colors"
          >
            {/* Edit */}
            Sửa
          </button>
          {!address.isDefault && (
            <>
              <span className="text-(--color-border)">·</span>
              <button
                onClick={onSetDefault}
                className="text-[12px] font-600 text-(--color-stone) hover:text-(--color-cta) transition-colors"
              >
                {/* Set as default */}
                Đặt làm mặc định
              </button>
            </>
          )}
          <span className="text-(--color-border)">·</span>
          <button
            onClick={onDelete}
            className="text-[12px] font-600 text-red-500 hover:text-red-700 transition-colors"
          >
            {/* Delete */}
            Xóa
          </button>
        </div>
      )}

      {/* Inline edit form */}
      {isEditOpen && (
        <div className="border-t border-(--color-border) mt-3">
          <AddressForm
            initial={initial}
            onSubmit={onEditSubmit}
            onCancel={onEditCancel}
            submitting={submitting}
            submitLabel="Cập nhật địa chỉ"
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
      setGlobalError('Không thể tải địa chỉ.');
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!customer) return;
    loadAddresses();
  }, [customer, loadAddresses]);

  // Handle create
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

  // Handle update
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

  // Handle delete with native confirm
  async function handleDelete(id: number) {
    if (!window.confirm('Xóa địa chỉ này?')) return; // Are you sure you want to delete?
    setGlobalError(null);
    try {
      await deleteAddress(id);
      await loadAddresses();
    } catch {
      setGlobalError('Không thể xóa địa chỉ.');
    }
  }

  // Handle set default
  async function handleSetDefault(id: number) {
    setGlobalError(null);
    try {
      await setDefaultAddress(id);
      await loadAddresses();
    } catch {
      setGlobalError('Không thể cập nhật địa chỉ mặc định.');
    }
  }

  if (isLoading || !customer) return null;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-[20px] font-700 text-(--color-stone)">
          Địa chỉ của tôi
        </h1>
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
            className="h-9 rounded-[12px] bg-(--color-cta) px-4 text-[13px] font-700 text-white hover:bg-(--color-cta-hover) transition-colors"
          >
            {/* Add new address */}
            + Thêm địa chỉ mới
          </button>
        )}
      </div>

      {globalError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-[10px] px-4 py-2 mb-4">
          {globalError}
        </p>
      )}

      {/* Add new address inline form */}
      {showAddForm && (
        <div className="rounded-[14px] border border-(--color-cta) bg-(--color-surface) p-5 mb-4">
          <h2 className="font-heading text-[15px] font-700 text-(--color-stone) mb-1">
            {/* Add new address */}
            Thêm địa chỉ mới
          </h2>
          <AddressForm
            initial={EMPTY_FORM}
            onSubmit={handleCreate}
            onCancel={() => setShowAddForm(false)}
            submitting={submitting}
            submitLabel="Thêm địa chỉ"
          />
        </div>
      )}

      {/* Address list */}
      {fetchLoading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 rounded-[14px] bg-(--color-border)" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) py-14 text-center text-sm text-(--color-sand-dark)">
          Chưa có địa chỉ nào. Hãy thêm địa chỉ giao hàng đầu tiên của bạn.
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
