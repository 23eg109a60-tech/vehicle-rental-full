import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGetAvailableVehiclesQueryKey, useGetAvailableVehicles } from '@workspace/api-client-react';
import type { Vehicle } from '@workspace/api-client-react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import './public-landing.css';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

const DEMO_VEHICLES: Vehicle[] = [
  { id: 1, vehicleNumber: 'MH12AB1234', brand: 'Toyota', model: 'Innova Crysta', vehicleType: 'SUV', color: 'Pearl White', dailyRentalPrice: 4200, availabilityStatus: 'AVAILABLE', imageUrl: null },
  { id: 2, vehicleNumber: 'KA03CD5678', brand: 'Hyundai', model: 'Creta', vehicleType: 'SUV', color: 'Titan Grey', dailyRentalPrice: 3200, availabilityStatus: 'AVAILABLE', imageUrl: null },
  { id: 3, vehicleNumber: 'MH01EF9012', brand: 'Honda', model: 'City', vehicleType: 'Sedan', color: 'Radiant Red', dailyRentalPrice: 2600, availabilityStatus: 'AVAILABLE', imageUrl: null },
  { id: 4, vehicleNumber: 'MH14GH3456', brand: 'Tata', model: 'Nexon EV', vehicleType: 'Electric', color: 'Ocean Blue', dailyRentalPrice: 3500, availabilityStatus: 'AVAILABLE', imageUrl: null },
  { id: 5, vehicleNumber: 'KA05JK7890', brand: 'Maruti Suzuki', model: 'Swift', vehicleType: 'Hatchback', color: 'Arctic White', dailyRentalPrice: 1800, availabilityStatus: 'AVAILABLE', imageUrl: null },
  { id: 6, vehicleNumber: 'MH02WX2468', brand: 'Honda', model: 'Amaze', vehicleType: 'Sedan', color: 'Metallic Silver', dailyRentalPrice: 2300, availabilityStatus: 'AVAILABLE', imageUrl: null },
  { id: 7, vehicleNumber: 'KA51YZ1357', brand: 'Mahindra', model: 'XUV700', vehicleType: 'SUV', color: 'Everest White', dailyRentalPrice: 5200, availabilityStatus: 'AVAILABLE', imageUrl: null },
  { id: 8, vehicleNumber: 'MH14QX8642', brand: 'Maruti Suzuki', model: 'Baleno', vehicleType: 'Hatchback', color: 'Nexa Blue', dailyRentalPrice: 2200, availabilityStatus: 'AVAILABLE', imageUrl: null },
  { id: 9, vehicleNumber: 'DL8CST6789', brand: 'Tata', model: 'Tiago EV', vehicleType: 'Electric', color: 'Tropical Mist', dailyRentalPrice: 2500, availabilityStatus: 'AVAILABLE', imageUrl: null },
  { id: 10, vehicleNumber: 'MH01EV7521', brand: 'Kia', model: 'Carens', vehicleType: 'SUV', color: 'Sparkling Silver', dailyRentalPrice: 3700, availabilityStatus: 'AVAILABLE', imageUrl: null },
];

function VehicleVisual({ vehicle }: { vehicle: Vehicle }) {
  if (vehicle.imageUrl) {
    return (
      <img
        className="rh-vehicle-image"
        src={vehicle.imageUrl}
        alt={`${vehicle.brand} ${vehicle.model}`}
        loading="lazy"
      />
    );
  }

  return (
    <div className="rh-vehicle-placeholder" aria-label={`${vehicle.vehicleType} vehicle`}>
      <div className="rh-placeholder-sun" />
      <div className="rh-placeholder-road" />
      <svg viewBox="0 0 360 150" role="img" aria-hidden="true" className="rh-car-illustration">
        <path d="M74 91h18l19-32c5-9 13-14 24-14h89c12 0 21 5 28 15l20 31h18c8 0 14 6 14 14v17H59v-17c0-8 7-14 15-14Z" />
        <path className="rh-car-window" d="m123 59-17 30h66V52h-37c-5 0-9 2-12 7Zm60-7v37h67l-18-27c-4-7-10-10-18-10h-31Z" />
        <path className="rh-car-trim" d="M80 99h219M178 50v42" />
        <circle cx="111" cy="119" r="18" />
        <circle cx="111" cy="119" r="7" className="rh-wheel-center" />
        <circle cx="260" cy="119" r="18" />
        <circle cx="260" cy="119" r="7" className="rh-wheel-center" />
      </svg>
      <span className="rh-placeholder-caption">ROADHOUSE / READY LINE</span>
    </div>
  );
}

function VehicleCard({ vehicle, index, demo = false }: { vehicle: Vehicle; index: number; demo?: boolean }) {
  return (
    <article className="rh-vehicle-card" style={{ animationDelay: `${index * 75}ms` }} data-testid={`vehicle-card-${vehicle.id}`}>
      <div className="rh-card-visual">
        <VehicleVisual vehicle={vehicle} />
        <span className={`rh-available-pill ${demo ? 'rh-demo-pill' : ''}`}><i /> {demo ? 'Sample vehicle' : 'Available now'}</span>
        <span className="rh-type-label">{vehicle.vehicleType}</span>
      </div>
      <div className="rh-card-content">
        <div className="rh-card-title-line">
          <div>
            <p className="rh-card-make">{vehicle.brand}</p>
            <h3>{vehicle.model}</h3>
          </div>
          <span className="rh-card-number">#{String(vehicle.id).padStart(2, '0')}</span>
        </div>
        <div className="rh-vehicle-meta">
          <span><i className="rh-color-dot" style={{ background: vehicle.color.toLowerCase() }} />{vehicle.color}</span>
          <span><Check size={13} /> {demo ? 'Preview listing' : 'Online reservations'}</span>
        </div>
        <div className="rh-card-bottom">
          <div className="rh-rate"><strong>{formatPrice(vehicle.dailyRentalPrice)}</strong><span>/ day</span></div>
          {demo
            ? <span className="rh-demo-only" aria-disabled="true">Booking paused</span>
            : <Link to={`/rent?vehicleId=${vehicle.id}`} className="rh-book-link">Rent this vehicle <ArrowRight size={14} /></Link>}
        </div>
      </div>
    </article>
  );
}

function VehicleSkeleton() {
  return (
    <div className="rh-vehicle-grid" aria-label="Loading available vehicles">
      {[0, 1, 2].map((item) => (
        <div className="rh-skeleton-card" key={item}>
          <div className="rh-skeleton rh-skeleton-image" />
          <div className="rh-skeleton-copy">
            <div className="rh-skeleton rh-skeleton-line" />
            <div className="rh-skeleton rh-skeleton-line short" />
            <div className="rh-skeleton rh-skeleton-line medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PublicLandingPage() {
  const vehiclesQuery = useGetAvailableVehicles({ query: { queryKey: getGetAvailableVehiclesQueryKey(), staleTime: 30_000, retry: false } });
  const usingDemoFleet = vehiclesQuery.isError;
  const vehicles = usingDemoFleet ? DEMO_VEHICLES : vehiclesQuery.data ?? [];
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All vehicles');
  const [mobileMenu, setMobileMenu] = useState(false);
  const types = useMemo(() => ['All vehicles', ...Array.from(new Set(vehicles.map((vehicle) => vehicle.vehicleType))).sort()], [vehicles]);
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesSearch = `${vehicle.brand} ${vehicle.model} ${vehicle.vehicleType}`.toLowerCase().includes(term);
      return matchesSearch && (type === 'All vehicles' || vehicle.vehicleType === type);
    });
  }, [vehicles, search, type]);

  return (
    <main className="roadhouse-public">
      <div className="rh-topline">
        <div className="rh-topline-inner">
          <span><Check size={13} /> {usingDemoFleet ? 'Sample vehicles for preview' : 'Vehicles marked available by the fleet team'}</span>
          <span className="rh-topline-note"><ShieldCheck size={13} /> {usingDemoFleet ? 'Online bookings are paused' : 'Reserve online with a renter account'}</span>
        </div>
      </div>

      <header className="rh-header">
        <div className="rh-header-inner">
          <Link to="/" className="rh-brand" aria-label="Roadhouse home">
            <span className="rh-brand-mark"><span /></span>
            <span className="rh-brand-copy"><b>ROADHOUSE</b><small>LOCAL RENTALS, WELL RUN</small></span>
          </Link>
          <button className="rh-menu-toggle" type="button" aria-label={mobileMenu ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenu} onClick={() => setMobileMenu((open) => !open)}>
            {mobileMenu ? <X size={21} /> : <Menu size={20} />}
          </button>
          <nav className={`rh-nav ${mobileMenu ? 'rh-nav-open' : ''}`} aria-label="Main navigation">
            <a href="#available" onClick={() => setMobileMenu(false)}>Available vehicles</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>How it works</a>
            <Link to="/customer/login" className="rh-account-link" onClick={() => setMobileMenu(false)}>Renter sign in</Link>
            <Link to="/login" className="rh-desk-link" onClick={() => setMobileMenu(false)}>Admin <ArrowUpRight size={15} /></Link>
          </nav>
        </div>
      </header>

      <section className="rh-hero">
        <div className="rh-hero-grid" aria-hidden="true" />
        <div className="rh-hero-inner">
          <div className="rh-hero-copy">
            <p className="rh-eyebrow"><span /> A better way to get there</p>
            <h1>Good cars.<br /><em>Good to go.</em></h1>
            <p className="rh-hero-description">{usingDemoFleet ? 'Preview sample vehicles and daily rates while live inventory is unavailable.' : 'Browse vehicles currently listed as available, compare daily rates, and find the type that fits your journey.'}</p>
            <a className="rh-primary-cta" href="#available">Explore the fleet <ArrowRight size={17} /></a>
            <div className="rh-trust-row">
               <span><ShieldCheck size={16} /> Fleet-office managed</span>
              <i />
              <span><Check size={15} /> Clear daily rates</span>
            </div>
          </div>
          <div className="rh-hero-art" aria-label="Roadhouse fleet vehicle">
            <div className="rh-art-stamp"><span>THE READY LINE</span><b>01</b></div>
            <div className="rh-art-horizon" />
            <div className="rh-art-road"><span className="rh-road-marking" /></div>
            <div className="rh-art-car">
              <div className="rh-art-roof" />
              <div className="rh-art-body"><span className="rh-art-window" /><span className="rh-art-door-line" /><span className="rh-art-light" /></div>
              <span className="rh-art-wheel rh-wheel-one" /><span className="rh-art-wheel rh-wheel-two" />
            </div>
            <div className="rh-art-label"><span>ROADHOUSE / FIELD NOTES</span><b>BUILT FOR THE EVERYDAY MILES</b></div>
            <div className="rh-art-orbit" />
          </div>
        </div>
        <div className="rh-hero-footer">
          <span>DEPENDABLE VEHICLES, WITHOUT THE RUNAROUND</span>
          <span>EST. FOR THE ROAD AHEAD <ArrowRight size={13} /></span>
        </div>
      </section>

      <section className="rh-fleet-section" id="available">
        <div className="rh-section-heading">
          <div>
            <p className="rh-eyebrow">THE READY LINE <span className="rh-heading-rule" /></p>
            <h2>Pick your kind<br className="rh-mobile-break" /> of <em>getaway.</em></h2>
          </div>
          <p className="rh-section-intro">{usingDemoFleet ? 'Browse sample vehicle listings. Online reservations return when live inventory is available.' : 'Browse live fleet availability and daily rates, then reserve online with a renter account.'}</p>
        </div>

        <div className="rh-browser">
          <div className="rh-browser-intro">
            <span className="rh-browser-mark"><Sparkles size={17} /></span>
            <span><b>{usingDemoFleet ? 'Demo fleet preview' : 'What’s ready today'}</b><small>{usingDemoFleet ? 'Sample cars for browsing only' : 'Live availability from the Roadhouse fleet'}</small></span>
            {!vehiclesQuery.isLoading && <span className="rh-live-count">{vehicles.length} {usingDemoFleet ? 'sample cars' : vehicles.length === 1 ? 'vehicle' : 'vehicles'}</span>}
          </div>
          <div className="rh-filters">
            <label className="rh-search-field">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search vehicles by make, model, or type</span>
              <input data-testid="input-public-vehicle-search" type="search" placeholder="Try “sedan” or “Toyota”" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label className="rh-type-filter">
              <span className="sr-only">Filter vehicle type</span>
              <select data-testid="select-public-vehicle-type" value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter by vehicle type">
                {types.map((vehicleType) => <option key={vehicleType} value={vehicleType}>{vehicleType === 'All vehicles' ? 'All vehicle types' : vehicleType}</option>)}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </label>
          </div>
        </div>

        {vehiclesQuery.isLoading ? (
          <VehicleSkeleton />
        ) : vehicles.length === 0 ? (
          <div className="rh-result-state">
            <span className="rh-state-icon"><Tag size={20} /></span>
            <h3>Nothing on the line just yet.</h3>
            <p>Our fleet team hasn’t marked any vehicles available at the moment. Check back soon.</p>
          </div>
        ) : (
          <>
            {usingDemoFleet && <div className="rh-demo-notice" role="status">
              <p>These sample cars are for preview only. Bookings are paused until live inventory is available.</p>
              <button className="rh-retry-button" onClick={() => void vehiclesQuery.refetch()} type="button">Retry live inventory <ArrowRight size={15} /></button>
            </div>}
            {results.length === 0 ? (
              <div className="rh-result-state">
                <span className="rh-state-icon"><Search size={20} /></span>
                <h3>No rides match that search.</h3>
                <p>Try another make, model, or vehicle type to see what’s ready.</p>
                <button className="rh-retry-button" onClick={() => { setSearch(''); setType('All vehicles'); }} type="button">Clear filters <ArrowRight size={15} /></button>
              </div>
            ) : (
              <>
                <div className="rh-results-caption" aria-live="polite"><span>{results.length} {usingDemoFleet ? 'sample listings' : results.length === 1 ? 'match' : 'matches'}</span><span>{usingDemoFleet ? 'Demo rates for preview' : 'Daily rates, clearly shown'}</span></div>
                <div className="rh-vehicle-grid">{results.map((vehicle, index) => <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} demo={usingDemoFleet} />)}</div>
              </>
            )}
          </>
        )}
      </section>

      <section className="rh-how-section" id="how-it-works">
        <div className="rh-how-aside">
          <p className="rh-eyebrow">NO SURPRISES. JUST THE ROAD.</p>
          <h2>Simple as<br /><em>it should be.</em></h2>
          <p>Choose a vehicle and rental dates, then keep the reservation details in your renter account.</p>
          <span className="rh-aside-index">ROADHOUSE / 02</span>
        </div>
        <div className="rh-steps">
          <article className="rh-step">
            <span className="rh-step-number">01</span><div><h3>Find your fit</h3><p>Browse what’s available and compare vehicle types and daily rates.</p></div><ArrowRight size={17} />
          </article>
          <article className="rh-step">
            <span className="rh-step-number">02</span><div><h3>Reserve online</h3><p>Sign in, choose your rental dates, and confirm your booking with the live daily rate.</p></div><ArrowRight size={17} />
          </article>
          <article className="rh-step">
            <span className="rh-step-number">03</span><div><h3>Track your rental</h3><p>View your reservation status and upcoming rental details from your account.</p></div><ArrowRight size={17} />
          </article>
          <p className="rh-reservation-note"><ShieldCheck size={15} /> Create an account to reserve, review, and manage your bookings.</p>
        </div>
      </section>

      <section className="rh-contact-band">
        <div className="rh-contact-ornament" aria-hidden="true"><span /><span /><span /></div>
        <div><p className="rh-eyebrow">YOUR NEXT DRIVE STARTS HERE</p><h2>Find your vehicle.<br /><em>Book it online.</em></h2></div>
        <div className="rh-contact-right"><p>Create a renter account to reserve an available vehicle and keep your booking details together.</p><Link to="/customer/register" className="rh-contact-link">Create renter account <ArrowRight size={16} /></Link><small>Already registered? <Link to="/customer/login">Sign in</Link> <span>·</span> Fleet team? <Link to="/login">Administrator sign in</Link></small></div>
      </section>

      <footer className="rh-footer">
        <Link to="/" className="rh-brand rh-footer-brand" aria-label="Roadhouse home"><span className="rh-brand-mark"><span /></span><span className="rh-brand-copy"><b>ROADHOUSE</b><small>LOCAL RENTALS, WELL RUN</small></span></Link>
        <p>Vehicle availability. Clear daily rates. Organized rentals.</p>
        <div className="rh-footer-right"><Link to="/customer/login">Renter sign in</Link><Link to="/login">Admin <ArrowUpRight size={13} /></Link><span>© {new Date().getFullYear()} ROADHOUSE</span></div>
      </footer>
    </main>
  );
}
