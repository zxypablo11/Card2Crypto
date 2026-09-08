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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ShieldCheck,
  Lock,
  Eye,
  BadgeCheck,
  Clock,
  Star,
  TicketCheck,
  Send,
  Coins,
} from "lucide-react";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Card2Crypto – Trade Gift Cards for BTC & LTC" },
      {
        name: "description",
        content:
          "Trade Amazon, Steam or iTunes gift cards safely for Bitcoin or Litecoin. Open a ticket and track its status any time.",
      },
      {
        property: "og:title",
        content: "Card2Crypto – Trade Gift Cards for BTC & LTC",
      },
      {
        property: "og:description",
        content:
          "Submit your gift card, get a ticket, and track your Bitcoin or Litecoin payout.",
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
      toast.success(`Ticket #${res.id.slice(0, 8)} created`);
      navigate({ to: "/tickets" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create ticket");
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
              <Link to="/tickets">My tickets</Link>
            </Button>
          ) : (
            <Button asChild variant="secondary">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </header>

      <main className="hero-surface">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-8 lg:grid-cols-2">
          <div>
            <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              Payouts in BTC & LTC
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
              Gift card in,
              <br />
              <span className="text-primary">crypto out.</span>
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Submit your gift card, we verify it manually and pay you out in Bitcoin or
              Litecoin. Every request becomes a ticket whose status you can follow at any
              time.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• Amazon, Steam, iTunes, Google Play and more</li>
              <li>• Usually reviewed within minutes</li>
              <li>• Ticket status: open → processing → paid</li>
            </ul>
          </div>
          <img
            src={heroImage}
            alt="Gift cards turning into Bitcoin and Litecoin coins"
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
            <h2 className="text-2xl font-bold">Exchange a card</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your details go straight to our review team.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Card type</Label>
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
                <Label htmlFor="value">Card value</Label>
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
                <Label htmlFor="code">Card code</Label>
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
                <Label>Pay out in</Label>
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
                <Label htmlFor="wallet">Wallet address</Label>
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
                ? "Creating ticket…"
                : signedIn
                  ? "Create ticket"
                  : "Sign in & create ticket"}
            </Button>
          </form>
        </section>

        {/* Trust stats */}
        <section className="border-y border-border bg-card/50">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 text-center sm:grid-cols-4">
            {[
              { value: "2,400+", label: "Tickets processed" },
              { value: "~15 min", label: "Average review time" },
              { value: "100%", label: "Manual card verification" },
              { value: "2 coins", label: "BTC & LTC payouts" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold text-primary">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
            No hidden steps. You always know where your ticket stands.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: TicketCheck,
                title: "1. Open a ticket",
                text: "Tell us which gift card you have and where your crypto should go. Your ticket gets a unique ID.",
              },
              {
                icon: Eye,
                title: "2. We verify manually",
                text: "A real person checks your card. You can watch the status change from open to processing in your account.",
              },
              {
                icon: Coins,
                title: "3. Get paid",
                text: "Once verified, we send Bitcoin or Litecoin straight to your wallet and mark the ticket as paid.",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <s.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Security */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="grid gap-6 rounded-3xl border border-border bg-card p-8 md:grid-cols-3">
            {[
              {
                icon: Lock,
                title: "Encrypted connection",
                text: "All data is transmitted over HTTPS and stored securely in your account.",
              },
              {
                icon: ShieldCheck,
                title: "Your tickets, only yours",
                text: "Tickets are tied to your account. Nobody else can see your codes or payout details.",
              },
              {
                icon: BadgeCheck,
                title: "Full transparency",
                text: "Every status change and team note is visible on your ticket in real time.",
              },
            ].map((s) => (
              <div key={s.title} className="flex gap-4">
                <s.icon className="h-6 w-6 shrink-0 text-accent" />
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-center text-3xl font-bold">
            What our users say
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Marcus T.",
                text: "Sent a €100 Amazon card, BTC was in my wallet 20 minutes later. The ticket status updates are great.",
              },
              {
                name: "Lena K.",
                text: "Was skeptical at first, but the manual review gives real confidence. Smooth payout in Litecoin.",
              },
              {
                name: "Jay R.",
                text: "Third trade already. Fast, transparent, and support answers quickly when you have a question.",
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <div className="flex gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm text-muted-foreground">
                  “{t.text}”
                </blockquote>
                <figcaption className="mt-4 text-sm font-semibold">
                  {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Replace these sample reviews with real customer feedback.
          </p>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-2xl px-4 pb-20">
          <h2 className="text-center text-3xl font-bold">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            <AccordionItem value="q1">
              <AccordionTrigger>How long does a payout take?</AccordionTrigger>
              <AccordionContent>
                Most cards are reviewed within 15–30 minutes. Once approved, the
                crypto transfer is sent immediately and usually confirms within
                minutes, depending on network load.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Which cards do you accept?</AccordionTrigger>
              <AccordionContent>
                Amazon, Steam, iTunes / Apple, Google Play, Netflix and Razer
                Gold. For anything else, choose “Other” and we will review it
                manually.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Is my card code safe?</AccordionTrigger>
              <AccordionContent>
                Yes. Your code is only visible to the review team and is never
                shown publicly. Tickets are private to your account.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>What fees do you charge?</AccordionTrigger>
              <AccordionContent>
                The exchange rate including our fee is confirmed on your ticket
                before payout — no hidden charges afterwards.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg">
              <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <Send className="mr-2 h-4 w-4" /> Start your first trade
              </a>
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Review team available daily, 9:00–23:00 CET
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>
            Card<span className="text-primary">2</span>Crypto · Every card
            reviewed manually
          </span>
          <nav className="flex gap-6">
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
            <Link to="/tickets" className="hover:text-foreground">My tickets</Link>
          </nav>
        </div>
        <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Card2Crypto. Never share your card code
          with anyone outside your ticket.
        </p>
      </footer>
    </div>
  );
}
