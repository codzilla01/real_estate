import { getSeedData } from "@/lib/seed-data";
import { uid } from "@/lib/utils";
import type {
  ActivityLog,
  Agent,
  AppNotification,
  Appointment,
  Client,
  Deal,
  Inquiry,
  Lead,
  Project,
  Property,
  Settings,
} from "@/types";

/**
 * DemoStore — an in-memory repository used when Supabase is not configured.
 * Lives on the client (persists to localStorage) and falls back to seed data
 * on the server. In production, replace with Supabase (see data-service.ts).
 */

const LS_KEY = "ama2_demo_db_v1";

export interface DemoDb {
  properties: Property[];
  agents: Agent[];
  leads: Lead[];
  clients: Client[];
  appointments: Appointment[];
  deals: Deal[];
  inquiries: Inquiry[];
  notifications: AppNotification[];
  activityLogs: ActivityLog[];
  settings: Settings;
  projects: Project[];
}

type Listener = () => void;

function createInitialDb(): DemoDb {
  const seed = getSeedData();
  return {
    properties: seed.properties,
    agents: seed.agents,
    leads: seed.leads,
    clients: seed.clients,
    appointments: seed.appointments,
    deals: seed.deals,
    inquiries: seed.inquiries,
    notifications: seed.notifications,
    activityLogs: seed.activityLogs,
    settings: seed.settings,
    projects: seed.projects,
  };
}

function loadFromStorage(): DemoDb | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoDb;
    if (!parsed.properties || !parsed.settings) return null;
    return parsed;
  } catch {
    return null;
  }
}

class DemoStore {
  private db: DemoDb;
  private listeners = new Set<Listener>();
  private version = 0;

  constructor() {
    this.db = loadFromStorage() ?? createInitialDb();
  }

  private persist() {
    this.version++;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(this.db));
      } catch {
        // storage full / unavailable — keep in-memory only
      }
    }
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getVersion() {
    return this.version;
  }

  getDb(): DemoDb {
    return this.db;
  }

  // ── Properties ──────────────────────────────────────────────────────────
  listProperties(): Property[] {
    return this.db.properties;
  }

  getProperty(id: string): Property | undefined {
    return this.db.properties.find((p) => p.id === id);
  }

  getPropertyBySlug(slug: string): Property | undefined {
    return this.db.properties.find((p) => p.slug === slug);
  }

  createProperty(data: Omit<Property, "id" | "createdAt" | "updatedAt" | "views" | "slug" | "images"> & { images?: Property["images"]; slug?: string }): Property {
    const property: Property = {
      ...data,
      id: uid("prop"),
      slug: data.slug || uid("prop"),
      images: data.images ?? [],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.properties = [property, ...this.db.properties];
    this.persist();
    return property;
  }

  updateProperty(id: string, patch: Partial<Property>): Property | undefined {
    const idx = this.db.properties.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.db.properties[idx] = {
      ...this.db.properties[idx]!,
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.db.properties[idx];
  }

  deleteProperty(id: string): void {
    this.db.properties = this.db.properties.filter((p) => p.id !== id);
    this.persist();
  }

  incrementViews(id: string): void {
    const idx = this.db.properties.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.db.properties[idx] = {
        ...this.db.properties[idx]!,
        views: (this.db.properties[idx]?.views ?? 0) + 1,
      };
      this.persist();
    }
  }

  // ── Agents ───────────────────────────────────────────────────────────────
  listAgents(): Agent[] {
    return this.db.agents;
  }

  getAgent(id: string): Agent | undefined {
    return this.db.agents.find((a) => a.id === id);
  }

  createAgent(data: Omit<Agent, "id" | "createdAt">): Agent {
    const agent: Agent = {
      ...data,
      id: uid("agent"),
      createdAt: new Date().toISOString(),
    };
    this.db.agents = [...this.db.agents, agent];
    this.persist();
    return agent;
  }

  updateAgent(id: string, patch: Partial<Agent>): Agent | undefined {
    const idx = this.db.agents.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.db.agents[idx] = { ...this.db.agents[idx]!, ...patch, id };
    this.persist();
    return this.db.agents[idx];
  }

  deleteAgent(id: string): void {
    this.db.agents = this.db.agents.filter((a) => a.id !== id);
    this.persist();
  }

  // ── Leads ────────────────────────────────────────────────────────────────
  listLeads(): Lead[] {
    return this.db.leads;
  }

  getLead(id: string): Lead | undefined {
    return this.db.leads.find((l) => l.id === id);
  }

  createLead(data: Omit<Lead, "id" | "createdAt">): Lead {
    const lead: Lead = {
      ...data,
      id: uid("lead"),
      createdAt: new Date().toISOString(),
    };
    this.db.leads = [lead, ...this.db.leads];
    this.persist();
    this.pushNotification({
      type: "new_lead",
      title: { ar: "عميل محتمل جديد", en: "New lead" },
      message: { ar: lead.name, en: lead.name },
      link: "/admin/leads",
    });
    return lead;
  }

  updateLead(id: string, patch: Partial<Lead>): Lead | undefined {
    const idx = this.db.leads.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    this.db.leads[idx] = { ...this.db.leads[idx]!, ...patch, id };
    this.persist();
    return this.db.leads[idx];
  }

  deleteLead(id: string): void {
    this.db.leads = this.db.leads.filter((l) => l.id !== id);
    this.persist();
  }

  // ── Clients ──────────────────────────────────────────────────────────────
  listClients(): Client[] {
    return this.db.clients;
  }

  getClient(id: string): Client | undefined {
    return this.db.clients.find((c) => c.id === id);
  }

  createClient(data: Omit<Client, "id" | "createdAt">): Client {
    const client: Client = {
      ...data,
      id: uid("client"),
      createdAt: new Date().toISOString(),
    };
    this.db.clients = [client, ...this.db.clients];
    this.persist();
    return client;
  }

  updateClient(id: string, patch: Partial<Client>): Client | undefined {
    const idx = this.db.clients.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.db.clients[idx] = { ...this.db.clients[idx]!, ...patch, id };
    this.persist();
    return this.db.clients[idx];
  }

  deleteClient(id: string): void {
    this.db.clients = this.db.clients.filter((c) => c.id !== id);
    this.persist();
  }

  // ── Appointments ─────────────────────────────────────────────────────────
  listAppointments(): Appointment[] {
    return this.db.appointments;
  }

  getAppointment(id: string): Appointment | undefined {
    return this.db.appointments.find((a) => a.id === id);
  }

  createAppointment(data: Omit<Appointment, "id" | "createdAt">): Appointment {
    const appointment: Appointment = {
      ...data,
      id: uid("appt"),
      createdAt: new Date().toISOString(),
    };
    this.db.appointments = [...this.db.appointments, appointment];
    this.persist();
    return appointment;
  }

  updateAppointment(id: string, patch: Partial<Appointment>): Appointment | undefined {
    const idx = this.db.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.db.appointments[idx] = { ...this.db.appointments[idx]!, ...patch, id };
    this.persist();
    return this.db.appointments[idx];
  }

  deleteAppointment(id: string): void {
    this.db.appointments = this.db.appointments.filter((a) => a.id !== id);
    this.persist();
  }

  // ── Deals ────────────────────────────────────────────────────────────────
  listDeals(): Deal[] {
    return this.db.deals;
  }

  getDeal(id: string): Deal | undefined {
    return this.db.deals.find((d) => d.id === id);
  }

  createDeal(data: Omit<Deal, "id" | "createdAt">): Deal {
    const deal: Deal = {
      ...data,
      id: uid("deal"),
      createdAt: new Date().toISOString(),
    };
    this.db.deals = [deal, ...this.db.deals];
    this.persist();
    return deal;
  }

  updateDeal(id: string, patch: Partial<Deal>): Deal | undefined {
    const idx = this.db.deals.findIndex((d) => d.id === id);
    if (idx === -1) return undefined;
    this.db.deals[idx] = { ...this.db.deals[idx]!, ...patch, id };
    this.persist();
    return this.db.deals[idx];
  }

  deleteDeal(id: string): void {
    this.db.deals = this.db.deals.filter((d) => d.id !== id);
    this.persist();
  }

  // ── Inquiries ────────────────────────────────────────────────────────────
  listInquiries(): Inquiry[] {
    return this.db.inquiries;
  }

  createInquiry(data: Omit<Inquiry, "id" | "createdAt">): Inquiry {
    const inquiry: Inquiry = {
      ...data,
      id: uid("inq"),
      createdAt: new Date().toISOString(),
    };
    this.db.inquiries = [inquiry, ...this.db.inquiries];
    this.persist();
    this.pushNotification({
      type: "new_inquiry",
      title: { ar: "استفسار جديد", en: "New inquiry" },
      message: { ar: `${inquiry.name} — ${inquiry.subject ?? ""}`, en: `${inquiry.name} — ${inquiry.subject ?? ""}` },
      link: "/admin/leads",
    });
    return inquiry;
  }

  // ── Notifications ────────────────────────────────────────────────────────
  listNotifications(): AppNotification[] {
    return [...this.db.notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  pushNotification(data: Omit<AppNotification, "id" | "read" | "createdAt">): AppNotification {
    const notification: AppNotification = {
      ...data,
      id: uid("notif"),
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.db.notifications = [notification, ...this.db.notifications].slice(0, 100);
    this.persist();
    return notification;
  }

  markNotificationRead(id: string): void {
    this.db.notifications = this.db.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    this.persist();
  }

  markAllNotificationsRead(): void {
    this.db.notifications = this.db.notifications.map((n) => ({ ...n, read: true }));
    this.persist();
  }

  // ── Activity Logs ────────────────────────────────────────────────────────
  listActivityLogs(): ActivityLog[] {
    return [...this.db.activityLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  logActivity(data: Omit<ActivityLog, "id" | "createdAt">): ActivityLog {
    const log: ActivityLog = {
      ...data,
      id: uid("act"),
      createdAt: new Date().toISOString(),
    };
    this.db.activityLogs = [log, ...this.db.activityLogs].slice(0, 200);
    this.persist();
    return log;
  }

  // ── Settings ─────────────────────────────────────────────────────────────
  getSettings(): Settings {
    return this.db.settings;
  }

  updateSettings(patch: Partial<Settings>): Settings {
    this.db.settings = { ...this.db.settings, ...patch };
    this.persist();
    return this.db.settings;
  }

  // ── Projects ─────────────────────────────────────────────────────────────
  listProjects(): Project[] {
    return this.db.projects;
  }

  // ── Maintenance ──────────────────────────────────────────────────────────
  resetDemoData(): void {
    this.db = createInitialDb();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_KEY);
    }
    this.persist();
  }
}

declare global {
  interface Window {
    __ama2DemoStore?: DemoStore;
  }
}

function getStore(): DemoStore {
  if (typeof window !== "undefined" && window.__ama2DemoStore) {
    return window.__ama2DemoStore;
  }
  const store = new DemoStore();
  if (typeof window !== "undefined") {
    window.__ama2DemoStore = store;
  }
  return store;
}

export const demoStore = getStore();
