import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CARD_TYPES = [
  "Amazon",
  "Steam",
  "iTunes / Apple",
  "Google Play",
  "Netflix",
  "Razer Gold",
  "Other",
] as const;

export const COINS = ["BTC", "LTC"] as const;

const ticketInput = z.object({
  cardType: z.enum(CARD_TYPES),
  cardValue: z.number().min(1).max(100000),
  cardCurrency: z.enum(["EUR", "USD", "GBP"]),
  cardCode: z.string().min(4).max(500),
  payoutCoin: z.enum(COINS),
  payoutAddress: z.string().min(10).max(200),
});

export type TicketInput = z.infer<typeof ticketInput>;

export const createTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ticketInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: row, error } = await supabase
      .from("tickets")
      .insert({
        user_id: userId,
        card_type: data.cardType,
        card_value: data.cardValue,
        card_currency: data.cardCurrency,
        card_code: data.cardCode,
        payout_coin: data.payoutCoin,
        payout_address: data.payoutAddress,
      })
      .select("id, status, created_at")
      .single();

    if (error) throw new Error(error.message);

    const webhook = process.env["DISCORD_TICKET_WEBHOOK_URL"];
    if (webhook) {
      try {
        const res = await fetch(webhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            username: "Card2Crypto",
            embeds: [
              {
                title: `New ticket #${row.id.slice(0, 8)}`,
                color: 0x14b8a6,
                fields: [
                  { name: "Card", value: data.cardType, inline: true },
                  {
                    name: "Value",
                    value: `${data.cardValue} ${data.cardCurrency}`,
                    inline: true,
                  },
                  { name: "Payout", value: data.payoutCoin, inline: true },
                  { name: "Code", value: `||${data.cardCode}||` },
                  { name: "Wallet", value: data.payoutAddress },
                  {
                    name: "User",
                    value: String(
                      (claims as { email?: string } | null)?.email ?? userId,
                    ),
                  },
                ],
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
        if (!res.ok) {
          console.error(
            `Discord webhook failed [${res.status}]: ${await res.text()}`,
          );
        }
      } catch (err) {
        console.error("Discord webhook error", err);
      }
    }

    return { id: row.id, status: row.status, createdAt: row.created_at };
  });

export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tickets")
      .select(
        "id, card_type, card_value, card_currency, payout_coin, payout_address, status, admin_note, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
