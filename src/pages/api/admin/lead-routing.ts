import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { leadRoutingRules, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const ruleSchema = z.object({
  name: z.string().min(1).max(200),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'starts_with', 'greater_than', 'less_than']),
    value: z.string(),
  })),
  action: z.enum(['assign_clinic', 'route_email', 'notify_admin']),
  actionValue: z.string().min(1),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// GET: List all lead routing rules
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const rules = await db.select().from(leadRoutingRules)
      .orderBy(sql`${leadRoutingRules.priority} DESC`);
    return json({ data: rules });
  } catch (err) {
    console.error('Lead routing rules error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create a new rule OR evaluate a lead against all rules
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();

    // Evaluate mode: test rules against a lead
    if (body.evaluate && body.lead) {
      const lead = body.lead as Record<string, unknown>;
      const rules = await db.select().from(leadRoutingRules)
        .where(eq(leadRoutingRules.isActive, true))
        .orderBy(sql`${leadRoutingRules.priority} DESC`);

      for (const rule of rules) {
        const conditions = rule.conditions as Array<{ field: string; operator: string; value: string }>;
        let matches = true;
        for (const cond of conditions) {
          const fieldValue = String(lead[cond.field] || '');
          switch (cond.operator) {
            case 'equals':
              if (fieldValue !== cond.value) matches = false;
              break;
            case 'contains':
              if (!fieldValue.includes(cond.value)) matches = false;
              break;
            case 'starts_with':
              if (!fieldValue.startsWith(cond.value)) matches = false;
              break;
            case 'greater_than':
              if (Number(fieldValue) <= Number(cond.value)) matches = false;
              break;
            case 'less_than':
              if (Number(fieldValue) >= Number(cond.value)) matches = false;
              break;
          }
          if (!matches) break;
        }
        if (matches) {
          return json({
            matched: true,
            rule: { id: rule.id, name: rule.name, action: rule.action, actionValue: rule.actionValue },
          });
        }
      }
      return json({ matched: false });
    }

    // Create mode
    const parsed = ruleSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400);
    }

    const { name, conditions, action, actionValue, priority, isActive } = parsed.data;

    const [rule] = await db.insert(leadRoutingRules).values({
      name,
      conditions,
      action,
      actionValue,
      priority,
      isActive,
      createdBy: session.userId,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_lead_routing_rule',
      entityType: 'lead_routing_rule',
      entityId: rule.id,
      details: { name, action, actionValue },
    });

    return json({ success: true, rule }, 201);
  } catch (err) {
    console.error('Lead routing rule error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update a rule
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return json({ error: 'Rule ID required' }, 400);

    const allowed = ['name', 'conditions', 'action', 'actionValue', 'priority', 'isActive'] as const;
    const safe: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) safe[key] = updates[key];
    }

    await db.update(leadRoutingRules).set(safe).where(eq(leadRoutingRules.id, id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_lead_routing_rule',
      entityType: 'lead_routing_rule',
      entityId: id,
      details: { fields: Object.keys(safe) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Update routing rule error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove a rule
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Rule ID required' }, 400);

    await db.delete(leadRoutingRules).where(eq(leadRoutingRules.id, id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_lead_routing_rule',
      entityType: 'lead_routing_rule',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Delete routing rule error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
