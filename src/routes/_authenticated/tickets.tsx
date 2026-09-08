import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyTickets } from "@/lib/tickets.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/tickets")({
  head: () => ({
    meta: [
      { title: "My tickets – Card2Crypto" },
      {
        name: "description",
        content:
          "Track the status of your gift card exchange tickets: open, processing or paid.",
      },
      { property: "og:title", content: "My tickets – Card2Crypto" },
      {
        property: "og:description",
        content: "Follow the status of your exchange requests in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TicketsPage,
});

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  processing: "Processing",
  paid: "Paid",
  rejected: "Rejected",
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-secondary text-secondary-foreground",
  processing: "bg-accent text-accent-foreground",
  paid: "bg-primary text-primary-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

function TicketsPage() {
  const navigate = useNavigate();
  const fetchTickets = useServerFn(listMyTickets);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => fetchTickets(),
    refetchInterval: 20000,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">My tickets</h1>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link to="/">New exchange</Link>
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>

        {isLoading && <p className="mt-8 text-muted-foreground">Loading…</p>}
        {error && <p className="mt-8 text-destructive">Could not load your tickets.</p>}

        {data && data.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No tickets yet.</p>
            <Button asChild className="mt-4">
              <Link to="/">Exchange a card</Link>
            </Button>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {data?.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">
                    {t.card_type} · {t.card_value} {t.card_currency}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ticket #{t.id.slice(0, 8)} ·{" "}
                    {new Date(t.created_at).toLocaleString("en-GB")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    STATUS_STYLE[t.status] ?? "bg-secondary"
                  }`}
                >
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>
              <p className="mt-3 break-all text-sm text-muted-foreground">
                Payout: {t.payout_coin} → {t.payout_address}
              </p>
              {t.admin_note && (
                <p className="mt-2 rounded-lg bg-muted p-3 text-sm">{t.admin_note}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
