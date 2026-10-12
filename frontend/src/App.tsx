import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity, ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays,
  CarFront, Check, ChevronDown, CircleDollarSign, Clock3, LayoutDashboard,
  LogOut, Menu, Plus, Search, Settings2, ShieldCheck, Users, X, Wrench,
  type LucideIcon,
} from 'lucide-react';
import {
  useHealthCheck, getHealthCheckQueryKey, useLogin, useLogout, useGetSession, getGetSessionQueryKey,
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useGetAvailableVehicles, getGetAvailableVehiclesQueryKey,
  useGetVehicles, getGetVehiclesQueryKey, useGetVehicle, getGetVehicleQueryKey, useCreateVehicle, useUpdateVehicle,
  useDeleteVehicle, useGetCustomers, getGetCustomersQueryKey, useCreateCustomer,
  useGetCustomer, getGetCustomerQueryKey, useUpdateCustomer, useDeleteCustomer, useGetBookings, getGetBookingsQueryKey, useGetBooking, getGetBookingQueryKey,
  useCreateBooking, useUpdateBooking, useDeleteBooking, useCancelBooking,
  useReturnBooking,
} from '@workspace/api-client-react';
import type { Booking, BookingInput, Customer, CustomerInput, Vehicle, VehicleInput } from '@workspace/api-client-react';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/error-boundary';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import PublicLandingPage from '@/pages/public-landing';
import { CustomerAccessPage, CustomerBookingPage, CustomerRentalsPage } from '@/pages/customer-portal';

const client = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
const money = (value?: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value ?? 0);
const dateLabel = (value?: string | null) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
const statusKey = (value?: string) => (value || 'unknown').toLowerCase().replaceAll('_', '-');

function Button({ children, onClick, kind = 'secondary', type = 'button', disabled, className = '', testId }: {
  children: ReactNode; onClick?: () => void; kind?: 'primary' | 'secondary' | 'quiet' | 'danger'; type?: 'button' | 'submit'; disabled?: boolean; className?: string; testId?: string;
}) {
  return <button type={type} onClick={onClick} disabled={disabled} data-testid={testId} className={`button button-${kind} ${className}`}>{children}</button>;
}

function Modal({ title, eyebrow, children, onClose, wide = false }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-head"><div><p className="eyebrow">{eyebrow || 'ADMIN'}</p><h2 id="modal-title">{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close" data-testid="button-close-modal"><X size={18} /></button></header>
      {children}
    </section>
  </div>;
}

function Field({ label, name, value, onChange, type = 'text', required = true, placeholder, as = 'input', options, step }: {
  label: string; name: string; value: string | number; onChange: (name: string, value: string) => void; type?: string; required?: boolean; placeholder?: string; as?: 'input' | 'textarea' | 'select'; options?: string[]; step?: string;
}) {
  return <label className="field"><span>{label}</span>{as === 'textarea' ? <textarea required={required} name={name} value={value} placeholder={placeholder} onChange={e => onChange(name, e.target.value)} rows={3} /> : as === 'select' ? <select required={required} name={name} value={value} onChange={e => onChange(name, e.target.value)}>{options?.map(option => <option key={option} value={option}>{option}</option>)}</select> : <input required={required} name={name} type={type} step={step} value={value} placeholder={placeholder} onChange={e => onChange(name, e.target.value)} />}</label>;
}

function FormModal<T extends object>({ title, eyebrow, initial, fields, onSubmit, onClose, pending, wide, error }: {
  title: string; eyebrow?: string; initial: T; fields: { name: keyof T; label: string; type?: string; required?: boolean; placeholder?: string; as?: 'input' | 'textarea' | 'select'; options?: string[]; step?: string }[];
  onSubmit: (data: T) => void; onClose: () => void; pending: boolean; wide?: boolean; error?: unknown;
}) {
  const [form, setForm] = useState<T>(initial);
  const change = (name: string, value: string) => setForm(previous => ({ ...previous, [name]: value }));
  return <Modal title={title} eyebrow={eyebrow} onClose={onClose} wide={wide}>
    <form className="form-body" onSubmit={event => { event.preventDefault(); onSubmit(form); }}>
      <div className="field-grid">{fields.map(field => <Field key={String(field.name)} {...field} name={String(field.name)} value={String(form[field.name] ?? '')} onChange={change} />)}</div>
      {Boolean(error) && <p className="inline-error" role="alert">{errorMessage(error)}</p>}
      <div className="form-actions"><Button kind="quiet" onClick={onClose}>Keep looking</Button><Button kind="primary" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save record'} <ArrowRight size={15} /></Button></div>
    </form>
  </Modal>;
}

function LoadState({ error, onRetry, label = 'Loading your workspace' }: { error?: unknown; onRetry: () => void; label?: string }) {
  if (error) return <div className="state-card error-state"><div className="state-icon"><Activity size={20} /></div><h3>We couldn’t load this view</h3><p>{errorMessage(error)}</p><Button onClick={onRetry}>Try again</Button></div>;
  return <div className="skeleton-wrap" aria-label={label}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /><div className="skeleton skeleton-block" /></div>;
}

function useSuccessNotification(success: boolean, title: string, description: string) {
  useEffect(() => {
    if (success) toast({ title, description });
  }, [success, title, description]);
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="state-card empty-state"><div className="state-icon"><CarFront size={21} /></div><h3>{title}</h3><p>{detail}</p>{action}</div>;
}

function Status({ value }: { value: string }) {
  const key = statusKey(value);
  return <span className={`status status-${key}`}><i />{value.replaceAll('_', ' ').toLowerCase().replace(/^\w/, s => s.toUpperCase())}</span>;
}

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/vehicles', label: 'Vehicles', icon: CarFront },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/bookings', label: 'Bookings', icon: CalendarDays },
];

function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: false } });
  const session = useGetSession({ query: { queryKey: getGetSessionQueryKey(), retry: false } });
  const login = useLogin();
  useSuccessNotification(login.isSuccess, 'Signed in', 'Welcome to Admin.');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (session.data?.authenticated) navigate('/dashboard'); }, [session.data?.authenticated, navigate]);
  if (session.data?.authenticated) return null;
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError('');
    login.mutate({ data: { username, password } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() }); navigate('/dashboard'); },
      onError: reason => setError(errorMessage(reason)),
    });
  };
  return <main className="login-screen">
    <div className="login-art"><div className="login-art-top"><span className="brand-mark"><CarFront size={19} /></span><span>ROADHOUSE <small>ADMIN</small></span></div><div className="login-art-copy"><p className="eyebrow">A STEADY HAND ON THE KEYS</p><h1>Every mile,<br /><em>accounted for.</em></h1><p>One quiet place to keep your fleet moving and your records in order.</p></div><div className="login-art-foot"><span>FIELD NOTES / 01</span><span>ADMINISTRATOR ACCESS</span></div><div className="art-vehicle"><div className="art-road" /><div className="art-sun" /><div className="art-car"><span /><i /><i /></div></div></div>
    <section className="login-form-side"><div className="login-mobile-brand"><span className="brand-mark"><CarFront size={19} /></span> ROADHOUSE</div><div className="login-card"><p className="eyebrow">WELCOME BACK</p><h2>Sign in to Admin.</h2><p className="login-description">Your fleet is ready when you are.</p>
      <form onSubmit={submit}><label className="field"><span>Administrator username</span><input data-testid="input-username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Your username" /></label><label className="field"><span>Password</span><input data-testid="input-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" /></label>{error && <p className="inline-error" role="alert">{error}</p>}<Button kind="primary" type="submit" disabled={login.isPending} className="login-submit" testId="button-sign-in">{login.isPending ? 'Checking credentials…' : 'Enter Admin'} <ArrowRight size={16} /></Button></form>
      <p className="login-secure"><ShieldCheck size={15} /> Secure administrator sign-in <span className={`api-state ${health.isError ? 'api-offline' : ''}`}><i />{health.isLoading ? 'Checking service' : health.isError ? 'Service unavailable' : 'Service ready'}</span></p></div><footer className="login-footer">Roadhouse Admin <span>·</span> Operations, kept in motion</footer></section>
  </main>;
}

function AdminLayout({ children, pageTitle }: { children: ReactNode; pageTitle: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const session = useGetSession({ query: { queryKey: getGetSessionQueryKey(), retry: false } });
  const logout = useLogout();
  useSuccessNotification(logout.isSuccess, 'Signed out', 'Your administrator session has ended.');
  const [mobileNav, setMobileNav] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    if (!session.isLoading && (session.error || !session.data?.authenticated)) navigate('/login', { replace: true });
  }, [session.isLoading, session.error, session.data?.authenticated, navigate]);
  if (session.isLoading) return <div className="auth-loading"><div className="loading-mark"><CarFront size={22} /></div><p>Opening Admin…</p></div>;
  if (session.error || !session.data?.authenticated) return null;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <Link to="/dashboard" className="brand-lockup" data-testid="link-home"><span className="brand-mark"><CarFront size={18} /></span><span>ROADHOUSE<small>ADMIN</small></span></Link>
      <div className="side-section-label">WORKSPACE</div><nav className="side-nav">{navItems.map(item => {
        const Icon = item.icon;
        return <Link key={item.href} to={item.href} onClick={() => setMobileNav(false)} className={`nav-link ${location.pathname === item.href ? 'nav-active' : ''}`} data-testid={`link-nav-${item.label.toLowerCase()}`}><Icon size={17} /><span>{item.label}</span>{item.href === '/bookings' && <span className="nav-arrow"><ArrowRight size={13} /></span>}</Link>;
      })}</nav>
      <div className="sidebar-bottom"><div className="fleet-note"><div className="fleet-note-icon"><Wrench size={16} /></div><strong>Keep the wheels turning.</strong><p>Clear records make for smoother returns.</p></div><button className="profile-row" onClick={() => { logout.mutate(undefined, { onSuccess: () => { queryClient.setQueryData(getGetSessionQueryKey(), null); navigate('/login'); } }); }} data-testid="button-logout"><span className="avatar">{session.data.username.slice(0, 1).toUpperCase()}</span><span className="profile-copy"><b>{session.data.username}</b><small>Administrator</small></span><LogOut size={16} /></button></div>
    </aside>
    {mobileNav && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <div className="main-column"><header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={19} /></button><div className="breadcrumbs"><span>Admin</span><span>/</span><strong>{pageTitle}</strong></div><div className="topbar-right"><span className="live-indicator"><i /> Operations live</span><span className="topbar-divider" /><span className="today-label">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span><button className="icon-button settings-button" aria-label="Workspace settings" title="Workspace settings" onClick={() => setSettingsOpen(true)} data-testid="button-settings"><Settings2 size={17} /></button></div></header><main className="page-content">{children}</main><footer className="page-footer"><span>ROADHOUSE / RENTAL OPERATIONS</span><span>Clear records. Better journeys.</span></footer></div>
    {settingsOpen && <Modal title="Workspace details" eyebrow="ADMIN" onClose={() => setSettingsOpen(false)}><div className="detail-body"><p className="return-copy">A focused admin area for the vehicles, customers and reservations in your care.</p><div className="detail-grid"><Detail label="Signed in as" value={session.data.username} /><Detail label="Access level" value="Administrator" /><Detail label="Access state" value="Session verified" /><Detail label="Currency display" value="INR" /></div><Button kind="primary" onClick={() => setSettingsOpen(false)}>Done <Check size={15} /></Button></div></Modal>}
  </div>;
}

function PageHeading({ kicker, title, description, actions }: { kicker: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{kicker}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{actions && <div className="heading-actions">{actions}</div>}</div>;
}

function Metric({ label, value, note, icon: Icon, tone, trend }: { label: string; value: number | string; note: string; icon: LucideIcon; tone: string; trend?: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon metric-${tone}`}><Icon size={17} /></span></div><div className="metric-number">{value}</div><div className="metric-note">{trend && <span className="metric-trend"><ArrowUpRight size={13} />{trend}</span>}{note}</div></article>;
}

function Dashboard() {
  const stats = useGetDashboardStats();
  const fleet = useGetAvailableVehicles();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const results = useMemo(() => (fleet.data || []).filter(v => `${v.brand} ${v.model} ${v.vehicleNumber} ${v.vehicleType}`.toLowerCase().includes(search.toLowerCase())), [fleet.data, search]);
  return <AdminLayout pageTitle="Overview"><PageHeading kicker="MONDAY, MADE MANAGEABLE" title="Good morning." description="A clear view of the fleet, the people, and what’s moving today." actions={<Button kind="primary" onClick={() => navigate('/bookings')} testId="button-new-booking"><Plus size={16} /> New booking</Button>} />
    {stats.isLoading ? <LoadState onRetry={() => stats.refetch()} /> : stats.error ? <LoadState error={stats.error} onRetry={() => stats.refetch()} /> : <><section className="metrics-grid">
      <Metric label="FLEET SIZE" value={stats.data?.totalVehicles ?? 0} note="registered vehicles" icon={CarFront} tone="gold" />
      <Metric label="READY TO GO" value={stats.data?.availableVehicles ?? 0} note="available right now" icon={BadgeCheck} tone="green" />
      <Metric label="ON THE ROAD" value={stats.data?.rentedVehicles ?? 0} note="active rentals" icon={Activity} tone="blue" />
      <Metric label="CUSTOMERS" value={stats.data?.totalCustomers ?? 0} note="in your records" icon={Users} tone="rose" />
      <Metric label="TOTAL BOOKINGS" value={stats.data?.totalBookings ?? 0} note="all reservations" icon={CalendarDays} tone="gold" />
    </section>
      <div className="dashboard-columns"><section className="panel fleet-panel"><div className="panel-heading"><div><p className="eyebrow">THE READY LINE</p><h2>Available fleet <span className="count-tag">{fleet.data?.length ?? 0}</span></h2></div><Link to="/vehicles" className="text-link" data-testid="link-all-vehicles">All vehicles <ArrowRight size={14} /></Link></div>
        <label className="search-box"><Search size={16} /><input data-testid="input-fleet-search" placeholder="Search by make, model or plate…" value={search} onChange={e => setSearch(e.target.value)} /><kbd>/</kbd></label>
        {fleet.isLoading ? <div className="mini-loading"><div /><div /><div /></div> : fleet.error ? <div className="panel-inline-error">{errorMessage(fleet.error)} <button onClick={() => fleet.refetch()}>Retry</button></div> : results.length ? <div className="fleet-list">{results.slice(0, 5).map(vehicle => <VehicleRow key={vehicle.id} vehicle={vehicle} />)}</div> : <EmptyState title={search ? 'Nothing matches that search' : 'The ready line is empty'} detail={search ? 'Try a different make, model or plate number.' : 'Vehicles marked available will appear here.'} />}</section>
        <section className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Latest bookings</h2></div><Link to="/bookings" className="round-link" aria-label="View bookings" data-testid="link-view-bookings"><ArrowRight size={16} /></Link></div>
          {!stats.data?.recentBookings?.length ? <EmptyState title="No bookings yet" detail="New reservations will show up here." /> : <div className="activity-list">{stats.data.recentBookings.slice(0, 5).map((booking, index) => <div key={booking.id} className="activity-item" data-testid={`activity-booking-${booking.id}`}><div className={`activity-marker marker-${index % 3}`}><CalendarDays size={15} /></div><div className="activity-info"><strong>{booking.customerName}</strong><span>{booking.vehicleLabel}</span></div><div className="activity-meta"><Status value={booking.bookingStatus} /><small>{dateLabel(booking.startDate)}</small></div></div>)}</div>}
          <div className="activity-foot"><span>{stats.data?.totalBookings ?? 0} total records</span><button onClick={() => navigate('/bookings')}>View bookings <ArrowRight size={13} /></button></div></section></div>
    </>}
    <section className="dashboard-bottom"><div className="bottom-copy"><span className="bottom-mark"><CircleDollarSign size={18} /></span><div><strong>Price it with confidence.</strong><p>Daily rates are visible beside every vehicle, before a booking begins.</p></div></div><Link to="/vehicles" className="bottom-link" data-testid="link-review-rates">Review fleet rates <ArrowRight size={15} /></Link></section>
  </AdminLayout>;
}

function VehicleRow({ vehicle }: { vehicle: Vehicle }) {
  return <div className="fleet-row" data-testid={`vehicle-row-${vehicle.id}`}><div className="vehicle-thumb">{vehicle.imageUrl ? <img src={vehicle.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`} /> : <CarFront size={23} />}</div><div className="fleet-row-main"><strong>{vehicle.brand} {vehicle.model}</strong><span>{vehicle.vehicleNumber} <i>·</i> {vehicle.vehicleType}</span></div><div className="fleet-price"><strong>{money(vehicle.dailyRentalPrice)}</strong><span>per day</span></div><Status value={vehicle.availabilityStatus} /></div>;
}

const vehicleFields: { name: keyof VehicleInput; label: string; type?: string; as?: 'input' | 'select'; options?: string[]; step?: string; placeholder?: string; required?: boolean }[] = [
  { name: 'vehicleNumber', label: 'Registration / plate' }, { name: 'brand', label: 'Make' }, { name: 'model', label: 'Model' },
  { name: 'vehicleType', label: 'Vehicle type', as: 'select', options: ['Sedan', 'SUV', 'Hatchback', 'Van', 'Truck', 'Coupe', 'Motorcycle', 'Other'] },
  { name: 'color', label: 'Color' }, { name: 'dailyRentalPrice', label: 'Daily rate (₹)', type: 'number', step: '0.01' },
  { name: 'imageUrl', label: 'Image URL', required: false, placeholder: 'Optional vehicle image' },
];
const customerFields: { name: keyof CustomerInput; label: string; type?: string; as?: 'input' | 'textarea'; placeholder?: string }[] = [
  { name: 'fullName', label: 'Full name' }, { name: 'email', label: 'Email address', type: 'email' }, { name: 'phone', label: 'Phone number', type: 'tel' },
  { name: 'drivingLicenseNumber', label: 'Driving licence number' }, { name: 'address', label: 'Address', as: 'textarea' },
];

function VehiclesPage() {
  const cache = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [modal, setModal] = useState<'create' | Vehicle | null>(null);
  const [detail, setDetail] = useState<number | null>(null);
  const query = useGetVehicles({ search: search || undefined, status: status || undefined, vehicleType: type || undefined });
  const create = useCreateVehicle(), update = useUpdateVehicle(), remove = useDeleteVehicle<unknown>();
  useSuccessNotification(create.isSuccess, 'Vehicle added', 'The new vehicle is in your fleet register.');
  useSuccessNotification(update.isSuccess, 'Vehicle updated', 'Vehicle details have been saved.');
  useSuccessNotification(remove.isSuccess, 'Vehicle deleted', 'The vehicle record was removed.');
  const detailQuery = useGetVehicle(detail ?? 0, { query: { enabled: detail !== null, queryKey: getGetVehicleQueryKey(detail ?? 0) } });
  const refresh = () => {
    cache.invalidateQueries({ queryKey: getGetVehiclesQueryKey() });
    cache.invalidateQueries({ queryKey: getGetAvailableVehiclesQueryKey() });
    cache.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };
  const save = (input: VehicleInput) => {
    const payload = { ...input, dailyRentalPrice: Number(input.dailyRentalPrice), imageUrl: input.imageUrl || null };
    if (modal && modal !== 'create') update.mutate({ id: modal.id, data: payload }, { onSuccess: () => { refresh(); setModal(null); } });
    else create.mutate({ data: payload }, { onSuccess: () => { refresh(); setModal(null); } });
  };
  const vehicleData = modal && modal !== 'create' ? { vehicleNumber: modal.vehicleNumber, brand: modal.brand, model: modal.model, vehicleType: modal.vehicleType, color: modal.color, dailyRentalPrice: modal.dailyRentalPrice, imageUrl: modal.imageUrl || '' } : { vehicleNumber: '', brand: '', model: '', vehicleType: 'Sedan', color: '', dailyRentalPrice: 0, imageUrl: '' };
  const detailVehicle = detailQuery.data;
  return <AdminLayout pageTitle="Vehicles"><PageHeading kicker="FLEET REGISTER" title="Vehicles" description="Every plate, rate and availability status in one place." actions={<Button kind="primary" onClick={() => setModal('create')} testId="button-add-vehicle"><Plus size={16} /> Add vehicle</Button>} />
    {Boolean(remove.error) && <p className="inline-error action-error" role="alert">{errorMessage(remove.error)}</p>}
    <section className="data-toolbar"><label className="search-box"><Search size={16} /><input data-testid="input-vehicle-search" placeholder="Search make, model or plate…" value={search} onChange={e => setSearch(e.target.value)} /></label><div className="filters"><label className="select-filter"><span>Availability</span><select value={status} onChange={e => setStatus(e.target.value)} data-testid="select-vehicle-status"><option value="">All statuses</option><option value="AVAILABLE">Available</option><option value="RENTED">Rented</option><option value="MAINTENANCE">Maintenance</option></select><ChevronDown size={14} /></label><label className="select-filter"><span>Type</span><select value={type} onChange={e => setType(e.target.value)} data-testid="select-vehicle-type"><option value="">All types</option>{vehicleFields.find(field => field.name === 'vehicleType')?.options?.map(o => <option key={o}>{o}</option>)}</select><ChevronDown size={14} /></label></div></section>
    <section className="panel table-panel">{query.isLoading ? <LoadState onRetry={() => query.refetch()} /> : query.error ? <LoadState error={query.error} onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState title="No vehicles in the register" detail="Add the first vehicle to build your available fleet." action={<Button kind="primary" onClick={() => setModal('create')}><Plus size={15} /> Add vehicle</Button>} /> : <div className="table-scroll"><table><thead><tr><th>VEHICLE</th><th>REGISTRATION</th><th>TYPE / COLOR</th><th>DAILY RATE</th><th>AVAILABILITY</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{query.data.map(vehicle => <tr key={vehicle.id} data-testid={`row-vehicle-${vehicle.id}`}><td><button className="record-name" onClick={() => setDetail(vehicle.id)} data-testid={`button-vehicle-detail-${vehicle.id}`}><span className="table-vehicle-icon"><CarFront size={17} /></span><span><strong>{vehicle.brand} {vehicle.model}</strong><small>Fleet vehicle</small></span></button></td><td className="mono-text">{vehicle.vehicleNumber}</td><td>{vehicle.vehicleType}<small className="subcell">{vehicle.color}</small></td><td><strong>{money(vehicle.dailyRentalPrice)}</strong><small className="subcell">per day</small></td><td><Status value={vehicle.availabilityStatus} /></td><td><div className="row-actions"><button onClick={() => setModal(vehicle)} className="tiny-action" data-testid={`button-edit-vehicle-${vehicle.id}`}>Edit</button><button className="tiny-action danger-action" data-testid={`button-delete-vehicle-${vehicle.id}`} onClick={() => { if (window.confirm(`Delete ${vehicle.brand} ${vehicle.model} (${vehicle.vehicleNumber})?`)) remove.mutate({ id: vehicle.id }, { onSuccess: refresh }); }}>Delete</button></div></td></tr>)}</tbody></table></div>}</section>
    <div className="table-foot"><span>{query.data?.length ?? 0} vehicles listed</span><span>Rates shown in INR / day</span></div>
    {modal !== null && <FormModal title={modal === 'create' ? 'Add a vehicle' : 'Edit vehicle'} eyebrow={modal === 'create' ? 'NEW FLEET RECORD' : 'UPDATE FLEET RECORD'} initial={vehicleData} fields={vehicleFields} onClose={() => setModal(null)} onSubmit={data => save(data as VehicleInput)} pending={create.isPending || update.isPending} error={create.error || update.error} wide />}
    {detail !== null && <VehicleDetail vehicle={detailVehicle} loading={detailQuery.isLoading} onClose={() => setDetail(null)} onEdit={() => { if (detailVehicle) setModal(detailVehicle); setDetail(null); }} />}
  </AdminLayout>;
}

function VehicleDetail({ vehicle, loading, onClose, onEdit }: { vehicle?: Vehicle; loading: boolean; onClose: () => void; onEdit: () => void }) {
  return <Modal title={vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle details'} eyebrow="FLEET RECORD" onClose={onClose}>
    {loading ? <div className="skeleton-wrap"><div className="skeleton skeleton-block" /></div> : vehicle ? <div className="detail-body"><div className="detail-hero">{vehicle.imageUrl ? <img src={vehicle.imageUrl} alt="" /> : <CarFront size={38} />}<Status value={vehicle.availabilityStatus} /></div><div className="detail-grid"><Detail label="Registration" value={vehicle.vehicleNumber} /><Detail label="Vehicle type" value={vehicle.vehicleType} /><Detail label="Color" value={vehicle.color} /><Detail label="Daily rental rate" value={`${money(vehicle.dailyRentalPrice)} / day`} /></div><Button kind="primary" onClick={onEdit}>Edit vehicle <ArrowRight size={15} /></Button></div> : <p className="field">Vehicle not found in current results.</p>}
  </Modal>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail-cell"><span>{label}</span><strong>{value}</strong></div>; }

function CustomersPage() {
  const cache = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | Customer | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const query = useGetCustomers({ search: search || undefined });
  const detailQuery = useGetCustomer<Customer, unknown>(detailId ?? 0, { query: { enabled: detailId !== null, queryKey: getGetCustomerQueryKey(detailId ?? 0) } });
  const create = useCreateCustomer(), update = useUpdateCustomer(), remove = useDeleteCustomer<unknown>();
  useSuccessNotification(create.isSuccess, 'Customer added', 'The customer is in your records.');
  useSuccessNotification(update.isSuccess, 'Customer updated', 'Customer details have been saved.');
  useSuccessNotification(remove.isSuccess, 'Customer deleted', 'The customer record was removed.');
  const refresh = () => { cache.invalidateQueries({ queryKey: getGetCustomersQueryKey() }); cache.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() }); };
  const initial: CustomerInput = modal && modal !== 'create' ? { fullName: modal.fullName, email: modal.email, phone: modal.phone, address: modal.address, drivingLicenseNumber: modal.drivingLicenseNumber } : { fullName: '', email: '', phone: '', address: '', drivingLicenseNumber: '' };
  const save = (input: CustomerInput) => {
    if (modal && modal !== 'create') update.mutate({ id: modal.id, data: input }, { onSuccess: () => { refresh(); setModal(null); } });
    else create.mutate({ data: input }, { onSuccess: () => { refresh(); setModal(null); } });
  };
  return <AdminLayout pageTitle="Customers"><PageHeading kicker="PEOPLE & RECORDS" title="Customers" description="Contact details and licence records, kept close at hand." actions={<Button kind="primary" onClick={() => setModal('create')} testId="button-add-customer"><Plus size={16} /> Add customer</Button>} />
    {Boolean(remove.error) && <p className="inline-error action-error" role="alert">{errorMessage(remove.error)}</p>}
    <section className="data-toolbar"><label className="search-box"><Search size={16} /><input data-testid="input-customer-search" placeholder="Search name, email or phone…" value={search} onChange={e => setSearch(e.target.value)} /></label><span className="toolbar-total"><Users size={15} /> {query.data?.length ?? '—'} records</span></section>
    <section className="panel table-panel">{query.isLoading ? <LoadState onRetry={() => query.refetch()} /> : query.error ? <LoadState error={query.error} onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState title={search ? 'No customers found' : 'Your customer book is open'} detail={search ? 'Adjust your search or check the spelling.' : 'Add a customer to keep their details ready for a booking.'} action={!search && <Button kind="primary" onClick={() => setModal('create')}><Plus size={15} /> Add customer</Button>} /> : <div className="table-scroll"><table><thead><tr><th>CUSTOMER</th><th>CONTACT</th><th>ADDRESS</th><th>DRIVING LICENCE</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{query.data.map(customer => <tr key={customer.id} data-testid={`row-customer-${customer.id}`}><td><button className="record-name" onClick={() => setDetailId(customer.id)} data-testid={`button-customer-detail-${customer.id}`}><span className="customer-avatar">{customer.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{customer.fullName}</strong><small>Customer record #{customer.id}</small></span></button></td><td><strong className="contact-primary">{customer.email}</strong><small className="subcell">{customer.phone}</small></td><td className="address-cell">{customer.address}</td><td className="mono-text">{customer.drivingLicenseNumber}</td><td><div className="row-actions"><button className="tiny-action" onClick={() => setModal(customer)} data-testid={`button-edit-customer-${customer.id}`}>Edit</button><button className="tiny-action danger-action" data-testid={`button-delete-customer-${customer.id}`} onClick={() => { if (window.confirm(`Delete customer record for ${customer.fullName}?`)) remove.mutate({ id: customer.id }, { onSuccess: refresh }); }}>Delete</button></div></td></tr>)}</tbody></table></div>}</section>
    <div className="table-foot"><span>{query.data?.length ?? 0} customer records</span><span>Personal information is restricted to administrators</span></div>
    {modal !== null && <FormModal title={modal === 'create' ? 'Add a customer' : 'Edit customer'} eyebrow={modal === 'create' ? 'NEW CUSTOMER RECORD' : `CUSTOMER #${modal.id}`} initial={initial} fields={customerFields} onClose={() => setModal(null)} onSubmit={data => save(data as CustomerInput)} pending={create.isPending || update.isPending} error={create.error || update.error} wide />}
    {detailId !== null && <Modal title={detailQuery.data?.fullName || 'Customer record'} eyebrow="CUSTOMER DETAILS" onClose={() => setDetailId(null)}>{detailQuery.isLoading ? <div className="skeleton-wrap"><div className="skeleton skeleton-block" /></div> : detailQuery.error ? <div className="detail-body"><p className="inline-error">{errorMessage(detailQuery.error)}</p><Button onClick={() => detailQuery.refetch()}>Try again</Button></div> : detailQuery.data && <div className="detail-body"><div className="detail-grid"><Detail label="Email" value={detailQuery.data.email} /><Detail label="Phone" value={detailQuery.data.phone} /><Detail label="Driving licence" value={detailQuery.data.drivingLicenseNumber} /><Detail label="Address" value={detailQuery.data.address} /></div><Button kind="primary" onClick={() => { if (detailQuery.data) setModal(detailQuery.data); setDetailId(null); }}>Edit customer <ArrowRight size={15} /></Button></div>}</Modal>}
  </AdminLayout>;
}

function BookingsPage() {
  const cache = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(false);
  const [returning, setReturning] = useState<Booking | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const query = useGetBookings({ search: search || undefined, status: status || undefined });
  const detailQuery = useGetBooking<Booking, unknown>(detailId ?? 0, { query: { enabled: detailId !== null, queryKey: getGetBookingQueryKey(detailId ?? 0) } });
  const customers = useGetCustomers();
  const vehicles = useGetAvailableVehicles();
  const allVehicles = useGetVehicles();
  const create = useCreateBooking(), update = useUpdateBooking(), remove = useDeleteBooking<unknown>(), cancel = useCancelBooking<unknown>(), returnBooking = useReturnBooking();
  useSuccessNotification(create.isSuccess, 'Booking created', 'The reservation has been saved.');
  useSuccessNotification(update.isSuccess, 'Booking updated', 'The reservation has been updated.');
  useSuccessNotification(cancel.isSuccess, 'Booking cancelled', 'The vehicle is available for other dates.');
  useSuccessNotification(remove.isSuccess, 'Booking deleted', 'The completed booking record was removed.');
  useSuccessNotification(returnBooking.isSuccess, 'Vehicle returned', 'The return was recorded and the vehicle is available.');
  const refresh = () => {
    cache.invalidateQueries({ queryKey: getGetBookingsQueryKey() });
    cache.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    cache.invalidateQueries({ queryKey: getGetAvailableVehiclesQueryKey() });
    cache.invalidateQueries({ queryKey: getGetVehiclesQueryKey() });
  };
  const [form, setForm] = useState<BookingInput>({ customerId: 0, vehicleId: 0, startDate: '', endDate: '' });
  const selectedVehicle = vehicles.data?.find(v => v.id === Number(form.vehicleId)) || allVehicles.data?.find(v => v.id === Number(form.vehicleId));
  const rentalDays = form.startDate && form.endDate && new Date(`${form.endDate}T12:00:00`) > new Date(`${form.startDate}T12:00:00`) ? Math.max(1, Math.ceil((new Date(`${form.endDate}T12:00:00`).getTime() - new Date(`${form.startDate}T12:00:00`).getTime()) / 86400000)) : 0;
  const estimated = (selectedVehicle?.dailyRentalPrice || 0) * rentalDays;
  const save = (data: BookingInput) => {
    const payload = { ...data, customerId: Number(data.customerId), vehicleId: Number(data.vehicleId) };
    const done = () => { refresh(); setModal(false); setEditing(null); setForm({ customerId: 0, vehicleId: 0, startDate: '', endDate: '' }); };
    if (editing) update.mutate({ id: editing.id, data: payload }, { onSuccess: done });
    else create.mutate({ data: payload }, { onSuccess: done });
  };
  return <AdminLayout pageTitle="Bookings"><PageHeading kicker="RESERVATIONS & RETURNS" title="Bookings" description="Plan rentals, track what’s out, and close the loop on returns." actions={<Button kind="primary" onClick={() => { setEditing(null); setForm({ customerId: 0, vehicleId: 0, startDate: '', endDate: '' }); setModal(true); }} testId="button-new-booking"><Plus size={16} /> New booking</Button>} />
    {Boolean(remove.error || cancel.error) && <p className="inline-error action-error" role="alert">{errorMessage(remove.error || cancel.error)}</p>}
    <section className="booking-summary"><div><span className="summary-icon"><CalendarDays size={18} /></span><div><small>BOOKING RECORDS</small><strong>{query.data?.length ?? '—'}</strong></div></div><p>Rental total is calculated from the vehicle’s daily rate and booked days.</p><div className="summary-price"><CircleDollarSign size={17} /><span>Rates in INR</span></div></section>
    <section className="data-toolbar"><label className="search-box"><Search size={16} /><input data-testid="input-booking-search" placeholder="Search customer or vehicle…" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="select-filter"><span>Status</span><select value={status} onChange={e => setStatus(e.target.value)} data-testid="select-booking-status"><option value="">All bookings</option><option value="BOOKED">Booked</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select><ChevronDown size={14} /></label></section>
    <section className="panel table-panel">{query.isLoading ? <LoadState onRetry={() => query.refetch()} /> : query.error ? <LoadState error={query.error} onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState title={search || status ? 'No bookings match' : 'No bookings on the books'} detail={search || status ? 'Try another search or status.' : 'Start a rental record when a customer is ready to go.'} action={!search && !status && <Button kind="primary" onClick={() => { setEditing(null); setModal(true); }}><Plus size={15} /> New booking</Button>} /> : <div className="table-scroll"><table><thead><tr><th>BOOKING</th><th>VEHICLE</th><th>RENTAL WINDOW</th><th>RETURNED</th><th>RENTAL TOTAL</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{query.data.map(booking => <tr key={booking.id} data-testid={`row-booking-${booking.id}`}><td><button className="booking-person booking-detail-button" onClick={() => setDetailId(booking.id)} data-testid={`button-booking-detail-${booking.id}`}><strong>{booking.customerName}</strong><small>Booking #{booking.id}</small></button></td><td>{booking.vehicleLabel}</td><td><span>{dateLabel(booking.startDate)}</span><small className="subcell">to {dateLabel(booking.endDate)}</small></td><td>{dateLabel(booking.actualReturnDate)}</td><td><strong>{money(booking.totalAmount)}</strong></td><td><Status value={booking.bookingStatus} /></td><td><BookingActions booking={booking} onCancel={() => { if (window.confirm(`Cancel booking #${booking.id} for ${booking.customerName}?`)) cancel.mutate({ id: booking.id }, { onSuccess: refresh }); }} onReturn={() => setReturning(booking)} onDelete={() => { if (window.confirm(`Delete booking record #${booking.id}?`)) remove.mutate({ id: booking.id }, { onSuccess: refresh }); }} onEdit={() => { setEditing(booking); setForm({ customerId: booking.customerId, vehicleId: booking.vehicleId, startDate: booking.startDate.slice(0, 10), endDate: booking.endDate.slice(0, 10) }); setModal(true); }} /></td></tr>)}</tbody></table></div>}</section>
    <div className="table-foot"><span>{query.data?.length ?? 0} booking records</span><span><Clock3 size={13} /> Return date is recorded at check-in</span></div>
    {modal && <Modal title={editing ? `Edit booking #${editing.id}` : 'Start a booking'} eyebrow={editing ? 'UPDATE RENTAL RECORD' : 'NEW RENTAL RECORD'} onClose={() => { setModal(false); setEditing(null); }} wide><form className="form-body" onSubmit={event => { event.preventDefault(); save(form); }}><div className="field-grid"><label className="field"><span>Customer</span><select required value={form.customerId || ''} onChange={e => setForm({ ...form, customerId: Number(e.target.value) })}><option value="" disabled>Select a customer</option>{customers.data?.map(customer => <option key={customer.id} value={customer.id}>{customer.fullName} · {customer.phone}</option>)}</select></label><label className="field"><span>{editing ? 'Vehicle' : 'Available vehicle'}</span><select required value={form.vehicleId || ''} onChange={e => setForm({ ...form, vehicleId: Number(e.target.value) })}><option value="" disabled>Select a vehicle</option>{(editing ? allVehicles.data : vehicles.data)?.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.brand} {vehicle.model} · {vehicle.vehicleNumber} · {money(vehicle.dailyRentalPrice)}/day</option>)}</select></label><Field label="Pick-up date" name="startDate" type="date" value={form.startDate} onChange={(_, value) => setForm({ ...form, startDate: value })} /><Field label="Due back" name="endDate" type="date" value={form.endDate} onChange={(_, value) => setForm({ ...form, endDate: value })} /></div><div className="estimate-box"><span><CircleDollarSign size={17} /> Estimated rental total</span><strong>{money(estimated)}</strong><small>{rentalDays ? `${rentalDays} ${rentalDays === 1 ? 'day' : 'days'} × ${money(selectedVehicle?.dailyRentalPrice)} / day` : 'Choose a vehicle and rental window to calculate'}</small></div>{Boolean(form.startDate && form.endDate && !rentalDays) && <p className="inline-error">The due-back date must be after the pick-up date.</p>}{Boolean(create.error || update.error) && <p className="inline-error" role="alert">{errorMessage(create.error || update.error)}</p>}{Boolean(customers.error || vehicles.error || (editing && allVehicles.error)) && <p className="inline-error">Customer or vehicle options could not be loaded. Check the API and try again.</p>}{!customers.data?.length && !customers.isLoading && <p className="inline-error">Add a customer before creating a booking.</p>}<div className="form-actions"><Button kind="quiet" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Button><Button kind="primary" type="submit" disabled={create.isPending || update.isPending || !customers.data?.length || !(editing ? allVehicles.data?.length : vehicles.data?.length) || !rentalDays}>{create.isPending || update.isPending ? 'Saving…' : editing ? 'Save booking' : 'Create booking'} <ArrowRight size={15} /></Button></div></form></Modal>}
    {returning && <ReturnModal booking={returning} pending={returnBooking.isPending} error={returnBooking.error} onClose={() => setReturning(null)} onSubmit={date => returnBooking.mutate({ id: returning.id, data: { actualReturnDate: date } }, { onSuccess: () => { refresh(); setReturning(null); } })} />}
    {detailId !== null && <Modal title={`Booking #${detailId}`} eyebrow="RENTAL RECORD" onClose={() => setDetailId(null)}>{detailQuery.isLoading ? <div className="skeleton-wrap"><div className="skeleton skeleton-block" /></div> : detailQuery.error ? <div className="detail-body"><p className="inline-error">{errorMessage(detailQuery.error)}</p><Button onClick={() => detailQuery.refetch()}>Try again</Button></div> : detailQuery.data && <div className="detail-body"><div className="detail-hero"><CalendarDays size={34} /><Status value={detailQuery.data.bookingStatus} /></div><div className="detail-grid"><Detail label="Customer" value={detailQuery.data.customerName} /><Detail label="Vehicle" value={detailQuery.data.vehicleLabel} /><Detail label="Rental window" value={`${dateLabel(detailQuery.data.startDate)} – ${dateLabel(detailQuery.data.endDate)}`} /><Detail label="Actual return" value={dateLabel(detailQuery.data.actualReturnDate)} /><Detail label="Rental total" value={money(detailQuery.data.totalAmount)} /><Detail label="Created" value={dateLabel(detailQuery.data.createdAt)} /></div></div>}</Modal>}
  </AdminLayout>;
}

function BookingActions({ booking, onCancel, onReturn, onDelete, onEdit }: { booking: Booking; onCancel: () => void; onReturn: () => void; onDelete: () => void; onEdit: () => void }) {
  const status = statusKey(booking.bookingStatus);
  return <div className="row-actions booking-actions">{status === 'booked' && <><button className="tiny-action" onClick={onEdit} data-testid={`button-edit-booking-${booking.id}`}>Edit</button><button className="tiny-action danger-action" onClick={onCancel} data-testid={`button-cancel-booking-${booking.id}`}>Cancel</button></>}{status === 'active' && <button className="tiny-action" onClick={onReturn} data-testid={`button-return-booking-${booking.id}`}>Return</button>}{['completed', 'cancelled'].includes(status) && <button className="tiny-action danger-action" onClick={onDelete} data-testid={`button-delete-booking-${booking.id}`}>Delete</button>}</div>;
}
function ReturnModal({ booking, pending, error, onClose, onSubmit }: { booking: Booking; pending: boolean; error?: unknown; onClose: () => void; onSubmit: (date: string) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return <Modal title="Check in the vehicle" eyebrow={`BOOKING #${booking.id} · ${booking.vehicleLabel}`} onClose={onClose}><form className="form-body" onSubmit={e => { e.preventDefault(); onSubmit(date); }}><p className="return-copy">Record the actual return date for <strong>{booking.customerName}</strong>. This closes the rental record.</p><Field label="Actual return date" name="actualReturnDate" type="date" value={date} onChange={(_, value) => setDate(value)} />{Boolean(error) && <p className="inline-error" role="alert">{errorMessage(error)}</p>}<div className="form-actions"><Button kind="quiet" onClick={onClose}>Not yet</Button><Button kind="primary" type="submit" disabled={pending}>{pending ? 'Recording…' : 'Confirm return'} <Check size={15} /></Button></div></form></Modal>;
}

function RoutedBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}
function Router() {
  return <RoutedBoundary><Routes><Route path="/" element={<PublicLandingPage />} /><Route path="/customer/login" element={<CustomerAccessPage mode="login" />} /><Route path="/customer/register" element={<CustomerAccessPage mode="register" />} /><Route path="/my-rentals" element={<CustomerRentalsPage />} /><Route path="/rent" element={<CustomerBookingPage />} /><Route path="/login" element={<Login />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/vehicles" element={<VehiclesPage />} /><Route path="/customers" element={<CustomersPage />} /><Route path="/bookings" element={<BookingsPage />} /><Route path="*" element={<NotFound />} /></Routes></RoutedBoundary>;
}
function App() {
  return <QueryClientProvider client={client}><TooltipProvider><BrowserRouter basename={import.meta.env.BASE_URL}><Router /></BrowserRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
