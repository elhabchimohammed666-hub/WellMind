import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import Activity from 'lucide-react/icons/activity';
import ArrowDown from 'lucide-react/icons/arrow-down';
import ArrowLeft from 'lucide-react/icons/arrow-left';
import ArrowRight from 'lucide-react/icons/arrow-right';
import ArrowUp from 'lucide-react/icons/arrow-up';
import BarChart3 from 'lucide-react/icons/chart-column';
import Bell from 'lucide-react/icons/bell';
import Check from 'lucide-react/icons/check';
import CheckCircle2 from 'lucide-react/icons/circle-check';
import ChevronDown from 'lucide-react/icons/chevron-down';
import ChevronRight from 'lucide-react/icons/chevron-right';
import CircleHelp from 'lucide-react/icons/circle-help';
import Clock3 from 'lucide-react/icons/clock-3';
import FileCheck2 from 'lucide-react/icons/file-check-2';
import FileText from 'lucide-react/icons/file-text';
import HeartHandshake from 'lucide-react/icons/heart-handshake';
import LayoutDashboard from 'lucide-react/icons/layout-dashboard';
import Lightbulb from 'lucide-react/icons/lightbulb';
import LoaderCircle from 'lucide-react/icons/loader-circle';
import LogOut from 'lucide-react/icons/log-out';
import Menu from 'lucide-react/icons/menu';
import MessageCircle from 'lucide-react/icons/message-circle';
import Plus from 'lucide-react/icons/plus';
import Search from 'lucide-react/icons/search';
import Send from 'lucide-react/icons/send';
import Settings2 from 'lucide-react/icons/settings-2';
import ShieldCheck from 'lucide-react/icons/shield-check';
import Sparkles from 'lucide-react/icons/sparkles';
import Users from 'lucide-react/icons/users';
import X from 'lucide-react/icons/x';
import { api, formatDate } from './api.js';

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);
const labelStatus = { draft: 'Brouillon', published: 'En cours', closed: 'Terminé', planned: 'À venir', 'in-progress': 'En cours', completed: 'Terminé', cancelled: 'Archivé' };
const statusStyle = { draft: 'neutral', published: 'green', closed: 'neutral', planned: 'blue', 'in-progress': 'amber', completed: 'green', cancelled: 'neutral' };
const NO_DEPS = [];

function useLoad(loader, deps = NO_DEPS) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const refresh = useCallback(async () => {
    setState(previous => ({ ...previous, loading: true, error: '' }));
    try {
      const data = await loaderRef.current();
      setState({ data, loading: false, error: '' });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error: error.message });
      return null;
    }
  }, []);
  useEffect(() => { refresh(); }, deps);
  return { ...state, refresh };
}

function App() {
  const [session, setSession] = useState(() => {
    try {
      const user = localStorage.getItem('wellmind-user');
      return user ? JSON.parse(user) : null;
    } catch {
      localStorage.removeItem('wellmind-user');
      localStorage.removeItem('wellmind-token');
      return null;
    }
  });
  const value = useMemo(() => ({
    user: session,
    signIn: (user, token) => {
      localStorage.setItem('wellmind-user', JSON.stringify(user));
      localStorage.setItem('wellmind-token', token);
      setSession(user);
    },
    updateUser: changes => {
      const updated = { ...session, ...changes };
      localStorage.setItem('wellmind-user', JSON.stringify(updated));
      setSession(updated);
    },
    signOut: () => {
      localStorage.removeItem('wellmind-user');
      localStorage.removeItem('wellmind-token');
      setSession(null);
    },
  }), [session]);

  return (
    <AuthContext.Provider value={value}>
      {session ? <Workspace /> : <Login />}
    </AuthContext.Provider>
  );
}

function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('rh@atlas.example');
  const [password, setPassword] = useState('WellMind2026!');
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = registering
        ? await api('/auth/register', { method: 'POST', body: { email, password, name, organizationName } })
        : await api('/auth/login', { method: 'POST', body: { email, password } });
      signIn(result.user, result.token);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-art">
        <div className="login-brand"><span className="brand-mark"><HeartHandshake size={21} /></span> wellmind</div>
        <div className="art-copy">
          <div className="eyebrow light"><span className="live-dot" /> LE TRAVAIL, EN MIEUX</div>
          <h1>Un meilleur<br />quotidien,<br /><em>ensemble.</em></h1>
          <p>Écoutez ce qui compte. Faites évoluer ce qui peut l’être.</p>
          <div className="quote-card"><span>“</span><div>« On a enfin un espace pour dire les choses, et voir qu’elles bougent. »<small>— Une équipe qui avance</small></div></div>
        </div>
        <div className="art-footer">Du ressenti collectif. Des actions concrètes.</div>
        <div className="decor decor-one" /><div className="decor decor-two" />
      </div>
      <div className="login-panel">
        <div className="login-panel-top"><span>Un espace plus humain</span><CircleHelp size={17} /></div>
        <form className="login-form" onSubmit={submit}>
          <span className="eyebrow">{registering ? 'UN ESPACE POUR VOTRE ORGANISATION' : 'BON RETOUR PARMI NOUS'}</span>
          <h2>{registering ? 'Créer un espace' : 'Connectez-vous'}</h2>
          <p>{registering ? 'Commencez par créer votre organisation et votre compte RH.' : 'Votre espace de travail vous attend.'}</p>
          {error && <div className="notice error">{error}</div>}
          {registering && <><label>Nom de votre organisation<input value={organizationName} onChange={event => setOrganizationName(event.target.value)} autoComplete="organization" required /></label><label>Votre nom<input value={name} onChange={event => setName(event.target.value)} autoComplete="name" required /></label></>}
          <label>Adresse e-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" required /></label>
          <label>Mot de passe<input type="password" minLength={registering ? 10 : undefined} value={password} onChange={event => setPassword(event.target.value)} autoComplete={registering ? 'new-password' : 'current-password'} required /></label>
          <button className="button primary full" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : null} {registering ? 'Créer mon espace' : 'Se connecter'} <ArrowRight size={16} /></button>
          <div className="login-help">{registering ? 'Vous avez déjà un espace ?' : 'Première visite ?'} <button type="button" className="text-button" onClick={() => { setRegistering(!registering); setError(''); }}>{registering ? 'Se connecter' : 'Créer une organisation'}</button></div>
          {!registering && <div className="login-help demo-help">Compte de démonstration : RH ou collaborateur · <button type="button" className="text-button" onClick={() => { setEmail('lea@atlas.example'); setPassword('WellMind2026!'); }}>Essayer l’espace collaborateur</button></div>}
        </form>
        <div className="login-privacy"><ShieldCheck size={16} /> Des retours protégés. Des équipes respectées.</div>
      </div>
    </div>
  );
}

function Workspace() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useMemo(() => user.role === 'hr' ? [
    { to: '/', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { to: '/surveys', label: 'Sondages', icon: FileText },
    { to: '/insights', label: 'Analyses', icon: BarChart3 },
    { to: '/actions', label: 'Plans d’action', icon: Lightbulb },
    { to: '/team', label: 'Équipe', icon: Users },
  ] : [
    { to: '/', label: 'Mon espace', icon: LayoutDashboard },
    { to: '/surveys', label: 'Mes sondages', icon: FileText },
    { to: '/actions', label: 'Améliorations', icon: Lightbulb },
  ], [user.role]);

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <Link to="/" className="brand"><span className="brand-mark"><HeartHandshake size={19} /></span><span>wellmind<small>WORKPLACE WELLBEING</small></span></Link>
        <div className="org-switch"><span className="org-avatar">{initials(user.organizationName || 'O').slice(0, 1)}</span><span><b>{user.organizationName || 'Mon organisation'}</b><small>Mon organisation</small></span><ChevronDown size={15} /></div>
        <div className="nav-section">MENU PRINCIPAL</div>
        <nav className="side-nav">{nav.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><item.icon size={18} /><span>{item.label}</span></NavLink>)}</nav>
        <div className="sidebar-bottom">
          <div className="privacy-card"><span><ShieldCheck size={17} /> Vos retours sont protégés</span><p>Les réponses anonymes ne sont jamais reliées à votre compte.</p><Link to="/profile">En savoir plus <ArrowRight size={13} /></Link></div>
          <Link to="/profile" className="nav-item"><Settings2 size={18} /><span>Paramètres</span></Link>
          <div className="user-block"><span className="avatar">{initials(user.name)}</span><span className="user-detail"><b>{user.name}</b><small>{user.role === 'hr' ? 'Administrateur RH' : 'Collaborateur'}</small></span><button className="icon-button" title="Se déconnecter" onClick={signOut}><LogOut size={16} /></button></div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu"><Menu size={20} /></button>
          <div className="breadcrumb">Atlas Digital <ChevronRight size={14} /> <span>Mon espace</span></div>
          <div className="topbar-actions"><span className="today-label">{new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><span className="avatar small-avatar">{initials(user.name)}</span></div>
        </header>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/surveys" element={<SurveyList />} />
            <Route path="/surveys/new" element={<HrOnly><SurveyEditor /></HrOnly>} />
            <Route path="/surveys/:id/edit" element={<HrOnly><SurveyEditor /></HrOnly>} />
            <Route path="/surveys/:id" element={<SurveyDetail />} />
            <Route path="/insights" element={<HrOnly><InsightsPage /></HrOnly>} />
            <Route path="/actions" element={<ActionsPage />} />
            <Route path="/team" element={<HrOnly><TeamPage /></HrOnly>} />
            <Route path="/profile" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <footer className="app-footer"><span>WELLMIND <span>·</span> PRENDRE SOIN DU TRAVAIL ENSEMBLE</span><span><ShieldCheck size={14} /> Vos données restent confidentielles</span></footer>
      </main>
    </div>
  );
}

function HrOnly({ children }) {
  const { user } = useAuth();
  return user.role === 'hr' ? children : <Navigate to="/" replace />;
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function Dashboard() {
  const { user } = useAuth();
  return user.role === 'hr' ? <HrDashboard /> : <EmployeeDashboard />;
}

function HrDashboard() {
  const { data, loading, error, refresh } = useLoad(() => api('/surveys/dashboard'));
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  const { metrics, surveys, organization } = data;
  const recent = surveys.slice(0, 4);
  const activeSurveys = surveys.filter(survey => survey.status === 'published');
  const averageRate = activeSurveys.length ? Math.round(activeSurveys.reduce((sum, survey) => sum + survey.participationRate, 0) / activeSurveys.length) : 0;
  return (
    <>
      <PageHeading eyebrow="VOTRE ORGANISATION" title={<>Les équipes avancent.<br /><em>Vous aussi.</em></>} subtitle="Un aperçu des ressentis et des actions qui font bouger les choses." action={<Link to="/surveys/new" className="button primary"><Plus size={17} /> Créer un sondage</Link>} />
      <div className="welcome-banner"><div className="welcome-icon"><Sparkles size={19} /></div><div><b>Bonjour, {useAuth().user.name.split(' ')[0]} <span>✦</span></b><p>Voici ce qui se passe dans votre espace cette semaine.</p></div><div className="banner-sparkle">✳</div></div>
      <section className="stats-grid">
        <StatCard icon={FileText} label="Sondages en cours" value={metrics.activeSurveys} change="À l’écoute de l’équipe" tone="sage" />
        <StatCard icon={CheckCircle2} label="Sondages terminés" value={metrics.completedSurveys} change="Périodes clôturées" tone="lilac" />
        <StatCard icon={Users} label="Collaborateurs" value={metrics.employees} change="Dans votre organisation" tone="blue" />
        <StatCard icon={Activity} label="Participation moyenne" value={`${averageRate}%`} change="Sur les sondages actifs" tone="amber" />
        <StatCard icon={Lightbulb} label="Actions en cours" value={metrics.activeActions} change={`${metrics.totalActions} au total`} tone="lilac" />
      </section>
      <div className="dashboard-grid">
        <section className="panel surveys-panel">
          <div className="panel-heading"><div><h2>Les sondages récents</h2><p>Les ressentis qui font avancer l’équipe.</p></div><Link className="quiet-link" to="/surveys">Tout voir <ArrowRight size={15} /></Link></div>
          {recent.length ? <div className="survey-table">{recent.map(survey => <div className="survey-table-row" key={survey.id}><span className="survey-icon"><MessageCircle size={17} /></span><span className="survey-name"><b>{survey.title}</b><small>{survey.anonymous ? 'Anonyme' : 'Identifié'} · {survey.responseCount === null ? 'Résultats protégés' : `${survey.responseCount} réponses`}</small></span><span className="response-summary"><b>{survey.participationRate}%</b><small>participation</small></span><StatusBadge value={survey.status} /><Link to={`/surveys/${survey.id}`} className="table-arrow" aria-label="Voir les résultats"><ArrowRight size={16} /></Link></div>)}</div> : <EmptyState title="Votre premier sondage vous attend" text="Invitez votre équipe à partager son ressenti." action={<Link to="/surveys/new" className="button secondary">Créer un sondage</Link>} />}
          <div className="privacy-inline"><ShieldCheck size={15} /> Les résultats détaillés apparaissent à partir de {organization.minimumResponseThreshold} réponses.</div>
        </section>
        <section className="panel pulse-panel">
          <div className="panel-heading"><div><h2>Le pouls de l’équipe</h2><p>Participation aux sondages récents.</p></div><span className="round-icon"><Activity size={17} /></span></div>
          <div className="pulse-stat"><b>{averageRate}<small>%</small></b><span>de participation<br />en moyenne</span></div>
          <div className="pulse-chart">{surveys.slice(0, 5).reverse().map((survey, index) => <div className="chart-column" key={survey.id}><div className="bar-wrap"><div className={`bar bar-${index}`} style={{ height: `${Math.max(survey.participationRate, 6)}%` }} /></div><small>{index === surveys.slice(0, 5).length - 1 ? 'Auj.' : `${index + 1} sem.`}</small></div>)}</div>
          <div className="pulse-legend"><span><i /> Taux de participation</span><span>Sur les 5 dernières semaines</span></div>
        </section>
      </div>
      <div className="bottom-grid">
        <section className="panel"><div className="panel-heading"><div><h2>Vos prochains pas</h2><p>Petites actions, vrais changements.</p></div><Link className="quiet-link" to="/actions">Voir le plan <ArrowRight size={15} /></Link></div><ActionPreview /></section>
        <section className="insight-banner"><div className="insight-orb"><Lightbulb size={22} /></div><span className="eyebrow">À L’ÉCOUTE, ENSEMBLE</span><h2>Les bonnes idées<br />commencent souvent<br />par une écoute.</h2><p>Une réponse, c’est déjà un premier pas vers un quotidien plus serein.</p><Link to="/insights">Découvrir les analyses <ArrowRight size={15} /></Link><div className="insight-decoration">✳</div></section>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, change, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><span className="stat-label">{label}</span><b className="stat-value">{value}</b><span className="stat-change"><i />{change}</span></div>;
}

function ActionPreview() {
  const { data, loading, error } = useLoad(() => api('/actions'));
  if (loading) return <Loading compact />;
  if (error) return <p className="muted">{error}</p>;
  const actions = data.actions.filter(action => action.status !== 'completed').slice(0, 3);
  return actions.length ? <div className="action-preview">{actions.map(action => <div className="action-preview-row" key={action._id}><span className={`action-status-dot ${action.status}`} /><span><b>{action.title}</b><small>{action.owner?.name || action.ownerName || 'Responsable à définir'} · {action.dueDate ? `Échéance ${formatDate(action.dueDate)}` : 'Sans échéance'}</small></span><ChevronRight size={16} /></div>)}</div> : <p className="muted">Aucune action à suivre pour l’instant.</p>;
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useLoad(async () => Promise.all([api('/surveys'), api('/actions')]));
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  const surveys = data[0].surveys.filter(survey => survey.acceptingResponses && !survey.hasResponded);
  const actions = data[1].actions;
  return <>
    <PageHeading eyebrow="MON ESPACE" title={<>Bonjour {user.name.split(' ')[0]},<br /><em>comment ça va au travail ?</em></>} subtitle="Votre expérience compte. Prenez quelques minutes pour la partager." />
    <div className="employee-welcome"><div className="welcome-icon"><HeartHandshake size={21} /></div><div><b>Votre voix fait la différence.</b><p>Vos réponses anonymes ne sont pas reliées à votre compte. C’est votre ressenti qui compte, pas votre nom.</p></div><ShieldCheck size={20} /></div>
    <div className="employee-section-heading"><div><span className="eyebrow">VOTRE VOIX COMPTE</span><h2>Sondages à compléter <span className="count-pill">{surveys.length}</span></h2></div><span className="quiet-label"><Clock3 size={15} /> 2 à 5 min chacun</span></div>
    {surveys.length ? <div className="employee-survey-grid">{surveys.map(survey => <Link className="employee-survey-card" to={`/surveys/${survey._id}`} key={survey._id}><span className="survey-icon"><MessageCircle size={18} /></span><span className="survey-tag">{survey.anonymous ? 'ANONYME' : 'IDENTIFIÉ'}</span><h3>{survey.title}</h3><p>{survey.description || 'Partagez votre ressenti sur votre quotidien au travail.'}</p><span className="employee-survey-meta">{survey.questions.length} questions <span>·</span> jusqu’au {formatDate(survey.endsAt)}</span><span className="survey-card-cta">Partager mon avis <ArrowRight size={15} /></span></Link>)}</div> : <EmptyState title="Pas de sondage à compléter" text="Vous avez répondu à tous les sondages disponibles. Merci pour votre participation !" />}
    <div className="employee-section-heading actions-title"><div><span className="eyebrow">ON AVANCE ENSEMBLE</span><h2>Les améliorations de l’équipe</h2></div></div>
    <div className="shared-actions">{actions.length ? actions.map(action => <div className="shared-action" key={action._id}><span className={`action-status-dot ${action.status}`} /><div><b>{action.title}</b><p>{action.objective || action.theme || 'Une initiative portée par votre organisation.'}</p></div><StatusBadge value={action.status} /></div>) : <p className="muted">Les initiatives partagées par votre organisation apparaîtront ici.</p>}</div>
  </>;
}

function SurveyList() {
  const { user } = useAuth();
  const location = useLocation();
  const { data, loading, error, refresh } = useLoad(() => api('/surveys'));
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(location.state?.responseSubmitted ? 'Votre réponse a bien été enregistrée. Merci pour votre participation.' : '');
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  const surveys = data.surveys.filter(survey => filter === 'all' || survey.status === filter);
  const updateStatus = async (id, status) => {
    try {
      await api(`/surveys/${id}/status`, { method: 'PATCH', body: { status } });
      setNotice(status === 'published' ? 'Le sondage est maintenant ouvert aux collaborateurs.' : 'Le sondage a été clôturé.');
      refresh();
    } catch (problem) { setNotice(problem.message); }
  };
  return <>
    <PageHeading eyebrow={user.role === 'hr' ? 'À L’ÉCOUTE DE L’ÉQUIPE' : 'VOTRE ESPACE'} title={user.role === 'hr' ? 'Les sondages' : 'Mes sondages'} subtitle={user.role === 'hr' ? 'Posez les bonnes questions, puis transformez les réponses en actions.' : 'Les retours que vous partagez ici font avancer toute l’équipe.'} action={user.role === 'hr' && <Link to="/surveys/new" className="button primary"><Plus size={17} /> Nouveau sondage</Link>} />
    {notice && <div className="notice success"><CheckCircle2 size={17} />{notice}<button className="icon-button" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {user.role === 'hr' && <div className="filter-row"><div className="filter-tabs">{[['all', 'Tous'], ['published', 'En cours'], ['draft', 'Brouillons'], ['closed', 'Terminés']].map(([value, label]) => <button key={value} className={filter === value ? 'filter-tab selected' : 'filter-tab'} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="muted">{surveys.length} sondage{surveys.length === 1 ? '' : 's'}</span></div>}
    {surveys.length ? <div className="panel survey-list-panel">{surveys.map(survey => user.role === 'hr'
      ? <div className="survey-list-row" key={survey._id}><span className="survey-icon"><FileText size={18} /></span><div className="survey-list-info"><b>{survey.title}</b><span>{survey.description || 'Aucune description'}</span><small>{survey.anonymous ? <><ShieldCheck size={12} /> Réponses anonymes</> : 'Réponses identifiées'} · Clôture {formatDate(survey.endsAt)}</small></div><div className="survey-list-progress"><span><b>{survey.participationCount ?? 0}</b> / {survey.eligibleEmployees ?? 0}</span><small>participations</small><div className="progress-track"><i style={{ width: `${survey.participationRate}%` }} /></div></div><StatusBadge value={survey.status} /><div className="survey-row-actions">{survey.status === 'draft' && <Link to={`/surveys/${survey._id}/edit`} className="button subtle small">Modifier</Link>}{survey.status === 'draft' && <button className="button secondary small" onClick={() => updateStatus(survey._id, 'published')}>Publier</button>}{survey.status === 'published' && <><Link to={`/surveys/${survey._id}`} className="button secondary small">Résultats</Link><button className="button subtle small" onClick={() => updateStatus(survey._id, 'closed')}>Clôturer</button></>}{survey.status === 'closed' && <Link to={`/surveys/${survey._id}`} className="button secondary small">Résultats</Link>}</div></div>
      : <Link key={survey._id} to={survey.hasResponded ? '#' : `/surveys/${survey._id}`} className={`survey-list-row employee-survey-list ${survey.hasResponded ? 'done' : ''}`}><span className="survey-icon">{survey.hasResponded ? <Check size={18} /> : <MessageCircle size={18} />}</span><div className="survey-list-info"><b>{survey.title}</b><span>{survey.description || 'Partagez votre ressenti sur le quotidien au travail.'}</span><small><ShieldCheck size={12} /> {survey.anonymous ? 'Réponse anonyme' : 'Réponse identifiée'} · Clôture {formatDate(survey.endsAt)}</small></div><StatusBadge value={survey.hasResponded ? 'completed' : 'published'} /><span className="table-arrow"><ArrowRight size={16} /></span></Link>
    )}</div> : <EmptyState title="Aucun sondage dans cette catégorie" text="Essayez un autre filtre ou créez un nouveau sondage." action={user.role === 'hr' && <Link to="/surveys/new" className="button secondary">Créer un sondage</Link>} />}
    {user.role === 'hr' && <div className="privacy-note"><ShieldCheck size={17} /><div><b>Les résultats respectent un seuil de confidentialité.</b><p>Les réponses détaillées et les analyses ne s’affichent qu’une fois le minimum de participation atteint.</p></div><Link to="/profile">Paramètres <ArrowRight size={14} /></Link></div>}
  </>;
}

function SurveyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState({ title: '', description: '', anonymous: true, startsAt: new Date().toISOString().slice(0, 10), endsAt: '', questions: [{ id: makeId(), label: '', type: 'rating', required: true, options: [''] }] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { data, loading, error: loadError } = useLoad(() => editing ? api('/surveys').then(result => result.surveys.find(survey => survey._id === id)) : Promise.resolve(null), [id]);
  useEffect(() => {
    if (data && editing) setForm({ ...data, startsAt: new Date(data.startsAt).toISOString().slice(0, 10), endsAt: new Date(data.endsAt).toISOString().slice(0, 10), questions: data.questions.map(question => ({ ...question })) });
  }, [data, editing]);
  if (loading) return <Loading />;
  if (loadError) return <ErrorState message={loadError} />;
  if (editing && (!data || data.status !== 'draft')) return <ErrorState message="Seuls les sondages en brouillon peuvent être modifiés." />;

  const changeQuestion = (index, key, value) => setForm(current => ({ ...current, questions: current.questions.map((question, i) => i === index ? { ...question, [key]: value } : question) }));
  const save = async event => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api(editing ? `/surveys/${id}` : '/surveys', { method: editing ? 'PATCH' : 'POST', body: { ...form, questions: form.questions.map(question => ({ ...question, options: question.type === 'choice' ? question.options.filter(Boolean) : [] })) } });
      navigate('/surveys');
    } catch (problem) { setError(problem.message); }
    finally { setSaving(false); }
  };
  return <>
    <PageHeading eyebrow="CONSTRUIRE ENSEMBLE" title={editing ? 'Modifier le sondage' : 'Créer un sondage'} subtitle="Quelques questions bien choisies peuvent ouvrir de belles conversations." action={<Link to="/surveys" className="button subtle"><ArrowLeft size={16} /> Retour</Link>} />
    {error && <div className="notice error">{error}</div>}
    <form className="editor-layout" onSubmit={save}>
      <div className="editor-main">
        <section className="panel form-panel"><span className="step-label"><i>01</i> LES BASES</span><label>Titre du sondage<input required maxLength="120" placeholder="Ex. Votre ressenti sur le travail en équipe" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label><label>Quelques mots pour le présenter<textarea maxLength="1000" rows="3" placeholder="Expliquez aux collaborateurs le but de ce sondage et comment les réponses seront utilisées." value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label><div className="date-grid"><label>Ouverture<input type="date" value={form.startsAt.slice(0, 10)} onChange={event => setForm({ ...form, startsAt: event.target.value })} required /></label><label>Clôture<input type="date" value={form.endsAt.slice(0, 10)} onChange={event => setForm({ ...form, endsAt: event.target.value })} required /></label></div></section>
        <section className="questions-section"><div className="section-heading"><div><span className="step-label"><i>02</i> LES QUESTIONS</span><h2>Ce que vous voulez savoir</h2></div><button type="button" className="button secondary small" onClick={() => setForm({ ...form, questions: [...form.questions, { id: makeId(), label: '', type: 'rating', required: true, options: [''] }] })}><Plus size={15} /> Ajouter</button></div>
          {form.questions.map((question, index) => <div className="panel question-editor" key={question.id}><div className="question-editor-top"><span className="question-number">QUESTION {String(index + 1).padStart(2, '0')}</span><div className="question-controls"><button type="button" className="icon-button" disabled={index === 0} aria-label="Déplacer vers le haut" onClick={() => moveQuestion(index, index - 1, form, setForm)}><ArrowUp size={15} /></button><button type="button" className="icon-button" disabled={index === form.questions.length - 1} aria-label="Déplacer vers le bas" onClick={() => moveQuestion(index, index + 1, form, setForm)}><ArrowDown size={15} /></button><button type="button" className="icon-button danger-hover" aria-label="Supprimer la question" onClick={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) })} disabled={form.questions.length === 1}><X size={16} /></button></div></div><input required maxLength="300" placeholder="Ex. Comment évaluez-vous la collaboration dans votre équipe ?" value={question.label} onChange={event => changeQuestion(index, 'label', event.target.value)} /><div className="question-config"><label>Format<select value={question.type} onChange={event => changeQuestion(index, 'type', event.target.value)}><option value="rating">Échelle de 1 à 5</option><option value="choice">Choix multiples</option><option value="text">Commentaire libre</option></select></label><label className="check-label"><input type="checkbox" checked={question.required} onChange={event => changeQuestion(index, 'required', event.target.checked)} /> Obligatoire</label></div>{question.type === 'choice' && <label>Choix proposés<input required placeholder="Ex. Très bien, Bien, À améliorer" value={question.options.join(', ')} onChange={event => changeQuestion(index, 'options', event.target.value.split(',').map(option => option.trim()))} /><small className="field-help">Séparez les choix par une virgule (minimum 2).</small></label>}{question.type === 'rating' && <div className="rating-preview"><span>1 — Pas du tout</span><div>{[1, 2, 3, 4, 5].map(value => <i key={value}>{value}</i>)}</div><span>5 — Tout à fait</span></div>}</div>)}
        </section>
      </div>
      <aside className="editor-aside"><section className="panel anonymity-panel"><span className="step-label"><i>03</i> VOTRE PROMESSE</span><div className="privacy-option"><div className="privacy-option-icon"><ShieldCheck size={19} /></div><div><b>Réponses anonymes</b><p>Les réponses ne seront pas reliées aux comptes individuels.</p></div><button type="button" className={`toggle ${form.anonymous ? 'on' : ''}`} role="switch" aria-checked={form.anonymous} onClick={() => setForm({ ...form, anonymous: !form.anonymous })}><i /></button></div><div className="privacy-disclaimer"><ShieldCheck size={15} /> Le type de réponse restera visible par chaque collaborateur avant l’envoi.</div></section><section className="panel tip-panel"><span className="tip-icon"><Lightbulb size={18} /></span><b>Un bon sondage, c’est simple.</b><p>Des questions claires, un sujet à la fois. Et toujours un espace pour ajouter un mot libre.</p></section><button className="button primary full save-survey" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <FileCheck2 size={16} />}{editing ? 'Enregistrer les modifications' : 'Enregistrer en brouillon'}</button></aside>
    </form>
  </>;
}

function SurveyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: surveys, loading, error, refresh } = useLoad(() => api('/surveys').then(result => result.surveys));
  const [results, setResults] = useState(null);
  const [notice, setNotice] = useState('');
  const [answerValues, setAnswerValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingResults, setLoadingResults] = useState(user.role === 'hr');
  const survey = surveys?.find(item => item._id === id);
  useEffect(() => {
    if (user.role !== 'hr' || !survey) return;
    api(`/surveys/${id}/results`).then(setResults).catch(problem => setNotice(problem.message)).finally(() => setLoadingResults(false));
  }, [id, survey?._id, user.role]);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!survey) return <ErrorState message="Ce sondage est introuvable ou n’est pas accessible." />;
  if (user.role === 'hr') return <>
    <PageHeading eyebrow="RÉSULTATS AGRÉGÉS" title={survey.title} subtitle={survey.description} action={<Link className="button subtle" to="/surveys"><ArrowLeft size={16} /> Tous les sondages</Link>} />
    {notice && <div className="notice error">{notice}</div>}
    {loadingResults ? <Loading /> : results && <ResultsView results={results} />}
  </>;
  if (survey.hasResponded) return <div className="success-card"><div className="success-icon"><CheckCircle2 size={30} /></div><span className="eyebrow">C’EST NOTÉ</span><h1>Merci pour votre retour.</h1><p>Votre réponse a bien été enregistrée. Chaque retour contribue à améliorer notre quotidien de travail.</p><Link to="/" className="button primary">Retour à mon espace</Link></div>;
  if (!survey.acceptingResponses) return <ErrorState message="Ce sondage n’accepte pas de nouvelles réponses pour le moment." />;

  const submit = async event => {
    event.preventDefault();
    setSubmitting(true);
    setNotice('');
    try {
      await api(`/surveys/${id}/responses`, { method: 'POST', body: { answers: survey.questions.map(question => ({ questionId: question.id, value: answerValues[question.id] ?? null })) } });
      navigate('/surveys', { state: { responseSubmitted: true } });
    } catch (problem) { setNotice(problem.message); setSubmitting(false); }
  };
  return <>
    <PageHeading eyebrow="VOTRE EXPÉRIENCE COMPTE" title={survey.title} subtitle={survey.description} action={<Link className="button subtle" to="/surveys"><ArrowLeft size={16} /> Retour</Link>} />
    <form className="response-form" onSubmit={submit}>
      <div className="anonymous-banner"><ShieldCheck size={19} /><div><b>{survey.anonymous ? 'Votre réponse est anonyme' : 'Votre réponse sera identifiée'}</b><p>{survey.anonymous ? 'Elle ne sera pas associée à votre compte. C’est votre ressenti qui sera analysé, jamais votre identité.' : 'Votre nom sera associé à votre réponse, comme indiqué par l’organisation.'}</p></div></div>
      {survey.questions.map((question, index) => <section className="panel response-question" key={question.id}><span className="question-number">QUESTION {String(index + 1).padStart(2, '0')}{question.required && <i> · OBLIGATOIRE</i>}</span><h2>{question.label}</h2>{question.type === 'rating' && <div className="rating-options">{Array.from({ length: question.max - question.min + 1 }, (_, offset) => question.min + offset).map((value, offset) => <label key={value} className={answerValues[question.id] === value ? 'rating-choice selected' : 'rating-choice'}><input type="radio" name={question.id} required={question.required} checked={answerValues[question.id] === value} onChange={() => setAnswerValues({ ...answerValues, [question.id]: value })} /><span>{value}</span><small>{question.min === 1 && question.max === 5 ? ['Pas du tout', 'Un peu', 'Moyennement', 'Beaucoup', 'Tout à fait'][offset] : `Note ${value}`}</small></label>)}</div>}{question.type === 'choice' && <div className="choice-options">{question.options.map(option => <label className={answerValues[question.id] === option ? 'choice-option selected' : 'choice-option'} key={option}><input type="radio" name={question.id} value={option} required={question.required} checked={answerValues[question.id] === option} onChange={() => setAnswerValues({ ...answerValues, [question.id]: option })} /><span className="radio-dot" />{option}</label>)}</div>}{question.type === 'text' && <textarea maxLength="2000" rows="4" placeholder="Votre réponse est facultative. Partagez ce qui vous semble important…" required={question.required} value={answerValues[question.id] || ''} onChange={event => setAnswerValues({ ...answerValues, [question.id]: event.target.value })} />}</section>)}
      {notice && <div className="notice error">{notice}</div>}<div className="form-footer"><span><ShieldCheck size={16} /> Vos réponses ne seront jamais rendues accessibles à vos collègues.</span><button className="button primary" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />} Envoyer ma réponse</button></div>
    </form>
  </>;
}

function ResultsView({ results }) {
  if (results.suppressed) {
    return <div className="privacy-gate"><div className="privacy-gate-icon"><ShieldCheck size={25} /></div><span className="eyebrow">CONFIDENTIALITÉ AVANT TOUT</span><h2>Les retours sont encore protégés.</h2><p>{results.message}</p><small>Les résultats seront disponibles une fois le seuil de confidentialité atteint.</small></div>;
  }

  return <>
    <div className="results-summary"><div><span className="eyebrow">CE QUE L’ÉQUIPE A PARTAGÉ</span><h2>{results.responseCount} réponses <span>·</span> {results.participationCount} participations</h2><p>{results.survey.anonymous ? 'Les réponses ont été recueillies de façon anonyme.' : 'Les résultats sont présentés sous forme agrégée.'}</p></div><div className="privacy-pill"><ShieldCheck size={15} /> Seuil de {results.threshold} réponses atteint</div></div>
    <div className="results-grid">{results.questions.map(question => <div className="panel result-card" key={question.questionId}>
      <span className="result-type">{question.type === 'rating' ? `ÉCHELLE DE ${question.min} À ${question.max}` : question.type === 'choice' ? 'CHOIX MULTIPLES' : 'COMMENTAIRES'}</span>
      <h3>{question.label}</h3>
      {question.suppressed
        ? <div className="question-suppressed"><ShieldCheck size={16} /><span>Résultats masqués : moins de {results.threshold} réponses à cette question.</span></div>
        : <>
          {question.type === 'rating' && <><div className="average-score">{question.average}<small> / {question.max}</small></div><div className="distribution">{Object.entries(question.distribution).map(([score, count]) => <div className="distribution-row" key={score}><span>{score}</span><div className="progress-track"><i style={{ width: `${count && question.count ? (count / question.count) * 100 : 0}%` }} /></div><b>{count ?? 'Masqué'}</b></div>)}</div></>}
          {question.type === 'choice' && <div className="distribution">{Object.entries(question.distribution).map(([label, count]) => <div className="distribution-row" key={label}><span className="choice-label">{label}</span><div className="progress-track"><i style={{ width: `${count && question.count ? (count / question.count) * 100 : 0}%` }} /></div><b>{count ?? 'Masqué'}</b></div>)}</div>}
          {question.type === 'text' && <p className="text-count">{question.count} commentaires écrits. Les réponses individuelles ne sont pas affichées.</p>}
        </>}
    </div>)}</div>
  </>;
}

function InsightsPage() {
  const { data: surveyData, loading, error, refresh } = useLoad(() => api('/surveys'));
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [analysisSurvey, setAnalysisSurvey] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const surveys = surveyData?.surveys || [];
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  const toggle = id => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id].slice(-4));
  const compare = async () => {
    setBusy('compare'); setNotice('');
    try { setComparison(await api('/surveys/compare', { method: 'POST', body: { surveyIds: selected } })); }
    catch (problem) { setNotice(problem.message); }
    finally { setBusy(''); }
  };
  const loadAnalyses = async id => {
    setAnalysisSurvey(id); setAnalyses([]); setNotice('');
    if (!id) return;
    try { setAnalyses((await api(`/surveys/${id}/analyses`)).analyses); }
    catch (problem) { setNotice(problem.message); }
  };
  const runAnalysis = async () => {
    setBusy('ai'); setNotice('');
    try {
      await api(`/surveys/${analysisSurvey}/analyze`, { method: 'POST', body: {} });
      await loadAnalyses(analysisSurvey);
      setNotice('Analyse prête. Les résultats sont une aide à la réflexion et restent à valider par les RH.');
    } catch (problem) { setNotice(problem.message); }
    finally { setBusy(''); }
  };
  return <>
    <PageHeading eyebrow="REGARDER PLUS LOIN" title={<>Comprendre le collectif.<br /><em>Pas les individus.</em></>} subtitle="Des données mesurées, des tendances mises en perspective, des idées pour agir." action={<Link to="/profile" className="button secondary"><Settings2 size={16} /> Seuil de confidentialité</Link>} />
    {notice && <div className={`notice ${notice.startsWith('Analyse prête') ? 'success' : 'error'}`}>{notice}</div>}
    <section className="panel compare-panel"><div className="panel-heading"><div><span className="eyebrow">LES TENDANCES DANS LE TEMPS</span><h2>Comparer deux périodes</h2><p>Comparez les résultats mesurés de sondages différents.</p></div><span className="round-icon"><BarChart3 size={17} /></span></div><div className="comparison-select">{surveys.filter(survey => survey.status !== 'draft').map(survey => <label key={survey._id} className={selected.includes(survey._id) ? 'period-option selected' : 'period-option'}><input type="checkbox" checked={selected.includes(survey._id)} onChange={() => toggle(survey._id)} /><span><b>{survey.title}</b><small>{formatDate(survey.createdAt)} · {survey.responseCount === null ? 'Résultats protégés' : `${survey.responseCount ?? survey.participationCount} réponses`}</small></span><span className="period-check">{selected.includes(survey._id) && <Check size={13} />}</span></label>)}</div><div className="compare-footer"><span>Les périodes sous le seuil restent masquées.</span><button className="button secondary" onClick={compare} disabled={selected.length < 2 || busy === 'compare'}>{busy === 'compare' ? <LoaderCircle size={15} className="spin" /> : <BarChart3 size={15} />} Comparer les périodes</button></div>
      {comparison && <ComparisonView periods={comparison.periods} />}
    </section>
    <section className="panel ai-panel"><div className="panel-heading"><div><span className="eyebrow">L’IA COMME AIDE À LA RÉFLEXION</span><h2>Les mots racontent aussi.</h2><p>Repérez des thèmes récurrents dans les commentaires, sans exposer les personnes.</p></div><span className="ai-icon"><Sparkles size={20} /></span></div><div className="ai-request"><label>Sondage<select value={analysisSurvey} onChange={event => loadAnalyses(event.target.value)}><option value="">Choisir un sondage admissible</option>{surveys.filter(survey => survey.status !== 'draft').map(survey => <option key={survey._id} value={survey._id}>{survey.title}</option>)}</select></label><button className="button primary" disabled={!analysisSurvey || busy === 'ai'} onClick={runAnalysis}>{busy === 'ai' ? <LoaderCircle size={15} className="spin" /> : <Sparkles size={15} />} Analyser les commentaires</button></div>
      {analyses.length ? <div className="analysis-list">{analyses.map(analysis => <div className="analysis-result" key={analysis._id}><div className="analysis-summary"><span className="eyebrow">SYNTHÈSE · {formatDate(analysis.createdAt)}</span><p>{analysis.summary}</p></div><div className="themes-grid">{analysis.themes.map((theme, index) => <div className="theme-card" key={`${analysis._id}-${index}`}><span className={`sentiment ${theme.sentiment}`}>{theme.sentiment === 'positive' ? 'Signal positif' : theme.sentiment === 'concern' ? 'Point d’attention' : 'Thème mixte'}</span><h3>{theme.name}</h3><p>{theme.summary}</p><div className="recommendation"><Lightbulb size={15} /><span>{theme.recommendation}</span></div><button className="text-button" onClick={() => createActionFromTheme(theme)}>Transformer en action <ArrowRight size={14} /></button></div>)}</div><p className="ai-disclaimer"><ShieldCheck size={14} /> Analyse générée à partir de commentaires dé-identifiés. À examiner avant toute décision ; elle ne remplace pas le jugement humain.</p></div>)}</div> : analysisSurvey && <div className="empty-inline"><ShieldCheck size={18} /> L’analyse apparaît ici après génération et validation par le serveur.</div>}
    </section>
  </>;
}

function ComparisonView({ periods }) {
  const visible = periods.filter(period => !period.suppressed);
  const comparable = visible.length === 2
    ? visible[0].questions
      .filter(question => question.type === 'rating' && Number.isFinite(question.average))
      .map(question => ({
        label: question.label,
        max: question.max,
        previous: question.average,
        current: visible[1].questions.find(candidate => candidate.type === 'rating' && candidate.label === question.label && candidate.min === question.min && candidate.max === question.max)?.average,
      }))
      .filter(question => Number.isFinite(question.current))
    : [];

  return <div className="comparison-results">
    {periods.map((period, index) => period.suppressed
      ? <div className="suppressed-period" key={period.id}><ShieldCheck size={17} /><b>{period.title}</b><span>Résultats masqués — seuil de {period.threshold} réponses non atteint.</span></div>
      : <div className="comparison-period" key={period.id}><span className="eyebrow">PÉRIODE {index + 1}</span><h3>{period.title}</h3><span className="muted">{period.responseCount} réponses admissibles</span>{period.questions.filter(question => question.type === 'rating').map(question => <div className="comparison-score" key={question.questionId}><span>{question.label}</span><b>{question.average ?? '—'}<small> / {question.max}</small></b></div>)}</div>)}
    {visible.length === 2 && <div className="comparison-deltas">
      <span className="eyebrow">ÉVOLUTION DES INDICATEURS COMMUNS</span>
      {comparable.length
        ? comparable.map(question => {
          const change = Number((question.current - question.previous).toFixed(1));
          return <div className="comparison-delta" key={question.label}><span>{question.label}</span><b className={change > 0 ? 'positive' : change < 0 ? 'negative' : ''}>{change > 0 ? '+' : ''}{change.toFixed(1)} point{Math.abs(change) === 1 ? '' : 's'} / {question.max}</b></div>;
        })
        : <p className="muted">Aucune question notée identique n’est disponible dans les deux périodes.</p>}
      <p className="comparison-caution">Ces écarts décrivent une évolution observée et ne prouvent pas la cause d’un changement.</p>
    </div>}
  </div>;
}

function createActionFromTheme(theme) {
  sessionStorage.setItem('wellmind-action-draft', JSON.stringify({ title: theme.recommendation.slice(0, 120), objective: theme.summary, theme: theme.name }));
  window.location.assign('/actions?new=1');
}

function ActionsPage() {
  const { user } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const { data: actionData, loading, error, refresh } = useLoad(() => api('/actions'));
  const { data: usersData } = useLoad(async () => user.role === 'hr' ? api('/users') : Promise.resolve({ users: [] }));
  const [modal, setModal] = useState(params.get('new') === '1');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const actions = actionData?.actions || [];
  useEffect(() => { if (params.get('new') === '1') window.history.replaceState({}, '', '/actions'); }, []);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  const shown = actions.filter(action => filter === 'all' || action.status === filter);
  const update = async (id, fields) => {
    try { await api(`/actions/${id}`, { method: 'PATCH', body: fields }); refresh(); }
    catch (problem) { setNotice(problem.message); }
  };
  return <>
    <PageHeading eyebrow="FAIRE ÉVOLUER LE QUOTIDIEN" title={<>Les idées deviennent<br /><em>des changements.</em></>} subtitle={user.role === 'hr' ? 'Suivez les actions qui répondent aux retours de votre équipe.' : 'Voici les initiatives partagées pour améliorer notre quotidien.'} action={user.role === 'hr' && <button className="button primary" onClick={() => setModal(true)}><Plus size={16} /> Nouvelle action</button>} />
    {notice && <div className="notice error">{notice}</div>}
    <div className="filter-row"><div className="filter-tabs">{[['all', 'Toutes'], ['planned', 'À venir'], ['in-progress', 'En cours'], ['completed', 'Terminées']].map(([value, label]) => <button key={value} className={filter === value ? 'filter-tab selected' : 'filter-tab'} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="muted">{shown.length} action{shown.length === 1 ? '' : 's'}</span></div>
    {shown.length ? <div className="action-grid">{shown.map((action, index) => <article className="panel action-card" key={action._id}><div className="action-card-top"><span className={`action-category category-${index % 4}`}><Lightbulb size={15} /> {action.theme || 'Vie d’équipe'}</span><StatusBadge value={action.status} /></div><h2>{action.title}</h2><p className="action-objective">{action.objective || 'Une initiative pour faire évoluer le quotidien au travail.'}</p><div className="action-card-meta"><div className="owner-avatar">{initials(action.owner?.name || action.ownerName || 'Équipe')}</div><span><small>RESPONSABLE</small><b>{action.owner?.name || action.ownerName || 'À définir'}</b></span><span className="action-deadline"><small>ÉCHÉANCE</small><b>{formatDate(action.dueDate)}</b></span></div>{action.notes?.length > 0 && <div className="action-note-preview"><MessageCircle size={14} /><span>{action.notes.at(-1).text}</span></div>}{action.sharedWithEmployees && <div className="shared-indicator"><Users size={13} /> Partagée avec l’équipe</div>}{user.role === 'hr' && <ActionControls action={action} users={usersData?.users || []} onUpdate={update} onRefresh={refresh} />}</article>)}</div> : <EmptyState title="Aucune action dans cette catégorie" text="Les améliorations partagées apparaîtront ici." action={user.role === 'hr' && <button className="button secondary" onClick={() => setModal(true)}>Créer une action</button>} />}
    {modal && <ActionModal users={usersData?.users || []} onClose={() => setModal(false)} onCreated={() => { setModal(false); refresh(); }} />}
  </>;
}

function ActionControls({ action, users, onUpdate, onRefresh }) {
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const addNote = async event => {
    event.preventDefault();
    try { await api(`/actions/${action._id}/notes`, { method: 'POST', body: { text: note } }); setNote(''); setShowNote(false); onRefresh(); }
    catch (error) { window.alert(error.message); }
  };
  return <div className="action-controls"><div><label className="compact-label">Statut<select value={action.status} onChange={event => onUpdate(action._id, { status: event.target.value })}><option value="planned">À venir</option><option value="in-progress">En cours</option><option value="completed">Terminée</option><option value="cancelled">Archivée</option></select></label><label className="compact-label">Responsable<select value={action.owner?._id || ''} onChange={event => onUpdate(action._id, { owner: event.target.value || null })}><option value="">À définir</option>{users.map(person => <option key={person._id} value={person._id}>{person.name}</option>)}</select></label></div><button className="text-button" onClick={() => setShowNote(!showNote)}><MessageCircle size={14} /> {showNote ? 'Annuler' : 'Ajouter une note'}</button>{showNote && <form className="note-form" onSubmit={addNote}><input maxLength="500" placeholder="Un petit point d’avancement…" value={note} onChange={event => setNote(event.target.value)} required /><button className="icon-button" aria-label="Ajouter la note"><Send size={15} /></button></form>}</div>;
}

function ActionModal({ users, onClose, onCreated }) {
  const draft = (() => { try { return JSON.parse(sessionStorage.getItem('wellmind-action-draft') || '{}'); } catch { return {}; } })();
  const [form, setForm] = useState({ title: draft.title || '', objective: draft.objective || '', theme: draft.theme || '', owner: '', dueDate: '', sharedWithEmployees: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try { await api('/actions', { method: 'POST', body: form }); sessionStorage.removeItem('wellmind-action-draft'); onCreated(); }
    catch (problem) { setError(problem.message); setSaving(false); }
  };
  return <Modal title="Créer une action" subtitle="Faites le premier pas vers une amélioration concrète." onClose={onClose}><form className="modal-form" onSubmit={submit}>{error && <div className="notice error">{error}</div>}<label>Nom de l’action<input autoFocus maxLength="120" required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Ex. Clarifier les priorités de la semaine" /></label><label>Objectif<textarea maxLength="600" rows="3" value={form.objective} onChange={event => setForm({ ...form, objective: event.target.value })} placeholder="Quel changement espérez-vous ?" /></label><label>Thème associé<input maxLength="80" value={form.theme} onChange={event => setForm({ ...form, theme: event.target.value })} placeholder="Ex. Communication" /></label><div className="date-grid"><label>Responsable<select value={form.owner} onChange={event => setForm({ ...form, owner: event.target.value })}><option value="">À définir</option>{users.map(person => <option key={person._id} value={person._id}>{person.name}</option>)}</select></label><label>Échéance<input type="date" value={form.dueDate} onChange={event => setForm({ ...form, dueDate: event.target.value })} /></label></div><label className="check-label"><input type="checkbox" checked={form.sharedWithEmployees} onChange={event => setForm({ ...form, sharedWithEmployees: event.target.checked })} /> Partager cette initiative avec les collaborateurs</label><div className="modal-actions"><button type="button" className="button subtle" onClick={onClose}>Annuler</button><button className="button primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />} Créer l’action</button></div></form></Modal>;
}

function TeamPage() {
  const { data, loading, error, refresh } = useLoad(() => api('/users'));
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  return <>
    <PageHeading eyebrow="LES VISAGES DU COLLECTIF" title={<>Une équipe qui<br /><em>se parle, avance.</em></>} subtitle="Gérez les accès et faites une place à chaque voix." action={<button className="button primary" onClick={() => setModal(true)}><Plus size={16} /> Ajouter un membre</button>} />
    {notice && <div className="notice success">{notice}</div>}
    <section className="panel team-panel"><div className="team-panel-head"><div><h2>Les collaborateurs</h2><p>{data.users.length} personnes dans votre organisation</p></div><div className="team-search"><Search size={15} /><input placeholder="Rechercher une personne…" value={query} onChange={event => setQuery(event.target.value)} /></div></div><TeamList users={data.users} query={query} /></section>
    <div className="privacy-note"><ShieldCheck size={17} /><div><b>Une participation ne révèle jamais une réponse anonyme.</b><p>Les sondages utilisent un registre de participation séparé de leurs réponses.</p></div></div>
    {modal && <EmployeeModal onClose={() => setModal(false)} onCreated={async () => { setModal(false); await refresh(); setNotice('Le compte collaborateur a été créé.'); }} />}
  </>;
}

function TeamList({ users, query }) {
  const filtered = users.filter(person => `${person.name} ${person.email} ${person.department}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="team-list">{filtered.map((person, index) => <div className="team-row" key={person._id}><span className={`avatar team-avatar avatar-color-${index % 5}`}>{initials(person.name)}</span><div className="team-person"><b>{person.name}</b><span>{person.email}</span></div><span className="team-department">{person.department || 'Équipe'}</span><span className="role-pill">Collaborateur</span></div>)}</div>;
}

function EmployeeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try { await api('/users', { method: 'POST', body: form }); onCreated(); }
    catch (problem) { setError(problem.message); setSaving(false); }
  };
  return <Modal title="Ajouter un collaborateur" subtitle="Créez un compte pour inviter un membre de votre équipe." onClose={onClose}><form className="modal-form" onSubmit={submit}>{error && <div className="notice error">{error}</div>}<label>Nom complet<input required maxLength="100" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label><label>Adresse e-mail<input type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label><div className="date-grid"><label>Service<input maxLength="80" value={form.department} onChange={event => setForm({ ...form, department: event.target.value })} placeholder="Ex. Design" /></label><label>Mot de passe initial<input type="password" required minLength="10" autoComplete="new-password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label></div><div className="modal-actions"><button type="button" className="button subtle" onClick={onClose}>Annuler</button><button className="button primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />} Créer le compte</button></div></form></Modal>;
}

function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { data, loading, error, refresh } = useLoad(() => api('/auth/me'));
  const [threshold, setThreshold] = useState(5);
  const [organizationName, setOrganizationName] = useState('');
  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [profileNotice, setProfileNotice] = useState('');
  const [organizationNotice, setOrganizationNotice] = useState('');
  useEffect(() => {
    if (data?.organization) {
      setThreshold(data.organization.minimumResponseThreshold);
      setOrganizationName(data.organization.name);
    }
  }, [data]);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  const saveProfile = async event => {
    event.preventDefault(); setProfileNotice('');
    try {
      const result = await api('/auth/me', { method: 'PATCH', body: profile });
      updateUser(result.user);
      setProfileNotice('Votre profil a été mis à jour.');
    } catch (problem) { setProfileNotice(problem.message); }
  };
  const saveOrganization = async event => {
    event.preventDefault(); setOrganizationNotice('');
    try {
      const result = await api('/organization/settings', { method: 'PATCH', body: { name: organizationName, minimumResponseThreshold: threshold } });
      updateUser({ organizationName: result.organization.name });
      setOrganizationNotice('Les paramètres de l’organisation ont été mis à jour.');
      refresh();
    } catch (problem) { setOrganizationNotice(problem.message); }
  };
  return <>
    <PageHeading eyebrow="VOTRE ESPACE" title="Paramètres" subtitle="Vos informations et la façon dont WellMind protège les retours." />
    <div className="settings-grid">
      <form className="panel settings-panel" onSubmit={saveProfile}>
        <span className="settings-icon"><Users size={18} /></span><span className="eyebrow">MON COMPTE</span><h2>Mon profil</h2>
        {profileNotice && <div className={`notice ${profileNotice.includes('mis à jour') ? 'success' : 'error'}`}>{profileNotice}</div>}
        <label>Nom complet<input required maxLength="100" value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} /></label>
        <label className="profile-email">Adresse e-mail<input type="email" required value={profile.email} onChange={event => setProfile({ ...profile, email: event.target.value })} /></label>
        <div className="settings-divider" />
        <div className="setting-row"><span>Rôle</span><b>{user.role === 'hr' ? 'Administrateur RH' : 'Collaborateur'}</b></div>
        <div className="setting-row"><span>Organisation</span><b>{data.organization?.name}</b></div>
        <button className="button primary">Enregistrer mon profil</button>
      </form>
      {user.role === 'hr' && <form className="panel settings-panel" onSubmit={saveOrganization}>
        <span className="settings-icon sage"><ShieldCheck size={18} /></span><span className="eyebrow">ESPACE RH</span><h2>Organisation et confidentialité</h2>
        <p>Les résultats détaillés et l’analyse IA restent masqués avant le seuil minimum.</p>
        {organizationNotice && <div className={`notice ${organizationNotice.includes('mis à jour') ? 'success' : 'error'}`}>{organizationNotice}</div>}
        <label>Nom de l’organisation<input required maxLength="100" value={organizationName} onChange={event => setOrganizationName(event.target.value)} /></label>
        <label className="threshold-label">Nombre minimum de réponses<input type="number" min="3" max="50" value={threshold} onChange={event => setThreshold(Number(event.target.value))} required /></label>
        <small className="field-help">La valeur recommandée est de 5 réponses minimum.</small>
        <button className="button primary">Enregistrer les paramètres</button>
      </form>}
      <section className="panel settings-panel security-panel"><ShieldCheck size={20} /><div><h2>Des retours protégés</h2><p>Les réponses anonymes sont stockées séparément des données de compte. Les statistiques ne sont visibles que sous forme agrégée.</p></div></section>
    </div>
  </>;
}

function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKeyDown); document.body.style.overflow = ''; };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="modal"><div className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Fermer"><X size={19} /></button></div>{children}</section></div>;
}

function StatusBadge({ value }) {
  return <span className={`status-badge ${statusStyle[value] || 'neutral'}`}><i />{labelStatus[value] || value}</span>;
}

function Loading({ compact = false }) {
  return <div className={`loading-state ${compact ? 'compact' : ''}`}><LoaderCircle size={22} className="spin" /><span>Un instant…</span></div>;
}

function ErrorState({ message, onRetry }) {
  return <div className="error-state"><span className="error-icon"><CircleHelp size={22} /></span><h2>Impossible de charger cette page.</h2><p>{message}</p>{onRetry && <button className="button secondary" onClick={onRetry}>Réessayer</button>}</div>;
}

function EmptyState({ title, text, action }) {
  return <div className="empty-state"><span className="empty-icon"><HeartHandshake size={22} /></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `q-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function moveQuestion(from, to, form, setForm) {
  const questions = [...form.questions];
  const [question] = questions.splice(from, 1);
  questions.splice(to, 0, question);
  setForm({ ...form, questions });
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

export default App;
