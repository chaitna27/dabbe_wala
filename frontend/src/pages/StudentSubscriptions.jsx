import { useEffect, useState, useMemo } from "react";
import api from "../api";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { dialDigitsForLink } from "../utils/phone";

function formatPlanLabel(plan) {
  if (!plan) return "Subscription";
  const s = String(plan).replace(/[-_]/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function subscriptionStatusBadge(status) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize tracking-wide ring-1 ring-inset transition-colors";
  switch (status) {
    case "active":
      return `${base} bg-emerald-50 text-emerald-800 ring-emerald-600/15`;
    case "pending":
      return `${base} bg-amber-50 text-amber-900 ring-amber-600/20`;
    case "rejected":
      return `${base} bg-red-50 text-red-800 ring-red-600/15`;
    case "cancelled":
      return `${base} bg-stone-100 text-stone-600 ring-stone-500/15`;
    default:
      return `${base} bg-stone-50 text-stone-700 ring-stone-500/10`;
  }
}

function SubscriptionsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-stone-200/80 bg-white/90 p-6 shadow-card"
        >
          <div className="flex gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-stone-200" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-4 w-[70%] rounded bg-stone-200" />
              <div className="h-3 w-full rounded bg-stone-100" />
              <div className="h-3 w-[85%] rounded bg-stone-100" />
            </div>
          </div>
          <div className="mt-6 h-10 w-full rounded-lg bg-stone-100" />
        </div>
      ))}
    </div>
  );
}

function ProviderAvatar({ name }) {
  const initial = (name && name.trim().charAt(0).toUpperCase()) || "🍱";
  const isLetter = /^[A-Z]$/i.test(initial);
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange/90 to-brand-orange-dark text-xl font-bold text-white shadow-md ring-2 ring-white"
      aria-hidden
    >
      {isLetter ? initial : "🍱"}
    </div>
  );
}

export default function StudentSubscriptions() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [subs, setSubs] = useState([]);
  const [providerMap, setProviderMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authorized = token && role === "student";

  useEffect(() => {
    if (!authorized) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [subsRes, pubRes] = await Promise.all([
          api.get("/subscriptions/student"),
          api.get("/providers/public"),
        ]);
        if (cancelled) return;
        const list = Array.isArray(subsRes.data) ? subsRes.data : [];
        const providers = Array.isArray(pubRes.data) ? pubRes.data : [];
        const map = Object.fromEntries(providers.map((p) => [String(p.id), p]));
        setProviderMap(map);
        setSubs(list);
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.message || "Failed to load subscriptions");
          setSubs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const enriched = useMemo(
    () =>
      subs.map((s) => ({
        ...s,
        provider: providerMap[String(s.provider_id)],
      })),
    [subs, providerMap],
  );

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-brand-cream via-white to-brand-sand/40 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-orange-dark">
              <span aria-hidden className="text-lg">
                🧾
              </span>
              Tiffin plans
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              My subscriptions
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
              Track requests to kitchens, plan length, and approval status—all in one place.
            </p>
          </div>
          <Link
            to="/student/find-meals"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-brand-orange-dark px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-orange/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-orange/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
          >
            <span aria-hidden>🔎</span>
            Browse kitchens
          </Link>
        </header>

        {error ? (
          <div
            className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <SubscriptionsSkeleton />
        ) : enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300/80 bg-white/80 px-6 py-20 text-center shadow-card backdrop-blur-sm">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange/15 to-brand-teal/10 text-4xl">
              📋
            </div>
            <h2 className="text-xl font-bold text-stone-900">No subscriptions yet</h2>
            <p className="mt-2 max-w-md text-sm text-stone-600">
              Subscribe from a kitchen&apos;s page to see meal plans, dates, and status here.
            </p>
            <button
              type="button"
              onClick={() => navigate("/student/find-meals")}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-brand-orange-dark px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
            >
              Find meals &amp; subscribe
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {enriched.map((s) => {
              const p = s.provider;
              const kitchen = p?.kitchenName || "Kitchen";
              const priceLabel =
                p?.minMenuPrice != null && Number.isFinite(Number(p.minMenuPrice))
                  ? `From ₹${Number(p.minMenuPrice)} / meal`
                  : "Pricing set by kitchen";
              const waDigits = dialDigitsForLink(p?.whatsapp || p?.phone || "");
              const start = new Date(s.start_date);
              const end = new Date(s.end_date);
              const durationDays = Math.max(
                0,
                Math.round((end - start) / (1000 * 60 * 60 * 24)),
              );

              return (
                <article
                  key={s.id}
                  className="group flex flex-col rounded-xl border border-stone-200/90 bg-white/95 p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand-orange/25 hover:shadow-card-hover"
                >
                  <div className="flex gap-4">
                    <ProviderAvatar name={kitchen} />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold text-stone-900">{kitchen}</h2>
                      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-stone-500">
                        Plan · {formatPlanLabel(s.plan)}
                      </p>
                      <span className={`mt-2 ${subscriptionStatusBadge(s.status)}`}>{s.status}</span>
                    </div>
                  </div>

                  <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-stone-50/90 px-3 py-2 ring-1 ring-stone-200/60">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                        Meal window
                      </dt>
                      <dd className="mt-0.5 font-semibold text-stone-900">{formatPlanLabel(s.plan)}</dd>
                    </div>
                    <div className="rounded-lg bg-stone-50/90 px-3 py-2 ring-1 ring-stone-200/60">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                        Price hint
                      </dt>
                      <dd className="mt-0.5 font-semibold text-stone-900">{priceLabel}</dd>
                    </div>
                    <div className="col-span-2 rounded-lg bg-gradient-to-r from-brand-cream to-white px-3 py-2 ring-1 ring-brand-orange/15">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                        Duration
                      </dt>
                      <dd className="mt-0.5 font-medium text-stone-800">
                        {start.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        <span className="text-stone-400">→</span>{" "}
                        {end.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <span className="ml-2 text-xs font-normal text-stone-500">
                          ({durationDays} day{durationDays === 1 ? "" : "s"})
                        </span>
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-100 pt-5">
                    <button
                      type="button"
                      onClick={() => navigate(`/student/find-meals/${s.provider_id}`)}
                      className="inline-flex min-h-[44px] flex-1 min-w-[10rem] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-brand-orange-dark px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                    >
                      View kitchen
                    </button>
                    {waDigits ? (
                      <a
                        href={`https://wa.me/${waDigits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] flex-1 min-w-[10rem] items-center justify-center gap-2 rounded-xl border-2 border-emerald-600/30 bg-emerald-50/80 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:border-emerald-600/50 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                      >
                        <span aria-hidden>💬</span>
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-3 text-center text-xs text-stone-500">
                    Need to change dates? Message the kitchen from their page.
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
