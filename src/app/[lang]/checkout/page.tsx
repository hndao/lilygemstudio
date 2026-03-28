'use client';

/**
 * Checkout — 3-step wizard
 *
 * Step 1: Contact & Shipping Address
 * Step 2: Delivery Method
 * Step 3: Review & Pay (COD | Bank Transfer)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Lock,
  MapPin,
  Package,
  Truck,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { calculateShipping, checkout, getAddresses } from '@/lib/commerceApi';
import { getToken } from '@/lib/auth';
import type { Address, AddressInput, CheckoutPayload, Order, ShippingRate } from '@/types';

// ── Price helpers ──────────────────────────────────────────────────────────────

function fmtVnd(cents: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(cents);
}
function fmtUsd(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
function formatPrice(cents: number, isVn: boolean) {
  return isVn ? fmtVnd(cents) : fmtUsd(cents);
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Liên hệ', icon: MapPin },
  { label: 'Vận chuyển', icon: Truck },
  { label: 'Thanh toán', icon: Package },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done    = i < current;
        const active  = i === current;
        const pending = i > current;
        return (
          <div key={step.label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-[13px] font-700 transition-all duration-300',
                  done    ? 'border-(--color-cta) bg-(--color-cta) text-white'
                  : active ? 'border-(--color-cta) bg-white text-(--color-cta)'
                  :          'border-(--color-border) bg-white text-(--color-sand-dark)',
                ].join(' ')}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={[
                  'text-[11px] font-500 whitespace-nowrap',
                  active ? 'text-(--color-cta)' : 'text-(--color-sand-dark)',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'mb-4 mx-2 h-[2px] w-12 rounded-full transition-all duration-500',
                  i < current ? 'bg-(--color-cta)' : 'bg-(--color-border)',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Form field helper ──────────────────────────────────────────────────────────

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
function Field({ label, error, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-500 text-(--color-stone-light)">
        {label}{props.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        {...props}
        className={[
          'h-12 rounded-[10px] border px-4 text-[15px] text-(--color-stone) outline-none transition-colors bg-white',
          'placeholder:text-(--color-border)',
          error
            ? 'border-red-400 focus:border-red-400'
            : 'border-(--color-border) focus:border-(--color-cta)',
          props.className ?? '',
        ].join(' ')}
      />
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function ShippingSkeletons() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[72px] animate-pulse rounded-[12px] bg-(--color-border)/50" />
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

interface AddressFormValues {
  recipientName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}

type FieldErrors = Partial<Record<keyof AddressFormValues, string>>;

const EMPTY_FORM: AddressFormValues = {
  recipientName: '', email: '', phone: '',
  line1: '', line2: '', city: '', state: '', postalCode: '', countryCode: 'VN',
};

export default function CheckoutPage() {
  const router   = useRouter();
  const pathname = usePathname();
  const lang     = pathname.split('/')[1] ?? 'vi';
  const isVn     = lang === 'vi';

  const { cart, closeCart } = useCart();

  // Close cart drawer if open when entering checkout
  useEffect(() => { closeCart(); }, [closeCart]);

  const [step, setStep]                   = useState(0);
  const [form, setForm]                   = useState<AddressFormValues>(EMPTY_FORM);
  const [errors, setErrors]               = useState<FieldErrors>({});
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [ratesLoading, setRatesLoading]   = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');
  const [placing, setPlacing]             = useState(false);
  const [placeError, setPlaceError]       = useState('');

  const formRef = useRef<HTMLDivElement>(null);

  // ── Load saved addresses if authed ──────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) return;
    getAddresses().then((addrs) => {
      if (addrs.length > 0) {
        setSavedAddresses(addrs);
        setShowAddressSelector(true);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        applyAddress(def);
        setSelectedAddressId(def.id);
      }
    }).catch(() => {});
  }, []);

  function applyAddress(addr: Address) {
    setForm({
      recipientName: addr.recipientName,
      email: addr.email ?? form.email,
      phone: addr.phone ?? '',
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state ?? '',
      postalCode: addr.postalCode ?? '',
      countryCode: addr.countryCode,
    });
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep1(): FieldErrors {
    const e: FieldErrors = {};
    if (!form.recipientName.trim()) e.recipientName = 'Vui lòng nhập họ tên';
    if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    if (!form.line1.trim()) e.line1 = 'Vui lòng nhập địa chỉ';
    if (!form.city.trim()) e.city = 'Vui lòng nhập thành phố';
    if (!form.countryCode.trim()) e.countryCode = 'Vui lòng chọn quốc gia';
    return e;
  }

  const hasOutOfStock = cart?.items.some((i) => i.outOfStock) ?? false;

  // ── Step 1 submit ───────────────────────────────────────────────────────────
  const handleStep1Continue = useCallback(() => {
    if (hasOutOfStock) return;
    const e = validateStep1();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      // Scroll to first error
      const firstKey = Object.keys(e)[0] as keyof AddressFormValues;
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstKey}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [form, hasOutOfStock]);

  // ── Fetch shipping rates on step 2 ──────────────────────────────────────────
  useEffect(() => {
    if (step !== 1 || !cart) return;
    setRatesLoading(true);
    calculateShipping(form.countryCode, cart.subtotalCents)
      .then((rates) => {
        setShippingRates(rates);
        if (rates.length > 0) setSelectedRateId(rates[0].id);
      })
      .catch(() => setShippingRates([]))
      .finally(() => setRatesLoading(false));
  }, [step, form.countryCode, cart]);

  // ── Step 2 submit ───────────────────────────────────────────────────────────
  const handleStep2Continue = useCallback(() => {
    if (selectedRateId === null) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedRateId]);

  // ── Place order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = useCallback(async () => {
    if (selectedRateId === null) return;
    // selectedRateId === -1 means "contact us" fallback with 0 shipping
    const selectedRate = shippingRates.find((r) => r.id === selectedRateId);

    setPlacing(true);
    setPlaceError('');

    const shippingAddress: AddressInput = {
      recipient_name: form.recipientName,
      phone: form.phone,
      email: form.email || undefined,
      line1: form.line1,
      line2: form.line2 || undefined,
      city: form.city,
      state: form.state || undefined,
      postal_code: form.postalCode || undefined,
      country_code: form.countryCode,
    };

    const payload: CheckoutPayload = {
      currency: isVn ? 'VND' : 'USD',
      shipping_rate_cents: selectedRate?.rateCents ?? 0,
      shipping_address: shippingAddress,
      notes: paymentMethod === 'cod'
        ? 'Thanh toán khi nhận hàng (COD)'
        : 'Chuyển khoản ngân hàng',
    };

    try {
      const order: Order = await checkout(payload);
      // Cache in sessionStorage so the success page can display the order
      // immediately without an API round-trip. This is the only reliable path
      // for guest orders (no customer_id → API's auth-protected endpoint returns 404).
      sessionStorage.setItem('lily_last_order', JSON.stringify(order));
      router.push(`/${lang}/checkout/success?order=${order.orderNumber}`);
    } catch (e: unknown) {
      setPlaceError(e instanceof Error ? e.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setPlacing(false);
    }
  }, [form, paymentMethod, selectedRateId, shippingRates, isVn, lang, router]);

  // ── Computed totals ─────────────────────────────────────────────────────────
  const subtotal     = isVn ? (cart?.subtotalCentsVnd ?? 0) : (cart?.subtotalCents ?? 0);
  const discountAmt  = cart?.coupon?.discountCents ?? 0;
  const selectedRate = shippingRates.find((r) => r.id === selectedRateId);
  const shippingAmt  = selectedRate?.rateCents ?? 0;
  const total        = subtotal - discountAmt + shippingAmt;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-(--color-background) px-4 py-8 pb-[max(32px,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg">

        {/* Logo */}
        <div className="mb-6 text-center">
          <span className="font-heading text-lg font-700 text-(--color-stone) tracking-tight">
            🌸 LilyGem
          </span>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* ── STEP 1: Contact & Shipping ────────────────────────────── */}
        {step === 0 && (
          <div ref={formRef} className="flex flex-col gap-5">
            <h1 className="font-heading text-[20px] font-700 text-(--color-stone)">
              Thông tin giao hàng
            </h1>

            {/* Saved address selector */}
            {showAddressSelector && savedAddresses.length > 0 && (
              <div className="rounded-[12px] border border-(--color-border) bg-white p-4">
                <p className="text-[13px] font-600 text-(--color-stone) mb-2">Địa chỉ đã lưu</p>
                <div className="flex flex-col gap-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => { applyAddress(addr); setSelectedAddressId(addr.id); }}
                      className={[
                        'flex items-start gap-3 rounded-[10px] border-[1.5px] px-3 py-2.5 text-left transition-all',
                        selectedAddressId === addr.id
                          ? 'border-(--color-cta) bg-(--color-quartz-mist)'
                          : 'border-(--color-border)',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center',
                          selectedAddressId === addr.id ? 'border-(--color-cta)' : 'border-(--color-border)',
                        ].join(' ')}
                      >
                        {selectedAddressId === addr.id && (
                          <div className="h-2 w-2 rounded-full bg-(--color-cta)" />
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-600 text-(--color-stone)">{addr.recipientName}</p>
                        <p className="text-[12px] text-(--color-sand-dark)">
                          {addr.line1}, {addr.city}
                        </p>
                      </div>
                      {addr.isDefault && (
                        <span className="ml-auto shrink-0 rounded-full bg-(--color-quartz-mist) px-2 py-0.5 text-[10px] font-600 text-(--color-cta)">
                          Mặc định
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setSelectedAddressId(null); setForm(EMPTY_FORM); }}
                    className="text-[13px] text-(--color-cta) underline text-left"
                  >
                    + Dùng địa chỉ mới
                  </button>
                </div>
              </div>
            )}

            <Field
              label="Họ và tên"
              name="recipientName"
              value={form.recipientName}
              onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
              onBlur={() => form.recipientName.trim() || setErrors((e) => ({ ...e, recipientName: 'Vui lòng nhập họ tên' }))}
              error={errors.recipientName}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              required
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label="Số điện thoại"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                onBlur={() => form.phone.trim() || setErrors((e) => ({ ...e, phone: 'Vui lòng nhập số điện thoại' }))}
                error={errors.phone}
                placeholder="0912 345 678"
                autoComplete="tel"
                required
              />
              <Field
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onBlur={() => form.email.trim() && !/\S+@\S+\.\S+/.test(form.email) && setErrors((e) => ({ ...e, email: 'Email không hợp lệ' }))}
                error={errors.email}
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>

            <Field
              label="Địa chỉ"
              name="line1"
              value={form.line1}
              onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
              onBlur={() => form.line1.trim() || setErrors((e) => ({ ...e, line1: 'Vui lòng nhập địa chỉ' }))}
              error={errors.line1}
              placeholder="Số nhà, tên đường"
              autoComplete="address-line1"
              required
            />

            <Field
              label="Căn hộ / Tòa nhà"
              name="line2"
              value={form.line2}
              onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
              placeholder="Tầng, tòa nhà (không bắt buộc)"
              autoComplete="address-line2"
            />

            <div className="grid grid-cols-2 gap-5">
              <Field
                label="Thành phố"
                name="city"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                onBlur={() => form.city.trim() || setErrors((e) => ({ ...e, city: 'Vui lòng nhập thành phố' }))}
                error={errors.city}
                placeholder="TP. Hồ Chí Minh"
                autoComplete="address-level2"
                required
              />
              <Field
                label="Tỉnh / Bang"
                name="state"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                placeholder="Tùy chọn"
                autoComplete="address-level1"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Field
                label="Mã bưu chính"
                name="postalCode"
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                placeholder="70000"
                autoComplete="postal-code"
              />
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-500 text-(--color-stone-light)">
                  Quốc gia <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="countryCode"
                    value={form.countryCode}
                    onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
                    autoComplete="country"
                    className="h-12 w-full appearance-none rounded-[10px] border border-(--color-border) bg-white px-4 pr-10 text-[15px] text-(--color-stone) outline-none focus:border-(--color-cta)"
                  >
                    <option value="VN">Việt Nam</option>
                    <option value="US">United States</option>
                    <option value="SG">Singapore</option>
                    <option value="AU">Australia</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-sand-dark)" />
                </div>
              </div>
            </div>

            {hasOutOfStock && (
              <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
                Một số sản phẩm trong giỏ hàng đã hết hàng. Vui lòng quay lại giỏ hàng và xoá chúng trước khi tiếp tục.
              </div>
            )}

            <button
              type="button"
              onClick={handleStep1Continue}
              disabled={hasOutOfStock}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-(--color-cta) font-heading text-[15px] font-700 text-white transition-all hover:bg-(--color-cta-hover) active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp tục <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Delivery Method ───────────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-heading text-[20px] font-700 text-(--color-stone)">
                Phương thức vận chuyển
              </h1>
              <p className="mt-1 text-[13px] text-(--color-sand-dark)">
                Giao đến: {form.city}, {form.countryCode}
              </p>
            </div>

            {ratesLoading ? (
              <ShippingSkeletons />
            ) : shippingRates.length === 0 ? (
              /* No rates configured — offer a free "will arrange" fallback so checkout isn't blocked */
              <button
                type="button"
                onClick={() => setSelectedRateId(-1)}
                className={[
                  'flex w-full items-center gap-4 rounded-[12px] border-[1.5px] p-4 text-left transition-all',
                  selectedRateId === -1
                    ? 'border-(--color-cta) bg-(--color-quartz-mist)'
                    : 'border-(--color-border) bg-white hover:border-(--color-cta)/50',
                ].join(' ')}
              >
                <div className={[
                  'h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center',
                  selectedRateId === -1 ? 'border-(--color-cta)' : 'border-(--color-border)',
                ].join(' ')}>
                  {selectedRateId === -1 && <div className="h-2.5 w-2.5 rounded-full bg-(--color-cta)" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-(--color-sand-dark)" />
                    <span className="text-[14px] font-600 text-(--color-stone)">Giao hàng tiêu chuẩn</span>
                  </div>
                  <p className="text-[12px] text-(--color-sand-dark)">Phí vận chuyển sẽ được xác nhận qua Zalo / email</p>
                </div>
                <span className="text-[14px] font-700 text-(--color-sand-dark)">Liên hệ</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {shippingRates.map((rate) => {
                  const selected = selectedRateId === rate.id;
                  const isFree = rate.rateCents === 0;
                  return (
                    <button
                      key={rate.id}
                      type="button"
                      onClick={() => setSelectedRateId(rate.id)}
                      className={[
                        'flex w-full items-center gap-4 rounded-[12px] border-[1.5px] p-4 text-left transition-all',
                        selected
                          ? 'border-(--color-cta) bg-(--color-quartz-mist)'
                          : 'border-(--color-border) bg-white hover:border-(--color-cta)/50',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center',
                          selected ? 'border-(--color-cta)' : 'border-(--color-border)',
                        ].join(' ')}
                      >
                        {selected && <div className="h-2.5 w-2.5 rounded-full bg-(--color-cta)" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-600 text-(--color-stone)">{rate.name}</span>
                          {isFree && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-700 text-green-700">
                              Miễn phí
                            </span>
                          )}
                        </div>
                        {(rate.estimatedDaysMin || rate.estimatedDaysMax) && (
                          <p className="text-[12px] text-(--color-sand-dark)">
                            {rate.estimatedDaysMin}–{rate.estimatedDaysMax} ngày làm việc
                          </p>
                        )}
                      </div>
                      <span className="text-[14px] font-700 text-(--color-cta)">
                        {isFree ? 'Miễn phí' : formatPrice(rate.rateCents, isVn)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] border border-(--color-border) text-[14px] font-600 text-(--color-stone) hover:bg-(--color-quartz-mist)"
              >
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </button>
              <button
                type="button"
                onClick={handleStep2Continue}
                disabled={selectedRateId === null || ratesLoading}
                className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-[12px] bg-(--color-cta) font-heading text-[15px] font-700 text-white transition-all hover:bg-(--color-cta-hover) disabled:opacity-50"
              >
                Tiếp tục <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Pay ──────────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h1 className="font-heading text-[20px] font-700 text-(--color-stone)">
              Xem lại & thanh toán
            </h1>

            {/* Order summary */}
            <div className="rounded-[16px] border border-(--color-border) bg-white overflow-hidden">
              <div className="border-b border-(--color-border) px-4 py-3">
                <p className="font-heading text-[14px] font-700 text-(--color-stone)">
                  Đơn hàng ({cart?.items.length ?? 0} sản phẩm)
                </p>
              </div>
              <div className="divide-y divide-(--color-border)">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[8px] bg-(--color-quartz-mist)">
                      {(item.selectedOptions?.['_image_src'] ?? item.listing.coverImage?.src) && (
                        <Image
                          src={item.selectedOptions?.['_image_src'] ?? item.listing.coverImage!.src}
                          alt={item.listing.resolvedTitle}
                          fill sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-1 text-[13px] font-600 text-(--color-stone)">
                        {item.listing.resolvedTitle}
                      </p>
                      <p className="text-[12px] text-(--color-sand-dark)">
                        × {item.quantity}
                        {Object.entries(item.selectedOptions ?? {})
                          .filter(([k]) => !k.startsWith('_'))
                          .map(([k, v]) => ` · ${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
                          .join('')}
                      </p>
                    </div>
                    <span className="text-[13px] font-700 text-(--color-stone)">
                      {item.priceSnapshotCentsVnd && isVn
                        ? fmtVnd(item.priceSnapshotCentsVnd * item.quantity)
                        : item.priceSnapshotCents
                        ? fmtUsd((item.priceSnapshotCents * item.quantity))
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-(--color-border) px-4 py-3 text-[13px]">
                <div className="flex justify-between text-(--color-sand-dark)">
                  <span>Tạm tính</span>
                  <span className="font-600 text-(--color-stone)">{formatPrice(subtotal, isVn)}</span>
                </div>
                <div className="flex justify-between text-(--color-sand-dark)">
                  <span>Phí vận chuyển</span>
                  <span className="font-600 text-(--color-stone)">
                    {shippingAmt === 0 ? 'Miễn phí' : formatPrice(shippingAmt, isVn)}
                  </span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({cart?.coupon?.code})</span>
                    <span className="font-600">−{formatPrice(discountAmt, isVn)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-(--color-border) pt-2 text-[15px] font-700 text-(--color-stone)">
                  <span>Tổng cộng</span>
                  <span className="text-(--color-cta)">{formatPrice(total, isVn)}</span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="font-heading text-[15px] font-700 text-(--color-stone) mb-3">
                Phương thức thanh toán
              </p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    id: 'cod' as const,
                    title: 'Thanh toán khi nhận hàng (COD)',
                    description: 'Trả tiền mặt khi nhận được hàng.',
                    icon: '📦',
                  },
                  {
                    id: 'bank_transfer' as const,
                    title: 'Chuyển khoản ngân hàng',
                    description: 'Hướng dẫn chuyển khoản sẽ hiển thị sau khi đặt hàng.',
                    icon: '🏦',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={[
                      'flex items-start gap-4 rounded-[12px] border-[1.5px] p-4 text-left transition-all',
                      paymentMethod === opt.id
                        ? 'border-(--color-cta) bg-(--color-quartz-mist)'
                        : 'border-(--color-border) bg-white hover:border-(--color-cta)/50',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center',
                        paymentMethod === opt.id ? 'border-(--color-cta)' : 'border-(--color-border)',
                      ].join(' ')}
                    >
                      {paymentMethod === opt.id && (
                        <div className="h-2.5 w-2.5 rounded-full bg-(--color-cta)" />
                      )}
                    </div>
                    <div>
                      <p className="text-[14px] font-600 text-(--color-stone)">
                        {opt.icon} {opt.title}
                      </p>
                      <p className="mt-0.5 text-[12px] text-(--color-sand-dark)">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {placeError && (
              <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
                {placeError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] border border-(--color-border) text-[14px] font-600 text-(--color-stone) hover:bg-(--color-quartz-mist)"
              >
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-[12px] bg-(--color-cta) font-heading text-[15px] font-700 text-white transition-all hover:bg-(--color-cta-hover) active:scale-[0.98] disabled:opacity-60"
              >
                {placing ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Đặt hàng
                  </>
                )}
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-3 text-[11px] text-(--color-sand-dark)">
              <span>🔒 Bảo mật SSL</span>
              <span>·</span>
              <span>📦 Đổi trả 7 ngày</span>
              <span>·</span>
              <span>💳 Thanh toán an toàn</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
