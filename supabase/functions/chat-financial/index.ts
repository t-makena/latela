import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const tools = [
  {
    name: "add_goal",
    description: "Add a new savings goal for the user. Use when they want to save toward something specific.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Goal name, e.g. 'Holiday Fund'" },
        target: { type: "number", description: "Target amount in Rands (not cents)" },
        months: { type: "integer", description: "Number of months to achieve the goal" },
      },
      required: ["name", "target", "months"],
    },
  },
  {
    name: "add_budget_item",
    description: "Add a new budget plan item. Use when the user wants to budget for a recurring expense.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Budget item name, e.g. 'Gym'" },
        amount: { type: "number", description: "Amount in Rands (not cents)" },
        frequency: { type: "string", enum: ["monthly", "weekly", "daily", "yearly"], description: "How often this expense occurs" },
      },
      required: ["name", "amount", "frequency"],
    },
  },
  {
    name: "add_calendar_event",
    description: "Schedule a financial event or reminder on the calendar.",
    input_schema: {
      type: "object",
      properties: {
        event_name: { type: "string", description: "Name of the event" },
        event_date: { type: "string", description: "Date in YYYY-MM-DD format" },
        budgeted_amount: { type: "number", description: "Expected amount in Rands" },
        is_recurring: { type: "boolean", description: "Whether this repeats" },
        recurrence_pattern: { type: "string", enum: ["monthly", "weekly", "yearly"], description: "How often it recurs" },
        event_description: { type: "string", description: "Optional description" },
      },
      required: ["event_name", "event_date", "budgeted_amount"],
    },
  },
  {
    name: "list_goals",
    description: "List all of the user's current savings goals with progress.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_budget_items",
    description: "List all of the user's budget plan items.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "delete_goal",
    description: "Delete a savings goal by name. Only use after confirming with the user.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", description: "Name of the goal to delete (case-insensitive match)" } },
      required: ["name"],
    },
  },
  {
    name: "delete_budget_item",
    description: "Delete a budget item by name. Only use after confirming with the user.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", description: "Name of the budget item to delete (case-insensitive match)" } },
      required: ["name"],
    },
  },
  // --- New tools ---
  {
    name: "update_budget_method",
    description: "Switch the user's budget method between 'zero_based' and 'percentage_based'.",
    input_schema: {
      type: "object",
      properties: {
        method: { type: "string", enum: ["zero_based", "percentage_based"], description: "The budget method to switch to" },
      },
      required: ["method"],
    },
  },
  {
    name: "update_budget_percentages",
    description: "Update the needs/wants/savings percentage split. All three values must sum to 100.",
    input_schema: {
      type: "object",
      properties: {
        needs: { type: "integer", description: "Needs percentage (0-100)" },
        wants: { type: "integer", description: "Wants percentage (0-100)" },
        savings: { type: "integer", description: "Savings percentage (0-100)" },
      },
      required: ["needs", "wants", "savings"],
    },
  },
  {
    name: "update_payday",
    description: "Change the user's payday date (day of the month).",
    input_schema: {
      type: "object",
      properties: {
        day: { type: "integer", description: "Day of the month (1-31)" },
      },
      required: ["day"],
    },
  },
  {
    name: "update_income_frequency",
    description: "Change how often the user gets paid.",
    input_schema: {
      type: "object",
      properties: {
        frequency: { type: "string", enum: ["monthly", "bi-weekly", "weekly"], description: "Income frequency" },
      },
      required: ["frequency"],
    },
  },
  {
    name: "delete_account",
    description: "Delete a bank account by name. This also deletes all associated transactions. Only use after confirming with the user.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Account name or bank name to match (case-insensitive)" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_accounts",
    description: "List all of the user's bank accounts with balances.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "update_goal",
    description: "Update an existing savings goal's name, target amount, or current saved amount.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Current name of the goal to find (case-insensitive match)" },
        new_name: { type: "string", description: "New name for the goal (optional)" },
        target: { type: "number", description: "New target amount in Rands (optional)" },
        current_saved: { type: "number", description: "New current saved amount in Rands (optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "update_budget_item",
    description: "Update an existing budget item's name, amount, or frequency.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Current name of the budget item to find (case-insensitive match)" },
        new_name: { type: "string", description: "New name (optional)" },
        amount: { type: "number", description: "New amount in Rands (optional)" },
        frequency: { type: "string", enum: ["monthly", "weekly", "daily", "yearly"], description: "New frequency (optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_calendar_event",
    description: "Delete a calendar event by name. Only use after confirming with the user.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the calendar event to delete (case-insensitive match)" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_calendar_events",
    description: "List the user's upcoming calendar events.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "update_calendar_event",
    description: "Update an existing calendar event's name, date, or budgeted amount.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Current name of the event to find (case-insensitive match)" },
        new_name: { type: "string", description: "New event name (optional)" },
        event_date: { type: "string", description: "New date in YYYY-MM-DD format (optional)" },
        budgeted_amount: { type: "number", description: "New budgeted amount in Rands (optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "get_spending_summary",
    description: "Get a spending breakdown by category for a given number of days. Useful for answering questions like 'where am I spending the most?'",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "integer", description: "Number of days to look back (default 30)" },
      },
      required: [],
    },
  },
  {
    name: "update_profile",
    description: "Update the user's profile information (display name, first name, last name, or bio). Cannot change username or email.",
    input_schema: {
      type: "object",
      properties: {
        display_name: { type: "string", description: "New display name (optional)" },
        first_name: { type: "string", description: "New first name (optional)" },
        last_name: { type: "string", description: "New last name (optional)" },
        bio: { type: "string", description: "New bio (optional)" },
      },
      required: [],
    },
  },
  {
    name: "update_notifications",
    description: "Toggle notification preferences for the user.",
    input_schema: {
      type: "object",
      properties: {
        notifications_enabled: { type: "boolean", description: "Master notifications toggle (optional)" },
        email_notifications: { type: "boolean", description: "Email notifications toggle (optional)" },
        push_notifications: { type: "boolean", description: "Push notifications toggle (optional)" },
      },
      required: [],
    },
  },
];

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ result: string; action?: string }> {
  switch (toolName) {
    case "add_goal": {
      const { name, target, months } = toolInput as { name: string; target: number; months: number };
      if (!name || target <= 0 || months < 1 || months > 120) {
        return { result: "Invalid input: name must be non-empty, target must be positive, months between 1-120." };
      }
      const monthlyAllocation = Math.round((target / months) * 100) / 100;
      const { error } = await supabase.from("goals").insert({
        user_id: userId,
        name,
        target,
        months_left: months,
        monthly_allocation: monthlyAllocation,
        current_saved: 0,
      });
      if (error) return { result: `Failed to add goal: ${error.message}` };
      return { result: `Goal "${name}" added: save R${target.toLocaleString()} over ${months} months (R${monthlyAllocation.toLocaleString()}/month).`, action: "goal_added" };
    }

    case "add_budget_item": {
      const { name, amount, frequency } = toolInput as { name: string; amount: number; frequency: string };
      if (!name || amount <= 0) {
        return { result: "Invalid input: name must be non-empty and amount must be positive." };
      }
      const { error } = await supabase.from("budget_items").insert({
        user_id: userId,
        name,
        amount,
        frequency,
      });
      if (error) return { result: `Failed to add budget item: ${error.message}` };
      return { result: `Budget item "${name}" added: R${amount.toLocaleString()} ${frequency}.`, action: "budget_item_added" };
    }

    case "add_calendar_event": {
      const { event_name, event_date, budgeted_amount, is_recurring, recurrence_pattern, event_description } = toolInput as {
        event_name: string; event_date: string; budgeted_amount: number;
        is_recurring?: boolean; recurrence_pattern?: string; event_description?: string;
      };
      if (!event_name || !event_date || budgeted_amount < 0) {
        return { result: "Invalid input: event_name, event_date required, budgeted_amount must be non-negative." };
      }
      const { error } = await supabase.from("calendar_events").insert({
        user_id: userId,
        event_name,
        event_date,
        budgeted_amount,
        is_recurring: is_recurring || false,
        recurrence_pattern: recurrence_pattern || null,
        event_description: event_description || null,
      });
      if (error) return { result: `Failed to add calendar event: ${error.message}` };
      return { result: `Calendar event "${event_name}" scheduled for ${event_date} with budget R${budgeted_amount.toLocaleString()}.`, action: "calendar_event_added" };
    }

    case "list_goals": {
      const { data, error } = await supabase.from("goals").select("name, target, current_saved, months_left, monthly_allocation").eq("user_id", userId);
      if (error) return { result: `Failed to list goals: ${error.message}` };
      if (!data || data.length === 0) return { result: "No savings goals found." };
      const summary = data.map((g: Record<string, unknown>) =>
        `- ${g.name}: R${Number(g.target).toLocaleString()} target, R${Number(g.current_saved || 0).toLocaleString()} saved, ${g.months_left} months left, R${Number(g.monthly_allocation || 0).toLocaleString()}/month`
      ).join("\n");
      return { result: `Current goals:\n${summary}` };
    }

    case "list_budget_items": {
      const { data, error } = await supabase.from("budget_items").select("name, amount, frequency").eq("user_id", userId);
      if (error) return { result: `Failed to list budget items: ${error.message}` };
      if (!data || data.length === 0) return { result: "No budget items found." };
      const summary = data.map((b: Record<string, unknown>) =>
        `- ${b.name}: R${Number(b.amount).toLocaleString()} ${b.frequency}`
      ).join("\n");
      return { result: `Current budget items:\n${summary}` };
    }

    case "delete_goal": {
      const { name } = toolInput as { name: string };
      const { data, error: fetchError } = await supabase.from("goals").select("id, name").eq("user_id", userId).ilike("name", `%${name}%`);
      if (fetchError) return { result: `Failed to find goal: ${fetchError.message}` };
      if (!data || data.length === 0) return { result: `No goal found matching "${name}".` };
      if (data.length > 1) {
        return { result: `Multiple goals match "${name}": ${data.map((g: Record<string, unknown>) => g.name).join(", ")}. Please be more specific.` };
      }
      const { error } = await supabase.from("goals").delete().eq("id", data[0].id);
      if (error) return { result: `Failed to delete goal: ${error.message}` };
      return { result: `Goal "${data[0].name}" has been deleted.`, action: "goal_deleted" };
    }

    case "delete_budget_item": {
      const { name } = toolInput as { name: string };
      const { data, error: fetchError } = await supabase.from("budget_items").select("id, name").eq("user_id", userId).ilike("name", `%${name}%`);
      if (fetchError) return { result: `Failed to find budget item: ${fetchError.message}` };
      if (!data || data.length === 0) return { result: `No budget item found matching "${name}".` };
      if (data.length > 1) {
        return { result: `Multiple budget items match "${name}": ${data.map((b: Record<string, unknown>) => b.name).join(", ")}. Please be more specific.` };
      }
      const { error } = await supabase.from("budget_items").delete().eq("id", data[0].id);
      if (error) return { result: `Failed to delete budget item: ${error.message}` };
      return { result: `Budget item "${data[0].name}" has been deleted.`, action: "budget_item_deleted" };
    }

    // --- New tool implementations ---

    case "update_budget_method": {
      const { method } = toolInput as { method: string };
      if (!["zero_based", "percentage_based"].includes(method)) {
        return { result: "Invalid method. Must be 'zero_based' or 'percentage_based'." };
      }
      const { error } = await supabase.from("user_settings").update({ budget_method: method }).eq("user_id", userId);
      if (error) return { result: `Failed to update budget method: ${error.message}` };
      return { result: `Budget method changed to ${method.replace("_", " ")}.`, action: "settings_updated" };
    }

    case "update_budget_percentages": {
      const { needs, wants, savings } = toolInput as { needs: number; wants: number; savings: number };
      if (needs < 0 || wants < 0 || savings < 0) {
        return { result: "Percentages must be non-negative." };
      }
      if (needs + wants + savings !== 100) {
        return { result: `Percentages must sum to 100. Currently: ${needs} + ${wants} + ${savings} = ${needs + wants + savings}.` };
      }
      const { error } = await supabase.from("user_settings").update({
        needs_percentage: needs,
        wants_percentage: wants,
        savings_percentage: savings,
      }).eq("user_id", userId);
      if (error) return { result: `Failed to update percentages: ${error.message}` };
      return { result: `Budget split updated to ${needs}% needs / ${wants}% wants / ${savings}% savings.`, action: "settings_updated" };
    }

    case "update_payday": {
      const { day } = toolInput as { day: number };
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        return { result: "Payday must be a whole number between 1 and 31." };
      }
      const { error } = await supabase.from("user_settings").update({ payday_date: day }).eq("user_id", userId);
      if (error) return { result: `Failed to update payday: ${error.message}` };
      return { result: `Payday updated to the ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month.`, action: "settings_updated" };
    }

    case "update_income_frequency": {
      const { frequency } = toolInput as { frequency: string };
      if (!["monthly", "bi-weekly", "weekly"].includes(frequency)) {
        return { result: "Invalid frequency. Must be 'monthly', 'bi-weekly', or 'weekly'." };
      }
      const { error } = await supabase.from("user_settings").update({ income_frequency: frequency }).eq("user_id", userId);
      if (error) return { result: `Failed to update income frequency: ${error.message}` };
      return { result: `Income frequency changed to ${frequency}.`, action: "settings_updated" };
    }

    case "delete_account": {
      const { name } = toolInput as { name: string };
      const { data, error: fetchError } = await supabase
        .from("accounts")
        .select("id, account_name, bank_name, account_type, available_balance")
        .eq("user_id", userId)
        .or(`account_name.ilike.%${name}%,bank_name.ilike.%${name}%`);
      if (fetchError) return { result: `Failed to find account: ${fetchError.message}` };
      if (!data || data.length === 0) return { result: `No account found matching "${name}".` };
      if (data.length > 1) {
        return { result: `Multiple accounts match "${name}": ${data.map((a: Record<string, unknown>) => a.account_name || a.bank_name).join(", ")}. Please be more specific.` };
      }
      const account = data[0];
      // Delete transactions first, then the account
      await supabase.from("transactions").delete().eq("account_id", account.id);
      const { error } = await supabase.from("accounts").delete().eq("id", account.id);
      if (error) return { result: `Failed to delete account: ${error.message}` };
      const displayName = account.account_name || account.bank_name || 'Account';
      return { result: `Account "${displayName}" (${account.account_type}) and all its transactions have been deleted.`, action: "account_deleted" };
    }

    case "list_accounts": {
      const { data, error } = await supabase
        .from("accounts")
        .select("account_name, bank_name, account_type, available_balance, current_balance")
        .eq("user_id", userId);
      if (error) return { result: `Failed to list accounts: ${error.message}` };
      if (!data || data.length === 0) return { result: "No accounts found." };
      const summary = data.map((a: Record<string, unknown>) => {
        const name = a.account_name || a.bank_name || 'Account';
        const balance = ((Number(a.available_balance) || 0) / 100).toFixed(2);
        return `- ${name} (${a.account_type}): R${balance}`;
      }).join("\n");
      return { result: `Your accounts:\n${summary}` };
    }

    case "update_goal": {
      const { name, new_name, target, current_saved } = toolInput as {
        name: string; new_name?: string; target?: number; current_saved?: number;
      };
      const { data, error: fetchError } = await supabase.from("goals").select("id, name").eq("user_id", userId).ilike("name", `%${name}%`);
      if (fetchError) return { result: `Failed to find goal: ${fetchError.message}` };
      if (!data || data.length === 0) return { result: `No goal found matching "${name}".` };
      if (data.length > 1) {
        return { result: `Multiple goals match "${name}": ${data.map((g: Record<string, unknown>) => g.name).join(", ")}. Please be more specific.` };
      }
      const updates: Record<string, unknown> = {};
      if (new_name) updates.name = new_name;
      if (target !== undefined && target > 0) updates.target = target;
      if (current_saved !== undefined && current_saved >= 0) updates.current_saved = current_saved;
      if (Object.keys(updates).length === 0) return { result: "No valid updates provided." };
      const { error } = await supabase.from("goals").update(updates).eq("id", data[0].id);
      if (error) return { result: `Failed to update goal: ${error.message}` };
      const changes = Object.entries(updates).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join(", ");
      return { result: `Goal "${data[0].name}" updated: ${changes}.`, action: "goal_updated" };
    }

    case "update_budget_item": {
      const { name, new_name, amount, frequency } = toolInput as {
        name: string; new_name?: string; amount?: number; frequency?: string;
      };
      const { data, error: fetchError } = await supabase.from("budget_items").select("id, name").eq("user_id", userId).ilike("name", `%${name}%`);
      if (fetchError) return { result: `Failed to find budget item: ${fetchError.message}` };
      if (!data || data.length === 0) return { result: `No budget item found matching "${name}".` };
      if (data.length > 1) {
        return { result: `Multiple budget items match "${name}": ${data.map((b: Record<string, unknown>) => b.name).join(", ")}. Please be more specific.` };
      }
      const updates: Record<string, unknown> = {};
      if (new_name) updates.name = new_name;
      if (amount !== undefined && amount > 0) updates.amount = amount;
      if (frequency) updates.frequency = frequency;
      if (Object.keys(updates).length === 0) return { result: "No valid updates provided." };
      const { error } = await supabase.from("budget_items").update(updates).eq("id", data[0].id);
      if (error) return { result: `Failed to update budget item: ${error.message}` };
      const changes = Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(", ");
      return { result: `Budget item "${data[0].name}" updated: ${changes}.`, action: "budget_item_updated" };
    }

    case "delete_calendar_event": {
      const { name } = toolInput as { name: string };
      const { data, error: fetchError } = await supabase.from("calendar_events").select("id, event_name").eq("user_id", userId).ilike("event_name", `%${name}%`);
      if (fetchError) return { result: `Failed to find event: ${fetchError.message}` };
      if (!data || data.length === 0) return { result: `No calendar event found matching "${name}".` };
      if (data.length > 1) {
        return { result: `Multiple events match "${name}": ${data.map((e: Record<string, unknown>) => e.event_name).join(", ")}. Please be more specific.` };
      }
      const { error } = await supabase.from("calendar_events").delete().eq("id", data[0].id);
      if (error) return { result: `Failed to delete event: ${error.message}` };
      return { result: `Calendar event "${data[0].event_name}" has been deleted.`, action: "calendar_event_deleted" };
    }

    case "list_calendar_events": {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("calendar_events")
        .select("event_name, event_date, budgeted_amount, category, is_recurring, recurrence_pattern")
        .eq("user_id", userId)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(20);
      if (error) return { result: `Failed to list events: ${error.message}` };
      if (!data || data.length === 0) return { result: "No upcoming calendar events." };
      const summary = data.map((e: Record<string, unknown>) => {
        let line = `- ${e.event_name}: ${e.event_date}, R${Number(e.budgeted_amount).toLocaleString()}`;
        if (e.is_recurring) line += ` (recurring ${e.recurrence_pattern || ''})`;
        if (e.category) line += ` [${e.category}]`;
        return line;
      }).join("\n");
      return { result: `Upcoming events:\n${summary}` };
    }

    case "update_calendar_event": {
      const { name, new_name, event_date, budgeted_amount } = toolInput as {
        name: string; new_name?: string; event_date?: string; budgeted_amount?: number;
      };
      const { data, error: fetchError } = await supabase.from("calendar_events").select("id, event_name").eq("user_id", userId).ilike("event_name", `%${name}%`);
      if (fetchError) return { result: `Failed to find event: ${fetchError.message}` };
      if (!data || data.length === 0) return { result: `No calendar event found matching "${name}".` };
      if (data.length > 1) {
        return { result: `Multiple events match "${name}": ${data.map((e: Record<string, unknown>) => e.event_name).join(", ")}. Please be more specific.` };
      }
      const updates: Record<string, unknown> = {};
      if (new_name) updates.event_name = new_name;
      if (event_date) updates.event_date = event_date;
      if (budgeted_amount !== undefined && budgeted_amount >= 0) updates.budgeted_amount = budgeted_amount;
      if (Object.keys(updates).length === 0) return { result: "No valid updates provided." };
      const { error } = await supabase.from("calendar_events").update(updates).eq("id", data[0].id);
      if (error) return { result: `Failed to update event: ${error.message}` };
      const changes = Object.entries(updates).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join(", ");
      return { result: `Calendar event "${data[0].event_name}" updated: ${changes}.`, action: "calendar_event_updated" };
    }

    case "get_spending_summary": {
      const days = Number(toolInput.days) || 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString();
      const { data, error } = await supabase
        .from("v_transactions_with_details")
        .select("parent_category_name, amount")
        .eq("user_id", userId)
        .gte("transaction_date", sinceStr)
        .lt("amount", 0); // Only spending (negative amounts)
      if (error) return { result: `Failed to get spending summary: ${error.message}` };
      if (!data || data.length === 0) return { result: `No spending recorded in the last ${days} days.` };
      // Group by category
      const byCategory: Record<string, number> = {};
      for (const t of data) {
        const cat = (t as Record<string, unknown>).parent_category_name as string || 'Uncategorized';
        byCategory[cat] = (byCategory[cat] || 0) + Math.abs(Number((t as Record<string, unknown>).amount));
      }
      const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
      const total = sorted.reduce((s, [, v]) => s + v, 0);
      const summary = sorted.map(([cat, amt]) => {
        const pct = ((amt / total) * 100).toFixed(1);
        return `- ${cat}: R${(amt / 100).toFixed(2)} (${pct}%)`;
      }).join("\n");
      return { result: `Spending breakdown (last ${days} days, total R${(total / 100).toFixed(2)}):\n${summary}` };
    }

    case "update_profile": {
      const { display_name, first_name, last_name, bio } = toolInput as {
        display_name?: string; first_name?: string; last_name?: string; bio?: string;
      };
      const updates: Record<string, unknown> = {};
      if (display_name !== undefined) updates.display_name = display_name;
      if (first_name !== undefined) updates.first_name = first_name;
      if (last_name !== undefined) updates.last_name = last_name;
      if (bio !== undefined) updates.bio = bio;
      if (Object.keys(updates).length === 0) return { result: "No profile updates provided." };
      const { error } = await supabase.from("user_settings").update(updates).eq("user_id", userId);
      if (error) return { result: `Failed to update profile: ${error.message}` };
      const changes = Object.entries(updates).map(([k, v]) => `${k.replace('_', ' ')}: "${v}"`).join(", ");
      return { result: `Profile updated: ${changes}.`, action: "profile_updated" };
    }

    case "update_notifications": {
      const { notifications_enabled, email_notifications, push_notifications } = toolInput as {
        notifications_enabled?: boolean; email_notifications?: boolean; push_notifications?: boolean;
      };
      const updates: Record<string, unknown> = {};
      if (notifications_enabled !== undefined) updates.notifications_enabled = notifications_enabled;
      if (email_notifications !== undefined) updates.email_notifications = email_notifications;
      if (push_notifications !== undefined) updates.push_notifications = push_notifications;
      if (Object.keys(updates).length === 0) return { result: "No notification preferences provided." };
      const { error } = await supabase.from("user_settings").update(updates).eq("user_id", userId);
      if (error) return { result: `Failed to update notifications: ${error.message}` };
      const changes = Object.entries(updates).map(([k, v]) => `${k.replace('_', ' ')}: ${v ? 'on' : 'off'}`).join(", ");
      return { result: `Notification preferences updated: ${changes}.`, action: "settings_updated" };
    }

    default:
      return { result: `Unknown tool: ${toolName}` };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) throw new Error('Invalid JWT');
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.sub || (payload.exp && payload.exp < Math.floor(Date.now() / 1000))) {
        throw new Error('Token expired or missing sub');
      }
      userId = payload.sub;
    } catch {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { messages } = await req.json();

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user financial context
    const [accountsRes, budgetRes, goalsRes, transactionsRes, settingsRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId),
      supabase.from('budget_items').select('*').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('transactions').select('description, amount, transaction_date, balance').eq('user_id', userId).order('transaction_date', { ascending: false }).limit(500),
      supabase.from('user_settings').select('needs_percentage, wants_percentage, savings_percentage, payday_date, budget_method, currency, income_frequency, display_name, first_name, last_name, notifications_enabled, email_notifications, push_notifications').eq('user_id', userId).single(),
    ]);

    const accounts = accountsRes.data || [];
    const budgetItems = budgetRes.data || [];
    const goals = goalsRes.data || [];
    const transactions = transactionsRes.data || [];
    const settings = settingsRes.data;

    const totalBalance = accounts.reduce((sum: number, a: Record<string, unknown>) => sum + (Number(a.available_balance) || 0), 0);
    const totalBudgeted = budgetItems.reduce((sum: number, b: Record<string, unknown>) => sum + (Number(b.amount) || 0), 0);

    const systemPrompt = `You are Budget Buddy, a friendly and knowledgeable financial education assistant for Latela — a personal finance app for users in South Africa. You speak in a warm, encouraging tone and use simple language. You understand South African financial context (ZAR currency, local banks, cost of living, etc.).

You provide general financial information and educational content only. You do not provide financial advice or personal investment recommendations. This is in alignment with South Africa's Financial Advisory and Intermediary Services (FAIS) Act and oversight from the Financial Sector Conduct Authority (FSCA).

## FAIS COMPLIANCE — What You CANNOT Do
You must NOT:
- Recommend specific investments, shares, ETFs, crypto, forex pairs, insurance, or retirement products
- Advise on when to buy or sell any investment
- Assess what is suitable based on a user's income, risk appetite, or personal goals
- Build personalized investment portfolios or suggest exact allocation percentages as advice
- Provide tax strategies tailored to someone's personal situation

If a user asks for any of the above, decline politely and redirect to education.

## What You CAN Do
- Explain how different financial products work
- Compare asset classes at a high level
- Explain risk concepts and long-term investing principles
- Discuss budgeting and financial literacy concepts
- Describe how regulation works in South Africa
- Provide historical or macroeconomic context

## Language Guidance
Use neutral language such as: "Generally…", "Many investors consider…", "One factor to evaluate is…", "Historically…"
Avoid prescriptive language such as: "You should…", "I recommend…", "Buy…", "Sell…", "This is the best option for you…"

## High-Risk Topics (Extra Caution)
When discussing crypto, forex, leveraged trading, CFDs, options, or day trading:
- Clearly highlight the risks involved
- Do not provide profit projections, trade signals, or position sizing guidance
- Note that leveraged trading carries the risk of losing more than initial capital

## Structured Refusal Templates
When a user requests personalized financial advice, use these patterns:

**Direct investment recommendations** (e.g. "What stock should I buy?"):
"I can't provide personalized investment recommendations. In South Africa, financial advice must be given by a licensed Financial Services Provider. What I can do is explain how to evaluate investments, what metrics investors often look at, and the risks involved. Would you like a breakdown of those factors?"

**Portfolio construction** (e.g. "Build me a portfolio"):
"I'm not able to create a personalized portfolio or suggest allocation percentages. However, I can explain common asset allocation principles, diversification strategies, and how risk levels typically influence portfolio structure. Would you like an overview?"

**Buy/sell timing** (e.g. "Should I sell now?"):
"I can't advise on whether to buy or sell a specific investment. If helpful, I can explain how investors typically think about market timing, volatility, and long-term strategy."

**Suitability / personal circumstances** (e.g. "I earn R30k, what should I invest in?"):
"I'm not able to assess what's suitable for your personal financial situation. A licensed financial advisor can provide guidance tailored to your goals and circumstances. I can, however, explain how different investment types behave across risk levels if that would help."

**High-risk trading signals** (e.g. "Give me a forex signal"):
"I can't provide trading signals or position sizing guidance. Leveraged trading and short-term speculation carry significant risk, including the possibility of losing more than your initial capital. If useful, I can explain how leverage works and the risks involved."

All refusals must be calm, respectful, non-preachy, and brief. Never imply licensing, regulatory approval, or authority to advise. Always suggest consulting a licensed Financial Services Provider (FSP) registered with the FSCA when appropriate.

## Tool Usage
You have tools available to take actions on behalf of the user. When the user asks you to add, update, or delete something — USE THE APPROPRIATE TOOL instead of just giving advice. When they ask to delete something, confirm first, then use the delete tool. These are budgeting and planning features, not financial advice.

## BLOCKED ACTIONS — You CANNOT do these, and must politely refuse:
- **Change password** — tell the user to go to Settings > Security in the app
- **Change username** — tell the user to go to Settings > Profile in the app  
- **Add a new bank account** — tell the user to go to the Accounts page and upload a bank statement

## User's Financial Snapshot
- **Accounts**: ${accounts.length} account(s), total available balance: R${(totalBalance / 100).toFixed(2)}
- **Budget Method**: ${settings?.budget_method || 'percentage_based'} (${settings?.needs_percentage || 50}/${settings?.wants_percentage || 30}/${settings?.savings_percentage || 20} split)
- **Payday**: Day ${settings?.payday_date || 25} of each month
- **Income Frequency**: ${settings?.income_frequency || 'monthly'}
- **Budget Items**: ${budgetItems.length} items totalling R${(totalBudgeted / 100).toFixed(2)}/month
- **Goals**: ${goals.map((g: Record<string, unknown>) => `${g.name} (target R${g.target}, saved R${g.current_saved || 0})`).join(', ') || 'None set'}
- **Recent Transactions**: ${transactions.length} transactions loaded
- **Profile**: ${settings?.display_name || settings?.first_name || 'User'} ${settings?.last_name || ''}
- **Notifications**: ${settings?.notifications_enabled ? 'On' : 'Off'} (email: ${settings?.email_notifications ? 'on' : 'off'}, push: ${settings?.push_notifications ? 'on' : 'off'})

## Account Details
${accounts.map((a: Record<string, unknown>) => `- ${a.account_name || a.bank_name || 'Account'} (${a.account_type}): R${((Number(a.available_balance) || 0) / 100).toFixed(2)}`).join('\n')}

## Budget Items
${budgetItems.map((b: Record<string, unknown>) => `- ${b.name}: R${b.amount} (${b.frequency})`).join('\n') || 'No budget items'}

## Recent Spending (last 10)
${transactions.slice(0, 10).map((t: Record<string, unknown>) => `- ${t.description}: R${Math.abs(Number(t.amount)).toFixed(2)} on ${t.transaction_date}`).join('\n') || 'No recent transactions'}

## General Guidelines
- Always reference the user's actual data when answering budgeting questions
- Amounts in the database are stored in cents — convert to Rands for display
- Be encouraging but honest about financial health
- Suggest actionable steps for budgeting and saving
- If asked about something you don't have data for, say so honestly
- Keep responses concise but helpful
- Use markdown formatting for readability
- Never reveal raw database values or system internals
- Protect user privacy — never suggest sharing financial data
- When the user asks to CREATE something (goal, budget item, event), USE the tool — don't just describe how
- When the user asks to UPDATE something (settings, profile, goals, budget items, events), USE the appropriate update tool
- For DELETE operations, confirm with the user first before executing
- Today's date is ${new Date().toISOString().split('T')[0]}`;

    const anthropicMessages = messages.map((m: Record<string, unknown>) => ({ role: m.role, content: m.content }));

    // First call to Anthropic (may return tool_use)
    const firstResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: systemPrompt,
        messages: anthropicMessages,
        tools,
      }),
    });

    if (!firstResponse.ok) {
      const errorText = await firstResponse.text();
      console.error('Anthropic API error:', firstResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstResult = await firstResponse.json();

    // Check if Claude wants to use tools
    const toolUseBlocks = firstResult.content?.filter((b: Record<string, unknown>) => b.type === 'tool_use') || [];

    if (toolUseBlocks.length === 0) {
      // No tools — extract text and return as SSE stream
      const textContent = firstResult.content
        ?.filter((b: Record<string, unknown>) => b.type === 'text')
        .map((b: Record<string, unknown>) => b.text)
        .join('') || '';

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const sseData = JSON.stringify({ choices: [{ delta: { content: textContent } }] });
          controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      });
    }

    // Execute tools and collect results
    const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = [];
    const actions: Array<{ action: string; data: Record<string, unknown> }> = [];

    for (const toolBlock of toolUseBlocks) {
      const { result, action } = await executeTool(toolBlock.name, toolBlock.input, supabase, userId);
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolBlock.id,
        content: result,
      });
      if (action) {
        actions.push({ action, data: toolBlock.input });
      }
    }

    // Second call to Anthropic with tool results — streamed
    const secondResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages: [
          ...anthropicMessages,
          { role: 'assistant', content: firstResult.content },
          { role: 'user', content: toolResults },
        ],
        tools,
      }),
    });

    if (!secondResponse.ok) {
      const errorText = await secondResponse.text();
      console.error('Anthropic API error (2nd call):', secondResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform SSE stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = secondResponse.body!.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        // First, emit action events so the client can refresh data
        for (const act of actions) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(act)}\n\n`));
        }

        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx: number;
            while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, newlineIdx).trim();
              buffer = buffer.slice(newlineIdx + 1);

              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;

              try {
                const event = JSON.parse(jsonStr);
                if (event.type === 'content_block_delta' && event.delta?.text) {
                  const sseData = JSON.stringify({
                    choices: [{ delta: { content: event.delta.text } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                } else if (event.type === 'message_stop') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                }
              } catch {
                // skip
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (e) {
          console.error('Stream error:', e);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('chat-financial error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
