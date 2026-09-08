import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createTicket, CARD_TYPES, COINS } from "@/lib/tickets.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Card2Crypto – Geschenkkarten in BTC & LTC tauschen" },
      {
        name: "description",
        content:
          "Tausche Amazon-, Steam- oder iTunes-Guthabenkarten sicher in Bitcoin oder Litecoin. Ticket erstellen und Status jederzeit verfolgen.",
      },
      {
        property: "og:title",
        content: "Card2Crypto – Geschenkkarten in BTC & LTC tauschen",
      },
      {
        property: "og:description",
        content:
          "Guthabenkarte eingeben, Ticket erhalten, Auszahlung in Bitcoin oder Litecoin verfolgen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const submitTicket = useServerFn(createTicket);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cardType: CARD_TYPES[0] as (typeof CARD_TYPES)[number],
    cardValue: "",
    cardCurrency: "EUR" as "EUR" | "USD" | "GBP",
    cardCode: "",
    payoutCoin: COINS[0] as (typeof COINS)[number],
    payoutAddress: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(!!session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedIn) {
      navigate({ to: "/auth" });
      return;
    }
    setLoading(true);
    try {
      const res = await submitTicket({
        data: {
          cardType: form.cardType,
          cardValue: Number(form.cardValue),
          cardCurrency: form.cardCurrency,
          cardCode: form.cardCode.trim(),
          payoutCoin: form.payoutCoin,
          payoutAddress: form.payoutAddress.trim(),
        },
      });
      toast.success(`Ticket #${res.id.slice(0, 8)} erstellt`);
      navigate({ to: "/tickets" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ticket konnte nicht erstellt werden",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <span className="font-display text-lg font-bold">
          Card<span className="text-primary">2</span>Crypto
        </span>
        <nav className="flex gap-2">
          {signedIn ? (
            <Button asChild variant="secondary">
              <Link to="/tickets">Meine Tickets</Link>
            </Button>
          ) : (
            <Button asChild variant="secondary">
              <Link to="/auth">Anmelden</Link>
            </Button>
          )}
        </nav>
      </header>

      <main className="hero-surface">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-8 lg:grid-cols-2">
          <div>
            <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              Auszahlung in BTC & LTC
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
              Guthabenkarte rein,
              <br />
              <span className="text-primary">Krypto raus.</span>
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Gib deine Geschenkkarte an, wir prüfen sie manuell und zahlen in Bitcoin
              oder Litecoin aus. Jede Anfrage wird zu einem Ticket, dessen Status du
              jederzeit siehst.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• Amazon, Steam, iTunes, Google Play und mehr</li>
              <li>• Prüfung meist innerhalb weniger Minuten</li>
              <li>• Ticket-Status: offen → in Bearbeitung → ausgezahlt</li>
            </ul>
          </div>
          <img
            src={heroImage}
            alt="Geschenkkarten verwandeln sich in Bitcoin- und Litecoin-Münzen"
            width={1600}
            height={1000}
            className="rounded-3xl border border-border glow"
          />
        </section>

        <section className="mx-auto max-w-2xl px-4 pb-20">
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-border bg-card p-6 sm:p-8"
          >
            <h2 className="text-2xl font-bold">Karte eintauschen</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Deine Angaben gehen direkt an unser Prüf-Team.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kartentyp</Label>
                <Select
                  value={form.cardType}
                  onValueChange={(v) =>
                    setForm({ ...form, cardType: v as (typeof CARD_TYPES)[number] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_TYPES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Kartenwert</Label>
                <div className="flex gap-2">
                  <Input
                    id="value"
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    value={form.cardValue}
                    onChange={(e) => setForm({ ...form, cardValue: e.target.value })}
                    placeholder="50"
                  />
                  <Select
                    value={form.cardCurrency}
                    onValueChange={(v) =>
                      setForm({ ...form, cardCurrency: v as "EUR" | "USD" | "GBP" })
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="code">Kartencode</Label>
                <Input
                  id="code"
                  required
                  minLength={4}
                  value={form.cardCode}
                  onChange={(e) => setForm({ ...form, cardCode: e.target.value })}
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label>Auszahlung in</Label>
                <Select
                  value={form.payoutCoin}
                  onValueChange={(v) =>
                    setForm({ ...form, payoutCoin: v as (typeof COINS)[number] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COINS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet">Wallet-Adresse</Label>
                <Input
                  id="wallet"
                  required
                  minLength={10}
                  value={form.payoutAddress}
                  onChange={(e) => setForm({ ...form, payoutAddress: e.target.value })}
                  placeholder="bc1…"
                />
              </div>
            </div>

            <Button type="submit" className="mt-6 w-full" disabled={loading}>
              {loading
                ? "Ticket wird erstellt…"
                : signedIn
                  ? "Ticket erstellen"
                  : "Anmelden & Ticket erstellen"}
            </Button>
          </form>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Card2Crypto · Manuelle Prüfung jeder Karte
      </footer>
    </div>
  );
}
