import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CalendarDays, CarFront, Check, ChevronDown, CircleAlert,
  Clock3, LogOut, MapPin, ShieldCheck, UserRound,
} from 'lucide-react';
import {
  getGetAvailableVehiclesQueryKey, getGetCustomerAccountSessionQueryKey,
  getGetMyBookingsQueryKey, useCancelMyBooking, useCreateMyBooking,
  useCustomerLogin, useCustomerLogout, useGetAvailableVehicles,
  useGetCustomerAccountSession, useGetMyBookings, useRegisterCustomer,
} from '@workspace/api-client-react';
import type { Booking, CustomerAccountSession, Vehicle } from '@workspace/api-client-react';
import './customer-portal.css';

const money = (value: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(value);
const dateLabel = (value: string | null | undefined) => value
  ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Not returned yet';
const messageFor = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
const safeReturnPath = (path: string | null) => path?.startsWith('/') && !path.startsWith('//') ? path : '/my-rentals';

function Brand() {
  return <Link to="/" className="cp-brand" aria-label="Roadhouse home"><span className="cp-brand-mark"><i /></span><span><b>ROADHOUSE</b><small>LOCAL RENTALS, WELL RUN</small></span></Link>;
}

function CustomerHeader({ name, onLogout, loggingOut }: { name?: string; onLogout?: () => void; loggingOut?: boolean }) {
  return <header className="cp-header"><div className="cp-header-inner">
    <Brand />
    <nav className="cp-nav" aria-label="Customer navigation">
      <Link to="/#available">Browse vehicles</Link>
      <Link to="/my-rentals">My rentals</Link>
      <Link to="/rent" className="cp-nav-cta">Reserve a vehicle <ArrowRight size={15} /></Link>
    </nav>
    {name && <div className="cp-header-account"><span className="cp-user-dot"><UserRound size={15} /></span><span className="cp-header-name">{name}</span><button type="button" onClick={onLogout} disabled={loggingOut} aria-label="Sign out" title="Sign out" className="cp-logout"><LogOut size={16} /></button></div>}
  </div></header>;
}

function PageFooter() {
  return <footer className="cp-footer"><span>ROADHOUSE / CUSTOMER PORTAL</span><span>Clear rates. Ready for the road.</span></footer>;
}

function PortalFrame({ children, name, onLogout, loggingOut }: { children: ReactNode; name?: string; onLogout?: () => void; loggingOut?: boolean }) {
  return <div className="customer-portal"><div className="cp-topline"><span><ShieldCheck size={13} /> Your bookings, in one secure place</span><span>FLEET-OFFICE MANAGED</span></div><CustomerHeader name={name} onLogout={onLogout} loggingOut={loggingOut} />{children}<PageFooter /></div>;
}

function LoadingState({ label = 'Loading your account' }: { label?: string }) {
  return <div className="cp-state-card" aria-label={label} role="status"><div className="cp-skeleton cp-skeleton-heading" /><div className="cp-skeleton cp-skeleton-copy" /><div className="cp-skeleton cp-skeleton-row" /><div className="cp-skeleton cp-skeleton-row" /></div>;
}

function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  return <div className="cp-state-card cp-error-state" role="alert"><span className="cp-state-icon"><CircleAlert size={20} /></span><h2>We couldn’t load this view.</h2><p>{messageFor(error)}</p><button type="button" className="cp-button cp-button-secondary" onClick={retry}>Try again <ArrowRight size={15} /></button></div>;
}

function useCustomerSession() {
  return useGetCustomerAccountSession({ query: { queryKey: getGetCustomerAccountSessionQueryKey(), retry: false } });
}

function invalidateCustomerData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: getGetMyBookingsQueryKey() });
  void queryClient.invalidateQueries({ queryKey: getGetAvailableVehiclesQueryKey() });
}

export function CustomerAccessPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const session = useCustomerSession();
  const login = useCustomerLogin();
  const register = useRegisterCustomer();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', address: '', drivingLicenseNumber: '', password: '',
  });
  const pending = login.isPending || register.isPending;
  const returnTo = safeReturnPath(searchParams.get('returnTo'));

  useEffect(() => {
    if (session.data?.authenticated) navigate(returnTo, { replace: true });
  }, [session.data?.authenticated, navigate, returnTo]);

  const change = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (mode === 'register') {
      register.mutate({
        data: {
          fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(),
          address: form.address.trim(), drivingLicenseNumber: form.drivingLicenseNumber.trim(), password: form.password,
        },
      }, {
        onSuccess: (account: CustomerAccountSession) => {
          queryClient.setQueryData(getGetCustomerAccountSessionQueryKey(), account);
          navigate(returnTo, { replace: true });
        },
        onError: (reason) => setError(messageFor(reason)),
      });
    } else {
      login.mutate({ data: { email: form.email.trim(), password: form.password } }, {
        onSuccess: (account: CustomerAccountSession) => {
          queryClient.setQueryData(getGetCustomerAccountSessionQueryKey(), account);
          navigate(returnTo, { replace: true });
        },
        onError: (reason) => setError(messageFor(reason)),
      });
    }
  };

  if (session.data?.authenticated) return null;
  return <PortalFrame>
    <main className="cp-access">
      <section className="cp-access-story">
        <div className="cp-story-label"><span /> ROADHOUSE / CUSTOMER ACCESS</div>
        <div className="cp-story-copy"><p className="cp-eyebrow">A smoother start to every mile</p><h1>{mode === 'register' ? <>Make room<br />for <em>the road.</em></> : <>Your next mile<br />starts <em>here.</em></>}</h1>
          <p>Keep your reservations close, see the details clearly, and get back to the journey ahead.</p>
        </div>
        <div className="cp-story-art" aria-hidden="true"><div className="cp-art-sun" /><div className="cp-art-horizon" /><div className="cp-art-road" /><div className="cp-art-car"><span className="cp-art-roof" /><span className="cp-art-window" /><span className="cp-art-wheel cp-wheel-left" /><span className="cp-art-wheel cp-wheel-right" /></div><span className="cp-art-caption">GOOD CARS / GOOD TO GO</span></div>
        <div className="cp-story-foot"><span><ShieldCheck size={14} /> Your account stays yours</span><span>01 — CUSTOMER ACCESS</span></div>
      </section>
      <section className="cp-form-side"><div className="cp-form-card">
        <p className="cp-eyebrow">{mode === 'register' ? 'A GOOD PLACE TO BEGIN' : 'WELCOME BACK'}</p>
        <h2>{mode === 'register' ? 'Create your account.' : 'Sign in to Roadhouse.'}</h2>
        <p className="cp-form-intro">{mode === 'register' ? 'A few details, then your rentals are all in one place.' : 'Your rental details are ready when you are.'}</p>
        <form onSubmit={submit}>
          {mode === 'register' && <label className="cp-field"><span>Full name</span><input autoComplete="name" value={form.fullName} onChange={change('fullName')} required minLength={1} maxLength={120} placeholder="Your full name" data-testid="input-customer-full-name" /></label>}
          <label className="cp-field"><span>Email address</span><input type="email" autoComplete="email" value={form.email} onChange={change('email')} required maxLength={180} placeholder="you@example.com" data-testid="input-customer-email" /></label>
          {mode === 'register' && <>
            <div className="cp-field-row">
              <label className="cp-field"><span>Phone number</span><input type="tel" autoComplete="tel" value={form.phone} onChange={change('phone')} required minLength={5} maxLength={32} placeholder="Your number" data-testid="input-customer-phone" /></label>
              <label className="cp-field"><span>Driving licence</span><input value={form.drivingLicenseNumber} onChange={change('drivingLicenseNumber')} required maxLength={64} placeholder="Licence number" data-testid="input-customer-license" /></label>
            </div>
            <label className="cp-field"><span>Address</span><textarea autoComplete="street-address" value={form.address} onChange={change('address')} required maxLength={240} rows={2} placeholder="Street, city and postal code" data-testid="input-customer-address" /></label>
          </>}
          <label className="cp-field"><span>Password</span><input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={change('password')} required minLength={mode === 'register' ? 8 : 1} maxLength={128} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} data-testid="input-customer-password" /></label>
          {error && <p className="cp-inline-error" role="alert"><CircleAlert size={15} />{error}</p>}
          <button className="cp-button cp-button-primary cp-submit" type="submit" disabled={pending} data-testid="button-customer-submit">{pending ? (mode === 'register' ? 'Creating your account…' : 'Signing you in…') : (mode === 'register' ? 'Create account' : 'Sign in')} {!pending && <ArrowRight size={16} />}</button>
        </form>
        <div className="cp-form-switch">{mode === 'register' ? <>Already have an account? <Link to={`/customer/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}>Sign in</Link></> : <>New to Roadhouse? <Link to={`/customer/register${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}>Create an account</Link></>}</div>
        <div className="cp-security-note"><ShieldCheck size={15} /><span>Secure customer access <small>Your personal booking history is private.</small></span></div>
      </div></section>
    </main>
  </PortalFrame>;
}

function bookingStatus(status: string) {
  return status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}
function bookingTone(status: string) {
  const key = status.toLowerCase();
  if (key === 'booked') return 'booked';
  if (key.includes('cancel')) return 'cancelled';
  if (key.includes('complete') || key.includes('return')) return 'complete';
  return 'neutral';
}

function BookingRow({ booking, onCancel, cancelPending }: { booking: Booking; onCancel: (booking: Booking) => void; cancelPending: boolean }) {
  const canCancel = booking.bookingStatus.toUpperCase() === 'BOOKED';
  return <article className="cp-booking-row" data-testid={`customer-booking-${booking.id}`}>
    <div className="cp-booking-car"><CarFront size={22} /></div>
    <div className="cp-booking-main"><div className="cp-booking-heading"><h3>{booking.vehicleLabel}</h3><span className={`cp-status cp-status-${bookingTone(booking.bookingStatus)}`}><i />{bookingStatus(booking.bookingStatus)}</span></div>
      <div className="cp-booking-details"><span><CalendarDays size={14} />{dateLabel(booking.startDate)} <b>to</b> {dateLabel(booking.endDate)}</span><span><Clock3 size={14} />Booked {dateLabel(booking.createdAt)}</span></div>
    </div>
    <div className="cp-booking-total"><span>Rental total</span><strong>{money(booking.totalAmount)}</strong></div>
    {canCancel && <button type="button" className="cp-cancel-button" disabled={cancelPending} onClick={() => onCancel(booking)} data-testid={`button-cancel-booking-${booking.id}`}>{cancelPending ? 'Cancelling…' : 'Cancel booking'}</button>}
  </article>;
}

export function CustomerRentalsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useCustomerSession();
  const bookings = useGetMyBookings<Booking[], unknown>({ query: { queryKey: getGetMyBookingsQueryKey(), enabled: !!session.data?.authenticated, retry: false } });
  const logout = useCustomerLogout();
  const cancel = useCancelMyBooking();
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!session.isLoading && (session.error || !session.data?.authenticated)) navigate('/customer/login?returnTo=%2Fmy-rentals', { replace: true });
  }, [session.isLoading, session.error, session.data?.authenticated, navigate]);

  const signOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: getGetMyBookingsQueryKey() });
        queryClient.setQueryData(getGetCustomerAccountSessionQueryKey(), { authenticated: false, customerId: null, fullName: '', email: '' });
        navigate('/customer/login', { replace: true });
      },
      onError: (reason) => setActionError(messageFor(reason)),
    });
  };
  const cancelBooking = (booking: Booking) => {
    setActionError('');
    if (!window.confirm(`Cancel your ${booking.vehicleLabel} reservation?`)) return;
    cancel.mutate({ id: booking.id }, {
      onSuccess: () => invalidateCustomerData(queryClient),
      onError: (reason) => setActionError(messageFor(reason)),
    });
  };

  if (session.isLoading) return <PortalFrame><main className="cp-content"><LoadingState /></main></PortalFrame>;
  if (session.error || !session.data?.authenticated) return null;
  return <PortalFrame name={session.data.fullName} onLogout={signOut} loggingOut={logout.isPending}>
    <main className="cp-content">
      <section className="cp-page-hero cp-rentals-hero"><div><p className="cp-eyebrow">YOUR ROADHOUSE ACCOUNT</p><h1>Your rentals,<br /><em>all together.</em></h1><p className="cp-lede">A clear view of what you’ve reserved and where each booking stands.</p></div><div className="cp-account-card"><span className="cp-account-avatar">{session.data.fullName.trim().slice(0, 1).toUpperCase() || 'R'}</span><div><span>ACCOUNT HOLDER</span><strong>{session.data.fullName}</strong><small>{session.data.email}</small></div><Check size={17} /></div></section>
      <div className="cp-section-title"><div><p className="cp-eyebrow">BOOKING HISTORY</p><h2>Your reservations</h2></div><Link to="/rent" className="cp-button cp-button-primary">Reserve a vehicle <ArrowRight size={15} /></Link></div>
      {actionError && <p className="cp-inline-error cp-page-error" role="alert"><CircleAlert size={15} />{actionError}</p>}
      {bookings.isLoading ? <LoadingState label="Loading your reservations" /> : bookings.error ? <ErrorState error={bookings.error} retry={() => void bookings.refetch()} /> : !bookings.data?.length ? <div className="cp-empty-state"><span className="cp-empty-icon"><CarFront size={24} /></span><p className="cp-eyebrow">ROOM FOR A FIRST TRIP</p><h2>No rentals to show yet.</h2><p>When you reserve a vehicle, the dates and booking status will appear here.</p><Link to="/#available" className="cp-button cp-button-secondary">Explore available vehicles <ArrowRight size={15} /></Link></div> : <section className="cp-bookings-list" aria-label="Your bookings">{bookings.data.map((booking) => <BookingRow key={booking.id} booking={booking} onCancel={cancelBooking} cancelPending={cancel.isPending} />)}</section>}
      <div className="cp-reassurance"><ShieldCheck size={17} /><span><strong>Your reservation details stay private.</strong> Changes to your rental are managed securely through your Roadhouse account.</span></div>
    </main>
  </PortalFrame>;
}

function toLocalISO(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalISO(date);
}
function rentalDays(start: string, end: string) {
  if (!start || !end) return 0;
  const difference = Math.round((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86_400_000);
  return Math.max(1, difference);
}

function VehiclePreview({ vehicle }: { vehicle: Vehicle }) {
  return <div className="cp-selected-vehicle">
    <div className="cp-selected-visual">{vehicle.imageUrl ? <img src={vehicle.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`} /> : <div className="cp-vehicle-placeholder" aria-label={`${vehicle.vehicleType} vehicle`}><div className="cp-placeholder-sun" /><div className="cp-placeholder-road" /><CarFront size={72} strokeWidth={1.1} /><span>ROADHOUSE / READY LINE</span></div>}<span className="cp-available-tag"><i />Available now</span></div>
    <div className="cp-selected-details"><p className="cp-eyebrow">{vehicle.vehicleType} / {vehicle.color}</p><h2>{vehicle.brand} {vehicle.model}</h2><p className="cp-registration">Vehicle {vehicle.vehicleNumber}</p><div className="cp-rate"><strong>{money(vehicle.dailyRentalPrice)}</strong><span>per day</span></div></div>
  </div>;
}

export function CustomerBookingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const session = useCustomerSession();
  const initialVehicleId = searchParams.get('vehicleId') || '';
  const [vehicleId, setVehicleId] = useState(initialVehicleId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const available = useGetAvailableVehicles({ query: { queryKey: getGetAvailableVehiclesQueryKey(), enabled: !!session.data?.authenticated, retry: false } });
  const create = useCreateMyBooking();

  useEffect(() => {
    if (!session.isLoading && (session.error || !session.data?.authenticated)) {
      const target = initialVehicleId ? `/rent?vehicleId=${encodeURIComponent(initialVehicleId)}` : '/rent';
      navigate(`/customer/login?returnTo=${encodeURIComponent(target)}`, { replace: true });
    }
  }, [session.isLoading, session.error, session.data?.authenticated, navigate, initialVehicleId]);
  useEffect(() => {
    if (initialVehicleId) setVehicleId(initialVehicleId);
  }, [initialVehicleId]);

  const vehicles = available.data ?? [];
  const selected = useMemo(() => vehicles.find((vehicle) => String(vehicle.id) === vehicleId), [vehicles, vehicleId]);
  const today = toLocalISO(new Date());
  const days = rentalDays(startDate, endDate);
  const previewTotal = selected && days ? selected.dailyRentalPrice * days : 0;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!selected) { setError('Choose a vehicle currently marked available.'); return; }
    if (!startDate || !endDate) { setError('Choose both rental dates to continue.'); return; }
    if (startDate < today) { setError('The start date cannot be in the past.'); return; }
    if (endDate <= startDate) { setError('The return date must be after pickup.'); return; }
    create.mutate({ data: { vehicleId: selected.id, startDate, endDate } }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetMyBookingsQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetAvailableVehiclesQueryKey() });
        navigate('/my-rentals', { replace: true });
      },
      onError: (reason) => setError(messageFor(reason)),
    });
  };

  if (session.isLoading) return <PortalFrame><main className="cp-content"><LoadingState /></main></PortalFrame>;
  if (session.error || !session.data?.authenticated) return null;
  return <PortalFrame name={session.data.fullName}>
    <main className="cp-content cp-booking-page">
      <Link to="/my-rentals" className="cp-back-link"><ArrowLeft size={15} /> Back to my rentals</Link>
      <section className="cp-page-hero cp-booking-intro"><div><p className="cp-eyebrow">A GOOD TRIP STARTS HERE</p><h1>Reserve your<br /><em>next ride.</em></h1><p className="cp-lede">Choose a vehicle and dates. Your reservation will be added to your account.</p></div><div className="cp-booking-trust"><span><ShieldCheck size={18} /></span><b>Clear from the start</b><small>Daily rate shown before you reserve.</small></div></section>
      {available.isLoading ? <LoadingState label="Loading available vehicles" /> : available.error ? <ErrorState error={available.error} retry={() => void available.refetch()} /> : vehicles.length === 0 ? <div className="cp-empty-state"><span className="cp-empty-icon"><CarFront size={24} /></span><p className="cp-eyebrow">THE READY LINE</p><h2>No vehicles are available right now.</h2><p>Check back soon. The fleet list updates when a vehicle is marked available.</p><Link to="/" className="cp-button cp-button-secondary">Return to Roadhouse <ArrowRight size={15} /></Link></div> : <form className="cp-reservation-layout" onSubmit={submit}>
        <section className="cp-reservation-form">
          <div className="cp-step-heading"><span>01</span><div><p className="cp-eyebrow">YOUR VEHICLE</p><h2>Choose what fits.</h2></div></div>
          <label className="cp-field"><span>Available vehicle</span><div className="cp-select-wrap"><select value={vehicleId} onChange={(event) => { setVehicleId(event.target.value); setError(''); }} required aria-label="Available vehicle" data-testid="select-booking-vehicle"><option value="">Select a vehicle</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.brand} {vehicle.model} · {vehicle.vehicleType} · {money(vehicle.dailyRentalPrice)} / day</option>)}</select><ChevronDown size={17} /></div></label>
          {selected && <VehiclePreview vehicle={selected} />}
          <div className="cp-step-heading cp-date-step"><span>02</span><div><p className="cp-eyebrow">YOUR DATES</p><h2>Set your travel window.</h2></div></div>
          <div className="cp-date-fields">
            <label className="cp-field"><span>Pickup date</span><input type="date" min={today} value={startDate} onChange={(event) => { setStartDate(event.target.value); if (endDate && event.target.value >= endDate) setEndDate(''); setError(''); }} required data-testid="input-booking-start-date" /></label>
            <label className="cp-field"><span>Return date</span><input type="date" min={startDate ? addDays(startDate, 1) : today} value={endDate} onChange={(event) => { setEndDate(event.target.value); setError(''); }} required data-testid="input-booking-end-date" /></label>
          </div>
          {error && <p className="cp-inline-error" role="alert"><CircleAlert size={15} />{error}</p>}
          <button className="cp-button cp-button-primary cp-submit cp-reserve-submit" type="submit" disabled={create.isPending || !selected} data-testid="button-create-booking">{create.isPending ? 'Saving your reservation…' : 'Reserve this vehicle'} {!create.isPending && <ArrowRight size={16} />}</button>
          <p className="cp-form-footnote"><ShieldCheck size={14} /> Booking is recorded to your Roadhouse account. No online payment is collected here.</p>
        </section>
        <aside className="cp-price-panel"><div className="cp-price-top"><span className="cp-price-icon"><MapPin size={17} /></span><p className="cp-eyebrow">YOUR ESTIMATE</p></div><h2>Know the rate<br />before you go.</h2><p className="cp-price-copy">A simple preview based on the listed daily rate and your selected dates.</p><div className="cp-price-lines"><div><span>Daily rate</span><strong>{selected ? money(selected.dailyRentalPrice) : '—'} <small>/ day</small></strong></div><div><span>Chargeable days</span><strong>{days || '—'}</strong></div></div><div className="cp-price-total"><span>Estimated total</span><strong>{selected && days ? money(previewTotal) : '—'}</strong></div><p className="cp-price-disclaimer">The fleet system confirms the final booking total when your reservation is created.</p><div className="cp-price-rule" /><div className="cp-price-note"><Check size={15} /><span>Vehicle availability is checked again when you reserve.</span></div></aside>
      </form>}
    </main>
  </PortalFrame>;
}
