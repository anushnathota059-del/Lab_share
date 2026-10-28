import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowRight, BookOpenCheck, CalendarDays, Check, CheckCircle2,
  ChevronRight, Clock3, FlaskConical, MapPin, Search, SlidersHorizontal,
  Sparkles, Wrench, XCircle, Hourglass, ClipboardList, AlertCircle,
} from 'lucide-react';
import {
  useCreateBooking, useGetEquipment, useListBookings, useListEquipment,
  getGetEquipmentQueryKey, getListBookingsQueryKey,
} from '@workspace/api-client-react';
import type { Booking, BookingInput, Equipment } from '@workspace/api-client-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Brand() {
  return <Link href="/" className="brand" data-testid="link-brand">
    <span className="brand-mark"><FlaskConical size={19} strokeWidth={2.2} /></span>
    <span>LabShare</span>
  </Link>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <div className="shell">
    <header className="topbar">
      <div className="topbar-inner">
        <Brand />
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/" className={`nav-link ${location === '/' || location.startsWith('/equipment') ? 'active' : ''}`} data-testid="link-discover">Discover</Link>
          <Link href="/requests" className={`nav-link ${location === '/requests' ? 'active' : ''}`} data-testid="link-my-requests">My requests</Link>
        </nav>
        <div className="nav-right"><span className="campus-chip"><span className="campus-dot">●</span> Campus lab network</span></div>
      </div>
    </header>
    <main className="main">{children}</main>
  </div>;
}

function LoadingCards() {
  return <div className="equipment-grid" aria-label="Loading equipment">
    {[1, 2, 3].map((item) => <div className="skeleton-card" key={item}>
      <div className="skeleton skeleton-photo" />
      <div className="skeleton-lines"><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line" style={{ width: '65%' }} /><div className="skeleton skeleton-line" style={{ width: '42%', marginTop: 24 }} /></div>
    </div>)}
  </div>;
}

function EquipmentImage({ item, detail = false }: { item: Equipment; detail?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed || !item.imageUrl) {
    return <div className={`${detail ? 'detail-photo detail-photo-fallback' : 'photo-fallback'}`} data-testid={`img-equipment-${item.id}`}><Wrench size={detail ? 38 : 30} /></div>;
  }
  return <img className={detail ? 'detail-photo' : ''} src={item.imageUrl} alt={item.name} onError={() => setFailed(true)} data-testid={`img-equipment-${item.id}`} />;
}

function Availability({ value }: { value: Equipment['availability'] }) {
  const label = value === 'available' ? 'Available' : value === 'limited' ? 'Limited access' : 'Unavailable';
  return <span className={`availability ${value}`} data-testid={`status-availability-${value}`}>{label}</span>;
}

function EquipmentCard({ item }: { item: Equipment }) {
  return <article className="equipment-card fade-in" data-testid={`card-equipment-${item.id}`}>
    <Link href={`/equipment/${item.id}`} className="equipment-photo" aria-label={`View ${item.name}`} data-testid={`link-equipment-${item.id}`}>
      <EquipmentImage item={item} />
      <Availability value={item.availability} />
    </Link>
    <div className="equipment-body">
      <div className="category-label">{item.category}</div>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <div className="equipment-meta"><MapPin size={14} />{item.location}</div>
      <div className="card-bottom">
        <Link href={`/equipment/${item.id}`} className="text-link" data-testid={`link-details-${item.id}`}>View equipment <ArrowRight size={15} /></Link>
        <span style={{ color: '#8796a1', display: 'inline-flex' }}><ChevronRight size={17} /></span>
      </div>
    </div>
  </article>;
}

function QueryError({ retry, message = 'We could not load this right now.' }: { retry: () => void; message?: string }) {
  return <div className="state-panel" role="alert">
    <div className="state-icon"><AlertCircle size={21} /></div>
    <h3>Something went off track</h3><p>{message} Your work is safe. Please try again.</p>
    <button className="button button-outline" onClick={retry} data-testid="button-retry">Try again</button>
  </div>;
}

function DiscoverPage() {
  const equipmentQuery = useListEquipment();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All equipment');
  const equipment = equipmentQuery.data ?? [];
  const categories = useMemo(() => ['All equipment', ...Array.from(new Set(equipment.map((item) => item.category)))], [equipment]);
  const filtered = useMemo(() => equipment.filter((item) => {
    const phrase = search.trim().toLowerCase();
    const matchesText = !phrase || [item.name, item.category, item.description, item.location].some((part) => part.toLowerCase().includes(phrase));
    return matchesText && (category === 'All equipment' || item.category === category);
  }), [equipment, search, category]);

  return <div className="fade-in">
    <section className="hero">
      <div className="hero-content">
        <div className="eyebrow">Make more in the lab</div>
        <h1>Great projects start with the right tools.</h1>
        <p>Find the equipment you need, check the lab requirements, and request a time that works for you.</p>
        <form className="hero-search" onSubmit={(event) => event.preventDefault()}>
          <label className="search-wrap"><Search size={18} /><input type="search" aria-label="Search equipment" placeholder="Try “oscilloscope” or “soldering”" value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-search-equipment" /></label>
          <button className="button button-light" type="submit" data-testid="button-search">Search equipment</button>
        </form>
      </div>
    </section>
    <div className="section-heading">
      <div><h2>Explore the equipment library</h2><p>Shared tools, ready for your next build.</p></div>
      {!equipmentQuery.isLoading && !equipmentQuery.isError && <span className="count-label" data-testid="text-equipment-count">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span>}
    </div>
    {!equipmentQuery.isLoading && !equipmentQuery.isError && categories.length > 1 && <div className="filter-row">
      <span className="filter-label"><SlidersHorizontal size={15} /> Filter by</span>
      {categories.map((name) => <button key={name} className={`filter-chip ${category === name ? 'selected' : ''}`} onClick={() => setCategory(name)} aria-pressed={category === name} data-testid={`filter-category-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{name}</button>)}
    </div>}
    {equipmentQuery.isLoading ? <LoadingCards /> : equipmentQuery.isError ? <QueryError retry={() => void equipmentQuery.refetch()} message="The equipment library is taking a moment to respond." /> :
      equipment.length === 0 ? <div className="state-panel"><div className="state-icon"><Wrench size={21} /></div><h3>The library is quiet for now</h3><p>There isn’t any equipment listed yet. Check back soon or ask your lab coordinator.</p></div> :
      filtered.length === 0 ? <div className="state-panel"><div className="state-icon"><Search size={21} /></div><h3>No matching equipment</h3><p>Try another search or choose a different category to see what’s available.</p><button className="button button-outline" onClick={() => { setSearch(''); setCategory('All equipment'); }} data-testid="button-clear-filters">Clear filters</button></div> :
      <div className="equipment-grid">{filtered.map((item) => <EquipmentCard item={item} key={item.id} />)}</div>}
    <div style={{ marginTop: 37, display: 'flex', alignItems: 'center', gap: 12, color: '#788a98', fontSize: 12 }}>
      <span className="icon-tile" style={{ width: 34, height: 34 }}><Sparkles size={16} /></span>
      <span>Not sure what you need? Your lab staff can help match a tool to your project.</span>
    </div>
  </div>;
}

function DetailPage() {
  const params = useParams<{ id?: string }>();
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0;
  const equipmentQuery = useGetEquipment(validId ? id : 0, { query: { enabled: validId, queryKey: getGetEquipmentQueryKey(validId ? id : 0) } });
  const [, setLocation] = useLocation();
  const item = equipmentQuery.data;
  if (!validId) return <QueryError retry={() => setLocation('/')} message="That equipment link is not valid." />;
  if (equipmentQuery.isLoading) return <div className="fade-in"><div className="skeleton" style={{ height: 15, width: 180, marginBottom: 24 }} /><div className="detail-grid"><div><div className="skeleton" style={{ height: 380, borderRadius: 16 }} /><div className="skeleton" style={{ height: 37, width: '60%', marginTop: 20 }} /></div><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></div></div>;
  if (equipmentQuery.isError) return <QueryError retry={() => void equipmentQuery.refetch()} message="We could not load this equipment’s details." />;
  if (!item) return <QueryError retry={() => setLocation('/')} message="This equipment may have been removed from the library." />;
  const canRequest = item.availability !== 'unavailable';
  return <div className="fade-in">
    <div className="crumbs"><Link href="/" data-testid="link-back-discover">Discover</Link><ChevronRight size={14} /><span>{item.name}</span></div>
    <div className="detail-grid">
      <section>
        <EquipmentImage item={item} detail />
        <div className="detail-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><span className="category-label">{item.category}</span><span className={`availability ${item.availability}`} style={{ position: 'static' }}>{item.availability === 'available' ? 'Available' : item.availability === 'limited' ? 'Limited access' : 'Unavailable'}</span></div>
          <h1>{item.name}</h1>
          <p className="detail-description">{item.description}</p>
        </div>
      </section>
      <aside className="detail-aside">
        <h2 className="aside-title">Equipment details</h2>
        <div className="location-block">
          <span className="icon-tile"><MapPin size={18} /></span>
          <div><p className="meta-title">Pickup location</p><p className="meta-value" data-testid="text-equipment-location">{item.location}</p></div>
        </div>
        <section className="detail-side-section">
          <h3 className="aside-title" style={{ marginBottom: 12 }}>Before you request</h3>
          {item.eligibility.length ? <ul className="bullet-list">{item.eligibility.map((rule, index) => <li key={`${index}-${rule}`}><CheckCircle2 size={15} />{rule}</li>)}</ul> : <p className="page-subtitle" style={{ fontSize: 13 }}>No special eligibility requirements listed.</p>}
        </section>
        <section className="detail-side-section">
          <h3 className="aside-title" style={{ marginBottom: 12 }}>Usage rules</h3>
          {item.rules.length ? <ul className="bullet-list">{item.rules.map((rule, index) => <li key={`${index}-${rule}`}><Check size={15} />{rule}</li>)}</ul> : <p className="page-subtitle" style={{ fontSize: 13 }}>Follow standard lab safety procedures.</p>}
        </section>
        {canRequest ? <Link href={`/bookings/new?equipmentId=${item.id}`} className="button button-primary full-button" data-testid="button-request-equipment">Request this equipment <ArrowRight size={16} /></Link> :
          <button className="button button-outline full-button" disabled data-testid="button-unavailable">Currently unavailable</button>}
        <div className="notice">Requests are reviewed by the lab team. You’ll see the decision in My requests.</div>
      </aside>
    </div>
  </div>;
}

const bookingSchema = z.object({
  equipmentId: z.number().positive(),
  studentName: z.string().trim().min(1, 'Enter your name.').max(120),
  studentEmail: z.string().trim().email('Enter a valid student email.').max(254, 'Email is too long.'),
  projectPurpose: z.string().trim().min(10, 'Please add a little more about your project (at least 10 characters).').max(1000, 'Keep the project description under 1,000 characters.'),
  requestedDate: z.string().min(1, 'Choose a date.'),
  requestedTime: z.string().min(1, 'Choose a time.').max(40),
});

function BookingPage() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const equipmentId = Number(params.get('equipmentId'));
  const validId = Number.isInteger(equipmentId) && equipmentId > 0;
  const equipmentQuery = useGetEquipment(validId ? equipmentId : 0, { query: { enabled: validId, queryKey: getGetEquipmentQueryKey(validId ? equipmentId : 0) } });
  const createBooking = useCreateBooking();
  const queryClient = useQueryClient();
  const item = equipmentQuery.data;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { equipmentId: validId ? equipmentId : 0, studentName: '', studentEmail: '', projectPurpose: '', requestedDate: '', requestedTime: '' },
  });

  if (!validId) return <QueryError retry={() => setLocation('/')} message="Choose equipment from the library before making a request." />;
  if (equipmentQuery.isLoading) return <div className="skeleton" style={{ height: 500, borderRadius: 15 }} />;
  if (equipmentQuery.isError) return <QueryError retry={() => void equipmentQuery.refetch()} message="We could not load the selected equipment." />;
  if (!item) return <QueryError retry={() => setLocation('/')} message="This equipment is no longer listed." />;
  if (item.availability === 'unavailable') return <div className="state-panel"><div className="state-icon"><Wrench size={21} /></div><h3>Not available to request</h3><p>{item.name} is currently unavailable. Browse the library for another tool.</p><Link href="/" className="button button-outline" data-testid="link-browse-equipment">Browse equipment</Link></div>;

  const submit = form.handleSubmit((values) => {
    createBooking.mutate({ data: values }, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        setLocation('/requests');
      },
    });
  });
  const fieldError = (name: keyof BookingInput) => form.formState.errors[name]?.message;

  return <div className="fade-in">
    <div className="crumbs"><Link href="/" data-testid="link-booking-discover">Discover</Link><ChevronRight size={14} /><Link href={`/equipment/${item.id}`} data-testid="link-booking-equipment">{item.name}</Link><ChevronRight size={14} /><span>Request equipment</span></div>
    <div className="eyebrow">Equipment request</div>
    <h1 className="page-title">Let’s get your lab time on the calendar.</h1>
    <p className="page-subtitle">Tell us a little about your project and when you’d like to use the equipment.</p>
    <div className="form-layout">
      <form className="form-card" onSubmit={submit} noValidate>
        <input type="hidden" {...form.register('equipmentId', { valueAsNumber: true })} value={item.id} />
        <h2 className="form-section-label"><span className="step-number">1</span> Your details</h2>
        <div className="form-grid">
          <div className="field"><label htmlFor="studentName">Full name</label><input id="studentName" placeholder="Your name" autoComplete="name" {...form.register('studentName')} data-testid="input-student-name" />{fieldError('studentName') && <span className="form-error">{fieldError('studentName')}</span>}</div>
          <div className="field"><label htmlFor="studentEmail">Student email</label><input id="studentEmail" type="email" placeholder="you@college.edu" autoComplete="email" {...form.register('studentEmail')} data-testid="input-student-email" />{fieldError('studentEmail') && <span className="form-error">{fieldError('studentEmail')}</span>}</div>
        </div>
        <h2 className="form-section-label" style={{ marginTop: 12 }}><span className="step-number">2</span> When do you need it?</h2>
        <div className="form-grid">
          <div className="field"><label htmlFor="requestedDate">Requested date</label><input id="requestedDate" type="date" min={today} {...form.register('requestedDate')} data-testid="input-requested-date" />{fieldError('requestedDate') && <span className="form-error">{fieldError('requestedDate')}</span>}</div>
          <div className="field"><label htmlFor="requestedTime">Preferred time</label><select id="requestedTime" {...form.register('requestedTime')} data-testid="select-requested-time"><option value="">Choose a time slot</option><option value="Morning (8am–12pm)">Morning (8am–12pm)</option><option value="Afternoon (12pm–4pm)">Afternoon (12pm–4pm)</option><option value="Evening (4pm–8pm)">Evening (4pm–8pm)</option></select>{fieldError('requestedTime') && <span className="form-error">{fieldError('requestedTime')}</span>}</div>
        </div>
        <h2 className="form-section-label" style={{ marginTop: 12 }}><span className="step-number">3</span> Tell us about your project</h2>
        <div className="field"><label htmlFor="projectPurpose">What are you building or learning?</label><textarea id="projectPurpose" placeholder="A few sentences about your project helps the lab team prepare the right setup." maxLength={1000} {...form.register('projectPurpose')} data-testid="input-project-purpose" /><span className="field-help">Include any setup or support you may need. At least 10 characters.</span>{fieldError('projectPurpose') && <span className="form-error">{fieldError('projectPurpose')}</span>}</div>
        {createBooking.isError && <div className="form-error" role="alert" data-testid="text-submit-error">Your request didn’t go through. Please check your details and try again.</div>}
        <button className="button button-primary" type="submit" disabled={createBooking.isPending} data-testid="button-submit-request">{createBooking.isPending ? 'Sending request…' : 'Submit request'} {!createBooking.isPending && <ArrowRight size={16} />}</button>
        <p className="field-help" style={{ marginTop: 12, maxWidth: 480 }}>Your request will be reviewed by lab staff. You can follow its status from My requests.</p>
      </form>
      <aside>
        <div className="booking-summary">
          <h3>Requesting</h3>
          <p className="summary-name">{item.name}</p>
          <div className="summary-row"><MapPin size={15} />{item.location}</div>
          <div className="summary-row"><CalendarDays size={15} />Your preferred date and time</div>
          <div className="summary-row"><BookOpenCheck size={15} />{item.category}</div>
          <div style={{ borderTop: '1px solid #dce9e8', marginTop: 17, paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#567875', marginBottom: 9 }}>REMEMBER</div>
            {item.eligibility.slice(0, 2).map((text, index) => <div className="summary-row" key={`${index}-${text}`}><CheckCircle2 size={14} />{text}</div>)}
            {!item.eligibility.length && <div className="summary-row"><CheckCircle2 size={14} />Follow standard lab safety guidance.</div>}
          </div>
        </div>
        <div className="notice">Need to change your plans later? Contact the lab team after submitting your request.</div>
      </aside>
    </div>
  </div>;
}

type StatusFilter = 'all' | Booking['status'];
const statuses: StatusFilter[] = ['all', 'pending', 'approved', 'waitlisted', 'rejected'];
const statusLabels: Record<StatusFilter, string> = { all: 'All requests', pending: 'Pending', approved: 'Approved', waitlisted: 'Waitlisted', rejected: 'Rejected' };
const StatusIcon = ({ status }: { status: Booking['status'] }) => status === 'approved' ? <CheckCircle2 size={17} /> : status === 'rejected' ? <XCircle size={17} /> : status === 'waitlisted' ? <Hourglass size={17} /> : <Clock3 size={17} />;

function RequestsPage() {
  const bookingsQuery = useListBookings();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const bookings = bookingsQuery.data ?? [];
  const filtered = useMemo(() => bookings.filter((booking) => filter === 'all' || booking.status === filter), [bookings, filter]);
  const counts = useMemo(() => ({
    all: bookings.length,
    pending: bookings.filter((booking) => booking.status === 'pending').length,
    approved: bookings.filter((booking) => booking.status === 'approved').length,
    waitlisted: bookings.filter((booking) => booking.status === 'waitlisted').length,
    rejected: bookings.filter((booking) => booking.status === 'rejected').length,
  }), [bookings]);
  const formatDate = (value: string, calendarDate = false) => {
    const date = new Date(calendarDate ? `${value.slice(0, 10)}T12:00:00` : value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  return <div className="fade-in">
    <div className="requests-head">
      <div><div className="eyebrow">Your lab activity</div><h1 className="page-title">My requests</h1><p className="page-subtitle">Keep track of your equipment requests and what happens next.</p></div>
      <Link href="/" className="button button-primary" data-testid="button-find-equipment"><Search size={16} /> Find equipment</Link>
    </div>
    {!bookingsQuery.isLoading && !bookingsQuery.isError && <div className="request-summary">
      {(['pending', 'approved', 'waitlisted', 'rejected'] as const).map((status) => <div className="summary-pill" key={status} data-testid={`summary-status-${status}`}><span className="pill-icon"><StatusIcon status={status} /></span><div><div className="pill-number">{counts[status]}</div><div className="pill-label">{statusLabels[status]}</div></div></div>)}
    </div>}
    {bookingsQuery.isLoading ? <div style={{ display: 'grid', gap: 12 }} aria-label="Loading requests">{[1, 2, 3].map((item) => <div className="skeleton" key={item} style={{ height: 82, borderRadius: 12 }} />)}</div> :
      bookingsQuery.isError ? <QueryError retry={() => void bookingsQuery.refetch()} message="Your request list could not be loaded." /> :
      bookings.length === 0 ? <div className="state-panel"><div className="state-icon"><ClipboardList size={21} /></div><h3>Your next project starts here</h3><p>You haven’t submitted an equipment request yet. Explore the library and find the tools for your next idea.</p><Link href="/" className="button button-primary" data-testid="link-explore-library">Explore equipment <ArrowRight size={15} /></Link></div> :
      <><div className="request-tabs" role="tablist" aria-label="Filter requests">{statuses.map((status) => <button key={status} className={`request-tab ${filter === status ? 'active' : ''}`} onClick={() => setFilter(status)} role="tab" aria-selected={filter === status} data-testid={`tab-requests-${status}`}>{statusLabels[status]}</button>)}</div>
        {filtered.length === 0 ? <div className="state-panel"><div className="state-icon"><ClipboardList size={21} /></div><h3>No {filter} requests</h3><p>There are no requests in this group yet. Choose another status to see the rest.</p></div> :
          <div className="request-list">{filtered.map((booking) => <article className="request-row" key={booking.id} data-testid={`row-request-${booking.id}`}>
            <div><p className="request-equipment">{booking.equipmentName}</p><p className="request-sub">Request #{booking.id} · Sent {formatDate(booking.createdAt)}</p></div>
            <div className="request-date"><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><CalendarDays size={14} />{formatDate(booking.requestedDate, true)}</div><p className="request-sub" style={{ marginTop: 5 }}>{booking.requestedTime}</p></div>
            <div><span className={`status-badge status-${booking.status}`} data-testid={`status-request-${booking.id}`}>{booking.status}</span></div>
            <Link href={`/equipment/${booking.equipmentId}`} className="status-detail-link" data-testid={`link-request-equipment-${booking.id}`}>Equipment details <ArrowRight size={13} /></Link>
          </article>)}</div>}
      </>}
    <p className="field-help" style={{ marginTop: 14 }}>Status updates are managed by the lab team. This page is read-only.</p>
  </div>;
}

function Router() {
  return <RoutedErrorBoundary><Shell><Switch>
    <Route path="/" component={DiscoverPage} />
    <Route path="/equipment/:id" component={DetailPage} />
    <Route path="/bookings/new" component={BookingPage} />
    <Route path="/requests" component={RequestsPage} />
    <Route component={NotFound} />
  </Switch></Shell></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>;
}

export default App;
