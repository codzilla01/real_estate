import { z } from "zod";
import {
  AMENITIES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  CLIENT_STATUSES,
  DEAL_STATUSES,
  DEAL_TYPES,
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/constants";
import type {
  AppointmentStatus,
  AppointmentType,
  ClientStatus,
  DealStatus,
  DealType,
  LeadPriority,
  LeadSource,
  LeadStatus,
  PropertyStatus,
  PropertyType,
} from "@/types";

type EnumTuple<T extends string> = readonly [T, ...T[]];

const enumOf = <T extends string>(values: readonly T[]): z.ZodEnum<[T, ...T[]]> =>
  z.enum(values as EnumTuple<T>);

export const localizedTextSchema = z
  .object({
    ar: z.string().min(1, "errors.required"),
    en: z.string().min(1, "errors.required"),
  })
  .or(z.string());

/** Optional numeric field backed by a string input; "" means "not set". */
const optionalNumberInput = (min = 0) =>
  z.union([z.coerce.number().min(min), z.literal("")]).optional();

export const propertySchema = z.object({
  titleAr: z.string().min(3, "errors.minLength"),
  titleEn: z.string().min(3, "errors.minLength"),
  descriptionAr: z.string().min(10, "errors.minLength"),
  descriptionEn: z.string().min(10, "errors.minLength"),
  type: enumOf<PropertyType>(PROPERTY_TYPES),
  dealType: enumOf<DealType>(DEAL_TYPES),
  status: enumOf<PropertyStatus>(PROPERTY_STATUSES),
  price: z.coerce.number().positive("errors.invalidNumber"),
  currency: z.string().min(1),
  area: z.coerce.number().positive("errors.invalidNumber"),
  bedrooms: z.coerce.number().min(0),
  bathrooms: z.coerce.number().min(0),
  parking: z.coerce.number().min(0),
  yearBuilt: z.union([z.coerce.number().min(1900).max(2100), z.literal("")]).optional(),
  furnished: z.boolean(),
  city: z.string().min(1, "errors.required"),
  areaName: z.string().optional(),
  address: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  agentId: z.string().optional(),
  featured: z.boolean(),
  isNew: z.boolean(),
  isHot: z.boolean(),
  seoTitleAr: z.string().optional(),
  seoTitleEn: z.string().optional(),
  seoDescriptionAr: z.string().optional(),
  seoDescriptionEn: z.string().optional(),
  slug: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string(),
        alt: z.string().optional(),
        isCover: z.boolean().optional(),
      }),
    )
    .default([]),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;

export const leadSchema = z.object({
  name: z.string().min(2, "errors.minLength"),
  phone: z.string().min(6, "errors.minLength"),
  email: z.string().email("errors.invalidEmail").optional().or(z.literal("")),
  source: enumOf<LeadSource>(LEAD_SOURCES),
  propertyId: z.string().optional(),
  budget: optionalNumberInput(0),
  location: z.string().optional(),
  agentId: z.string().optional(),
  priority: enumOf<LeadPriority>(LEAD_PRIORITIES),
  status: enumOf<LeadStatus>(LEAD_STATUSES),
  notes: z.string().optional(),
  nextFollowUp: z.string().optional().or(z.literal("")),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

export const clientSchema = z.object({
  name: z.string().min(2, "errors.minLength"),
  phone: z.string().min(6, "errors.minLength"),
  whatsapp: z.string().optional(),
  email: z.string().email("errors.invalidEmail").optional().or(z.literal("")),
  budget: optionalNumberInput(0),
  interestedAreas: z.array(z.string()).default([]),
  propertyTypes: z.array(z.string()).default([]),
  bedrooms: optionalNumberInput(0),
  notes: z.string().optional(),
  agentId: z.string().optional(),
  status: enumOf<ClientStatus>(CLIENT_STATUSES),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const appointmentSchema = z.object({
  type: enumOf<AppointmentType>(APPOINTMENT_TYPES),
  propertyId: z.string().optional(),
  clientName: z.string().min(2, "errors.minLength").optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  agentId: z.string().optional(),
  date: z.string().min(1, "errors.required"),
  time: z.string().optional(),
  status: enumOf<AppointmentStatus>(APPOINTMENT_STATUSES),
  notes: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export const dealSchema = z.object({
  propertyId: z.string().min(1, "errors.required"),
  clientName: z.string().min(2, "errors.minLength"),
  agentId: z.string().optional(),
  type: enumOf<DealType>(DEAL_TYPES),
  amount: z.coerce.number().positive("errors.invalidNumber"),
  commission: z.coerce.number().min(0),
  status: enumOf<DealStatus>(DEAL_STATUSES),
  date: z.string().min(1, "errors.required"),
  notes: z.string().optional(),
});

export type DealFormValues = z.infer<typeof dealSchema>;

export const agentSchema = z.object({
  name: z.string().min(2, "errors.minLength"),
  phone: z.string().min(6, "errors.minLength"),
  whatsapp: z.string().optional(),
  email: z.string().email("errors.invalidEmail").optional().or(z.literal("")),
  bioAr: z.string().optional(),
  bioEn: z.string().optional(),
  languages: z.array(z.string()).default([]),
  areas: z.array(z.string()).default([]),
  specialties: z.array(z.string()).default([]),
  experienceYears: z.coerce.number().min(0).max(60),
  isActive: z.boolean(),
  photo: z.string().optional(),
});

export type AgentFormValues = z.infer<typeof agentSchema>;

export const settingsSchema = z.object({
  companyNameAr: z.string().min(1, "errors.required"),
  companyNameEn: z.string().min(1, "errors.required"),
  phone: z.string().min(6),
  whatsapp: z.string().min(6),
  email: z.string().email("errors.invalidEmail"),
  addressAr: z.string().optional(),
  addressEn: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  currency: z.string().min(1),
  defaultLanguage: z.enum(["ar", "en"]),
  defaultTheme: z.enum(["dark", "light"]),
  seoTitleAr: z.string().optional(),
  seoTitleEn: z.string().optional(),
  seoDescriptionAr: z.string().optional(),
  seoDescriptionEn: z.string().optional(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const inquirySchema = z.object({
  name: z.string().min(2, "errors.minLength"),
  phone: z.string().min(6, "errors.minLength"),
  email: z.string().email("errors.invalidEmail").optional().or(z.literal("")),
  subject: z.string().optional(),
  message: z.string().min(5, "errors.minLength"),
  propertyId: z.string().optional(),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;

export const viewingSchema = z.object({
  name: z.string().min(2, "errors.minLength"),
  phone: z.string().min(6, "errors.minLength"),
  email: z.string().email("errors.invalidEmail").optional().or(z.literal("")),
  preferredDate: z.string().optional().or(z.literal("")),
  preferredTime: z.string().optional().or(z.literal("")),
  message: z.string().optional(),
  propertyId: z.string().optional(),
});

export type ViewingFormValues = z.infer<typeof viewingSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "errors.minLength"),
  phone: z.string().min(6, "errors.minLength"),
  email: z.string().email("errors.invalidEmail").optional().or(z.literal("")),
  subject: z.string().optional(),
  message: z.string().min(5, "errors.minLength"),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export const loginSchema = z.object({
  email: z.string().email("errors.invalidEmail"),
  password: z.string().min(6, "errors.minLength"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("errors.invalidEmail"),
});

export type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export const amenityOptions = AMENITIES;
