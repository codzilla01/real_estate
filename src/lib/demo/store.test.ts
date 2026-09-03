import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoStore } from "./store";

describe("demoStore", () => {
  beforeEach(() => {
    demoStore.resetDemoData();
  });

  it("starts with the seeded dataset", () => {
    expect(demoStore.listProperties().length).toBeGreaterThanOrEqual(20);
    expect(demoStore.listAgents().length).toBeGreaterThanOrEqual(5);
    expect(demoStore.listLeads().length).toBeGreaterThanOrEqual(20);
    expect(demoStore.listClients().length).toBeGreaterThanOrEqual(10);
  });

  it("creates and reads a property", () => {
    const created = demoStore.createProperty({
      slug: "test-villa",
      title: { ar: "فيلا تجريبية", en: "Test Villa" },
      description: { ar: "وصف", en: "Description" },
      type: "villa",
      dealType: "sale",
      status: "available",
      price: 5_000_000,
      currency: "AED",
      area: 400,
      bedrooms: 5,
      bathrooms: 6,
      parking: 2,
      furnished: true,
      city: "Dubai",
      latitude: 25.2,
      longitude: 55.3,
      amenities: ["pool"],
      featured: false,
      isNew: false,
      isHot: false,
      publishedAt: new Date().toISOString(),
      images: [],
    });
    expect(created.id).toBeTruthy();
    expect(created.views).toBe(0);
    expect(demoStore.listProperties().some((p) => p.id === created.id)).toBe(true);
  });

  it("updates a property in place", () => {
    const first = demoStore.listProperties()[0]!;
    const updated = demoStore.updateProperty(first.id, { price: 123_456 });
    expect(updated?.price).toBe(123_456);
    expect(demoStore.listProperties().find((p) => p.id === first.id)?.price).toBe(
      123_456,
    );
  });

  it("deletes a property", () => {
    const first = demoStore.listProperties()[0]!;
    demoStore.deleteProperty(first.id);
    expect(demoStore.listProperties().some((p) => p.id === first.id)).toBe(false);
  });

  it("manages leads with status changes", () => {
    const lead = demoStore.createLead({
      name: "Test Lead",
      phone: "+971501234567",
      source: "website",
      priority: "high",
      status: "new",
    });
    demoStore.updateLead(lead.id, { status: "qualified", priority: "hot" });
    const found = demoStore.listLeads().find((l) => l.id === lead.id);
    expect(found?.status).toBe("qualified");
    expect(found?.priority).toBe("hot");
  });

  it("computes commission-friendly deals and totals", () => {
    const first = demoStore.listDeals()[0]!;
    expect(first.commission).toBeGreaterThanOrEqual(0);
    demoStore.deleteDeal(first.id);
    expect(demoStore.listDeals().some((d) => d.id === first.id)).toBe(false);
  });

  it("marks notifications read and pushes new ones", () => {
    const unread = demoStore.listNotifications().find((n) => !n.read);
    if (unread) {
      demoStore.markNotificationRead(unread.id);
      expect(
        demoStore.listNotifications().find((n) => n.id === unread.id)?.read,
      ).toBe(true);
    }
    const created = demoStore.pushNotification({
      title: { ar: "عنوان", en: "Title" },
      type: "system",
    });
    expect(created.read).toBe(false);
    expect(demoStore.listNotifications().some((n) => n.id === created.id)).toBe(
      true,
    );
  });

  it("logs activity", () => {
    demoStore.logActivity({
      action: "create",
      entityType: "property",
      entityLabel: "Villa",
      details: { id: "x" },
    });
    const logs = demoStore.listActivityLogs();
    expect(logs[0]?.action).toBe("create");
  });

  it("notifies subscribers on mutation and stops after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = demoStore.subscribe(listener);
    demoStore.createLead({
      name: "X",
      phone: "+971500000000",
      source: "website",
      priority: "low",
      status: "new",
    });
    // createLead also pushes a notification, so the store notifies twice
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    demoStore.createLead({
      name: "Y",
      phone: "+971500000001",
      source: "website",
      priority: "low",
      status: "new",
    });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
