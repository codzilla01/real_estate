import { isSupabaseConfigured } from "@/lib/env";
import { demoStore } from "@/lib/demo/store";
import type {
  ActivityLog,
  Agent,
  AppNotification,
  Appointment,
  Client,
  Deal,
  Inquiry,
  Lead,
  Property,
  Settings,
} from "@/types";

/**
 * Admin mutation facade.
 * - Demo mode: in-memory store (persisted to localStorage in the browser).
 * - Supabase mode: real PostgreSQL writes through Supabase (RLS enforced).
 */

async function supabase() {
  const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
  return getSupabaseBrowserClient();
}

export const adminService = {
  get mode(): "demo" | "supabase" {
    return isSupabaseConfigured() ? "supabase" : "demo";
  },

  // ── Properties ────────────────────────────────────────────────────────────
  async listProperties(): Promise<Property[]> {
    if (isSupabaseConfigured()) {
      const client = await supabase();
      if (!client) return [];
      const { data, error } = await client.from("properties").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Property[];
    }
    return demoStore.listProperties();
  },

  async getProperty(id: string): Promise<Property | undefined> {
    return demoStore.getProperty(id);
  },

  async createProperty(data: Parameters<typeof demoStore.createProperty>[0]): Promise<Property> {
    if (isSupabaseConfigured()) {
      const client = await supabase();
      if (!client) throw new Error("errors.generic");
      const { data: row, error } = await client
        .from("properties")
        .insert({
          slug: data.slug,
          title_ar: data.title.ar,
          title_en: data.title.en,
          description_ar: data.description.ar,
          description_en: data.description.en,
          type: data.type,
          deal_type: data.dealType,
          status: data.status,
          price: data.price,
          currency: data.currency,
          area: data.area,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          parking: data.parking,
          year_built: data.yearBuilt ?? null,
          furnished: data.furnished,
          city: data.city,
          area_name: data.areaName ?? null,
          address: data.address ?? null,
          latitude: data.latitude,
          longitude: data.longitude,
          amenities: data.amenities ?? [],
          features: data.features ?? [],
          agent_id: data.agentId ?? null,
          featured: data.featured,
          is_new: data.isNew ?? false,
          is_hot: data.isHot ?? false,
          published_at: data.publishedAt ?? new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return row as unknown as Property;
    }
    return demoStore.createProperty(data);
  },

  async updateProperty(id: string, patch: Partial<Property>): Promise<Property | undefined> {
    if (isSupabaseConfigured()) {
      const client = await supabase();
      if (!client) throw new Error("errors.generic");
      const { error } = await client
        .from("properties")
        .update({
          title_ar: patch.title?.ar,
          title_en: patch.title?.en,
          description_ar: patch.description?.ar,
          description_en: patch.description?.en,
          type: patch.type,
          deal_type: patch.dealType,
          status: patch.status,
          price: patch.price,
          currency: patch.currency,
          area: patch.area,
          bedrooms: patch.bedrooms,
          bathrooms: patch.bathrooms,
          parking: patch.parking,
          year_built: patch.yearBuilt ?? null,
          furnished: patch.furnished,
          city: patch.city,
          area_name: patch.areaName ?? null,
          address: patch.address ?? null,
          latitude: patch.latitude,
          longitude: patch.longitude,
          amenities: patch.amenities ?? [],
          features: patch.features ?? [],
          agent_id: patch.agentId ?? null,
          featured: patch.featured,
          is_new: patch.isNew ?? false,
          is_hot: patch.isHot ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      return demoStore.getProperty(id);
    }
    return demoStore.updateProperty(id, patch);
  },

  async deleteProperty(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const client = await supabase();
      if (!client) return;
      const { error } = await client.from("properties").delete().eq("id", id);
      if (error) throw error;
      return;
    }
    demoStore.deleteProperty(id);
  },

  // ── Agents ────────────────────────────────────────────────────────────────
  async listAgents(): Promise<Agent[]> {
    return demoStore.listAgents();
  },

  async createAgent(data: Omit<Agent, "id" | "createdAt">): Promise<Agent> {
    return demoStore.createAgent(data);
  },

  async updateAgent(id: string, patch: Partial<Agent>): Promise<Agent | undefined> {
    return demoStore.updateAgent(id, patch);
  },

  async deleteAgent(id: string): Promise<void> {
    demoStore.deleteAgent(id);
  },

  // ── Leads ─────────────────────────────────────────────────────────────────
  async listLeads(): Promise<Lead[]> {
    if (isSupabaseConfigured()) {
      const client = await supabase();
      if (!client) return [];
      const { data, error } = await client.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    }
    return demoStore.listLeads();
  },

  async createLead(data: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
    if (isSupabaseConfigured()) {
      const client = await supabase();
      if (!client) throw new Error("errors.generic");
      const { data: row, error } = await client
        .from("leads")
        .insert({
          name: data.name,
          phone: data.phone,
          email: data.email ?? null,
          source: data.source,
          property_id: data.propertyId ?? null,
          budget: data.budget ?? null,
          location: data.location ?? null,
          agent_id: data.agentId ?? null,
          priority: data.priority,
          status: data.status,
          notes: data.notes ?? null,
          next_follow_up: data.nextFollowUp ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return row as unknown as Lead;
    }
    return demoStore.createLead(data);
  },

  async updateLead(id: string, patch: Partial<Lead>): Promise<Lead | undefined> {
    if (isSupabaseConfigured()) {
      const client = await supabase();
      if (!client) throw new Error("errors.generic");
      const { error } = await client
        .from("leads")
        .update({
          name: patch.name,
          phone: patch.phone,
          email: patch.email ?? null,
          source: patch.source,
          property_id: patch.propertyId ?? null,
          budget: patch.budget ?? null,
          location: patch.location ?? null,
          agent_id: patch.agentId ?? null,
          priority: patch.priority,
          status: patch.status,
          notes: patch.notes ?? null,
          last_contact: patch.lastContact ?? null,
          next_follow_up: patch.nextFollowUp ?? null,
        })
        .eq("id", id);
      if (error) throw error;
      return demoStore.getLead(id);
    }
    return demoStore.updateLead(id, patch);
  },

  async deleteLead(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const client = await supabase();
      if (!client) return;
      const { error } = await client.from("leads").delete().eq("id", id);
      if (error) throw error;
      return;
    }
    demoStore.deleteLead(id);
  },

  // ── Clients ───────────────────────────────────────────────────────────────
  async listClients(): Promise<Client[]> {
    return demoStore.listClients();
  },

  async createClient(data: Omit<Client, "id" | "createdAt">): Promise<Client> {
    return demoStore.createClient(data);
  },

  async updateClient(id: string, patch: Partial<Client>): Promise<Client | undefined> {
    return demoStore.updateClient(id, patch);
  },

  async deleteClient(id: string): Promise<void> {
    demoStore.deleteClient(id);
  },

  // ── Appointments ──────────────────────────────────────────────────────────
  async listAppointments(): Promise<Appointment[]> {
    return demoStore.listAppointments();
  },

  async createAppointment(data: Omit<Appointment, "id" | "createdAt">): Promise<Appointment> {
    return demoStore.createAppointment(data);
  },

  async updateAppointment(id: string, patch: Partial<Appointment>): Promise<Appointment | undefined> {
    return demoStore.updateAppointment(id, patch);
  },

  async deleteAppointment(id: string): Promise<void> {
    demoStore.deleteAppointment(id);
  },

  // ── Deals ─────────────────────────────────────────────────────────────────
  async listDeals(): Promise<Deal[]> {
    return demoStore.listDeals();
  },

  async createDeal(data: Omit<Deal, "id" | "createdAt">): Promise<Deal> {
    return demoStore.createDeal(data);
  },

  async updateDeal(id: string, patch: Partial<Deal>): Promise<Deal | undefined> {
    return demoStore.updateDeal(id, patch);
  },

  async deleteDeal(id: string): Promise<void> {
    demoStore.deleteDeal(id);
  },

  // ── Inquiries ─────────────────────────────────────────────────────────────
  async listInquiries(): Promise<Inquiry[]> {
    return demoStore.listInquiries();
  },

  async createInquiry(data: Omit<Inquiry, "id" | "createdAt">): Promise<Inquiry> {
    return demoStore.createInquiry(data);
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  async listNotifications(): Promise<AppNotification[]> {
    return demoStore.listNotifications();
  },

  async markNotificationRead(id: string): Promise<void> {
    demoStore.markNotificationRead(id);
  },

  async markAllNotificationsRead(): Promise<void> {
    demoStore.markAllNotificationsRead();
  },

  // ── Activity ──────────────────────────────────────────────────────────────
  async listActivityLogs(): Promise<ActivityLog[]> {
    return demoStore.listActivityLogs();
  },

  async logActivity(
    data: Omit<ActivityLog, "id" | "createdAt">,
  ): Promise<ActivityLog> {
    return demoStore.logActivity(data);
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  async getSettings(): Promise<Settings> {
    return demoStore.getSettings();
  },

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    return demoStore.updateSettings(patch);
  },

  // ── Maintenance ───────────────────────────────────────────────────────────
  async resetDemoData(): Promise<void> {
    demoStore.resetDemoData();
  },
};
