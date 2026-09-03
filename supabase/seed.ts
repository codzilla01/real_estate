/**
 * Seed Supabase with the same data used by demo mode.
 *
 * Usage:
 *   npx tsx supabase/seed.ts
 *
 * Requires env vars (in .env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (server-only, from Supabase → Settings → API)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getSeedData } from "../src/lib/seed-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run `supabase db push` first (migrations/0001_init.sql).",
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const seed = getSeedData();

async function main() {
  // Agents
  const agentIdMap = new Map<string, string>();
  for (const agent of seed.agents) {
    const { data, error } = await db
      .from("agents")
      .insert({
        name: agent.name,
        photo: agent.photo ?? null,
        phone: agent.phone,
        whatsapp: agent.whatsapp ?? null,
        email: agent.email ?? null,
        bio_ar: agent.bio?.ar ?? null,
        bio_en: agent.bio?.en ?? null,
        languages: agent.languages ?? [],
        areas: agent.areas ?? [],
        specialties: agent.specialties ?? [],
        experience_years: agent.experienceYears,
        is_active: agent.isActive,
      })
      .select("id")
      .single();
    if (error) throw error;
    agentIdMap.set(agent.id, data.id);
    console.log(`✓ agent ${agent.name}`);
  }

  // Properties + images
  for (const property of seed.properties) {
    const { data, error } = await db
      .from("properties")
      .insert({
        slug: property.slug,
        title_ar: property.title.ar,
        title_en: property.title.en,
        description_ar: property.description.ar,
        description_en: property.description.en,
        type: property.type,
        deal_type: property.dealType,
        status: property.status,
        price: property.price,
        currency: property.currency,
        area: property.area,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parking: property.parking,
        year_built: property.yearBuilt ?? null,
        furnished: property.furnished,
        city: property.city,
        area_name: property.areaName ?? null,
        address: property.address ?? null,
        latitude: property.latitude,
        longitude: property.longitude,
        amenities: property.amenities ?? [],
        features: property.features ?? [],
        agent_id: property.agentId ? (agentIdMap.get(property.agentId) ?? null) : null,
        featured: property.featured,
        is_new: property.isNew ?? false,
        is_hot: property.isHot ?? false,
        published_at: property.publishedAt,
        views: property.views ?? 0,
        seo_title_ar: property.seoTitle?.ar ?? null,
        seo_title_en: property.seoTitle?.en ?? null,
        seo_description_ar: property.seoDescription?.ar ?? null,
        seo_description_en: property.seoDescription?.en ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    for (const [index, image] of property.images.entries()) {
      const { error: imgError } = await db.from("property_images").insert({
        property_id: data.id,
        url: image.url,
        alt_ar: image.alt?.ar ?? null,
        alt_en: image.alt?.en ?? null,
        is_cover: image.isCover ?? index === 0,
        sort_order: image.order ?? index,
      });
      if (imgError) throw imgError;
    }
    console.log(`✓ property ${property.slug}`);
  }

  // Leads
  for (const lead of seed.leads) {
    const { error } = await db.from("leads").insert({
      name: lead.name,
      phone: lead.phone,
      email: lead.email ?? null,
      source: lead.source,
      property_id: null,
      budget: lead.budget ?? null,
      location: lead.location ?? null,
      agent_id: lead.agentId ? (agentIdMap.get(lead.agentId) ?? null) : null,
      priority: lead.priority,
      status: lead.status,
      notes: lead.notes ?? null,
      next_follow_up: lead.nextFollowUp ?? null,
      created_at: lead.createdAt,
    });
    if (error) throw error;
  }
  console.log(`✓ ${seed.leads.length} leads`);

  // Clients
  for (const client of seed.clients) {
    const { error } = await db.from("clients").insert({
      name: client.name,
      phone: client.phone,
      whatsapp: client.whatsapp ?? null,
      email: client.email ?? null,
      budget: client.budget ?? null,
      interested_areas: client.interestedAreas ?? [],
      property_types: client.propertyTypes ?? [],
      bedrooms: client.bedrooms ?? null,
      notes: client.notes ?? null,
      agent_id: client.agentId ? (agentIdMap.get(client.agentId) ?? null) : null,
      status: client.status,
      created_at: client.createdAt,
    });
    if (error) throw error;
  }
  console.log(`✓ ${seed.clients.length} clients`);

  // Appointments
  for (const appointment of seed.appointments) {
    const { error } = await db.from("appointments").insert({
      type: appointment.type,
      property_id: null,
      client_name: appointment.clientName ?? null,
      client_phone: appointment.clientPhone ?? null,
      agent_id: appointment.agentId ? (agentIdMap.get(appointment.agentId) ?? null) : null,
      date: appointment.date,
      time: appointment.time ?? null,
      status: appointment.status,
      notes: appointment.notes ?? null,
    });
    if (error) throw error;
  }
  console.log(`✓ ${seed.appointments.length} appointments`);

  // Deals
  for (const deal of seed.deals) {
    const { error } = await db.from("deals").insert({
      property_id: null,
      client_name: deal.clientName,
      agent_id: deal.agentId ? (agentIdMap.get(deal.agentId) ?? null) : null,
      type: deal.type,
      amount: deal.amount,
      commission: deal.commission,
      status: deal.status,
      date: deal.date,
      notes: deal.notes ?? null,
    });
    if (error) throw error;
  }
  console.log(`✓ ${seed.deals.length} deals`);

  // Inquiries
  for (const inquiry of seed.inquiries) {
    const { error } = await db.from("inquiries").insert({
      name: inquiry.name,
      phone: inquiry.phone,
      email: inquiry.email ?? null,
      subject: inquiry.subject ?? null,
      message: inquiry.message,
      property_id: null,
      created_at: inquiry.createdAt,
    });
    if (error) throw error;
  }
  console.log(`✓ ${seed.inquiries.length} inquiries`);

  // Notifications
  for (const notification of seed.notifications) {
    const { error } = await db.from("notifications").insert({
      title_ar: notification.title.ar,
      title_en: notification.title.en,
      message_ar: notification.message?.ar ?? null,
      message_en: notification.message?.en ?? null,
      type: notification.type ?? "info",
      link: notification.link ?? null,
      read: notification.read ?? false,
      created_at: notification.createdAt,
    });
    if (error) throw error;
  }
  console.log(`✓ ${seed.notifications.length} notifications`);

  // Activity logs
  for (const log of seed.activityLogs) {
    const { error } = await db.from("activity_logs").insert({
      user_id: null,
      action: log.action,
      entity_type: log.entityType,
      entity_id: log.entityId ?? null,
      entity_label: log.entityLabel ?? null,
      details: log.details ?? {},
      created_at: log.createdAt,
    });
    if (error) throw error;
  }
  console.log(`✓ ${seed.activityLogs.length} activity logs`);

  // Settings
  const settings = seed.settings;
  const { error: settingsError } = await db.from("settings").upsert({
    id: "default",
    company_name_ar: settings.companyName.ar,
    company_name_en: settings.companyName.en,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address_ar: settings.address?.ar ?? null,
    address_en: settings.address?.en ?? null,
    facebook: settings.social?.facebook ?? null,
    instagram: settings.social?.instagram ?? null,
    twitter: settings.social?.twitter ?? null,
    linkedin: settings.social?.linkedin ?? null,
    currency: settings.currency,
    default_language: settings.defaultLanguage,
    default_theme: settings.defaultTheme,
    seo_title_ar: settings.seoDefaults?.title?.ar ?? null,
    seo_title_en: settings.seoDefaults?.title?.en ?? null,
    seo_description_ar: settings.seoDefaults?.description?.ar ?? null,
    seo_description_en: settings.seoDefaults?.description?.en ?? null,
  });
  if (settingsError) throw settingsError;
  console.log("✓ settings");

  console.log("\n✅ Seed complete.");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message ?? err);
  process.exit(1);
});
