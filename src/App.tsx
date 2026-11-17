import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { CONFIG } from "./config";

type Fact = "lt300" | "300-1m" | "gt1m" | "";
type Equipo = "yo" | "1" | "responsable" | "externo" | "";

type Fields = {
  nombre: string;
  email: string;
  tel: string;
  empresa: string;
  sector: string;
  ig: string;
  fact: Fact;
  equipo: Equipo;
  reto: string;
};

type FieldKey = keyof Fields;
type View = "form" | "ok" | "wait";

const EMPTY: Fields = {
  nombre: "",
  email: "",
  tel: "",
  empresa: "",
  sector: "",
  ig: "",
  fact: "",
  equipo: "",
  reto: "",
};

const FACT_OPTIONS: { value: Fact; label: string }[] = [
  { value: "lt300", label: "Menos de 300.000 €" },
  { value: "300-1m", label: "300.000 – 1 M€" },
  { value: "gt1m", label: "Más de 1 M€" },
];

const EQUIPO_OPTIONS: { value: Equipo; label: string }[] = [
  { value: "yo", label: "Yo, en mis ratos libres" },
  { value: "1", label: "Una persona del equipo" },
  { value: "responsable", label: "Responsable o equipo de marketing" },
  { value: "externo", label: "Una agencia o freelance" },
];

// Campos que se validan en cada paso. Instagram es el único opcional.
const STEP_FIELDS: FieldKey[][] = [
  ["nombre", "email", "tel"],
  ["empresa", "sector"],
  ["fact", "equipo"],
  ["reto"],
];

const TOTAL_STEPS = STEP_FIELDS.length;

function isValid(key: FieldKey, v: string): boolean {
  switch (key) {
    case "nombre":
      return v.trim().length > 1;
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
    case "tel":
      return v.replace(/\D/g, "").length >= 9;
    case "empresa":
    case "sector":
      return v.trim().length > 1;
    case "fact":
    case "equipo":
      return v !== "";
    case "reto":
      return v.trim().length > 5;
    default:
      return true;
  }
}

const ERROR_TEXT: Partial<Record<FieldKey, string>> = {
  nombre: "Escribe tu nombre.",
  email: "Revisa el email, parece incompleto.",
  tel: "Escribe un teléfono de contacto.",
  empresa: "Escribe el nombre de tu empresa o marca.",
  sector: "Cuéntanos a qué os dedicáis.",
  fact: "Elige una opción.",
  equipo: "Elige una opción.",
  reto: "Cuéntanos al menos una frase.",
};

export default function App() {
  const [values, setValues] = useState<Fields>(EMPTY);
  const [bad, setBad] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [step, setStep] = useState(0);
  const [view, setView] = useState<View>("form");
  const [started, setStarted] = useState(false);
  const cardRef = useRef<HTMLFormElement>(null);

  // Al cambiar de paso, sube al inicio del formulario.
  useEffect(() => {
    if (!started) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [step, view, started]);

  const qualified = (CONFIG.qualifies as readonly string[]).includes(values.fact);

  function set<K extends FieldKey>(key: K, value: Fields[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setBad((prev) => ({ ...prev, [key]: false }));
  }

  function validateStep(i: number): boolean {
    const nextBad: Partial<Record<FieldKey, boolean>> = {};
    let ok = true;
    for (const key of STEP_FIELDS[i]) {
      if (!isValid(key, values[key])) {
        nextBad[key] = true;
        ok = false;
      }
    }
    setBad((prev) => ({ ...prev, ...nextBad }));
    return ok;
  }

  function next() {
    if (!validateStep(step)) return;
    setStarted(true);
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      setView(qualified ? "ok" : "wait");
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    const target = e.target as HTMLElement;
    if (e.key === "Enter" && target.tagName === "INPUT") {
      e.preventDefault();
      next();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }

  const isResult = view !== "form";

  return (
    <div className="cbf">
      <header className="cbf-top">
        <img src="/climbuu-logo.png" alt="Climbuu" className="cbf-logo" />
      </header>

      <div className="cbf-wrap">
        <section className="cbf-intro">
          <h1>
            Agenda tu consultoría <em>estratégica</em>
          </h1>
          <p>
            Es una llamada de venta de 30 minutos: nos cuentas a qué os dedicáis y qué os frena hoy, y vemos si podemos
            ayudaros.
          </p>
          <ul className="cbf-promise">
            <li>
              <Check />
              Charlamos sobre tu negocio y tu situación actual
            </li>
            <li>
              <Check />
              Te decimos qué servicio encaja con vosotros
            </li>
            <li>
              <Check />
              Si encajamos, te damos tarifas
            </li>
            <li>
              <Check />
              Te lleva 2 minutos rellenar esto
            </li>
          </ul>
        </section>

        <section>
          {!isResult && (
            <div className="cbf-route" aria-hidden="true">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <RouteItem key={i} index={i} current={step} last={i === TOTAL_STEPS - 1} />
              ))}
            </div>
          )}

          <form ref={cardRef} className="cbf-card" onSubmit={onSubmit} onKeyDown={onKeyDown} noValidate>
            {view === "form" && step === 0 && (
              <Step title="Empecemos por ti" sub="Para saber con quién vamos a hablar.">
                <Field id="cbf-nombre" label="Nombre y apellidos" error={bad.nombre && ERROR_TEXT.nombre}>
                  <input
                    id="cbf-nombre"
                    type="text"
                    autoComplete="name"
                    value={values.nombre}
                    onChange={(e) => set("nombre", e.target.value)}
                  />
                </Field>
                <Field id="cbf-email" label="Email" error={bad.email && ERROR_TEXT.email}>
                  <input
                    id="cbf-email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field id="cbf-tel" label="Número de teléfono" error={bad.tel && ERROR_TEXT.tel}>
                  <input
                    id="cbf-tel"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+34 600 000 000"
                    value={values.tel}
                    onChange={(e) => set("tel", e.target.value)}
                  />
                </Field>
              </Step>
            )}

            {view === "form" && step === 1 && (
              <Step title="Cuéntanos de tu marca" sub="Así podemos echar un vistazo antes de la llamada.">
                <Field id="cbf-empresa" label="Empresa o marca" error={bad.empresa && ERROR_TEXT.empresa}>
                  <input
                    id="cbf-empresa"
                    type="text"
                    autoComplete="organization"
                    value={values.empresa}
                    onChange={(e) => set("empresa", e.target.value)}
                  />
                </Field>
                <Field id="cbf-sector" label="¿A qué os dedicáis?" error={bad.sector && ERROR_TEXT.sector}>
                  <input
                    id="cbf-sector"
                    type="text"
                    placeholder="Clínica dental, moda, consultoría…"
                    value={values.sector}
                    onChange={(e) => set("sector", e.target.value)}
                  />
                </Field>
                <Field id="cbf-ig" label={<>Instagram <span className="opt">(opcional)</span></>}>
                  <input
                    id="cbf-ig"
                    type="text"
                    placeholder="@tumarca"
                    value={values.ig}
                    onChange={(e) => set("ig", e.target.value)}
                  />
                </Field>
              </Step>
            )}

            {view === "form" && step === 2 && (
              <Step title="El tamaño de tu negocio" sub="Nos ayuda a proponerte lo que de verdad encaja contigo.">
                <Group legend="Facturación anual aproximada" error={bad.fact && ERROR_TEXT.fact}>
                  {FACT_OPTIONS.map((o) => (
                    <Option
                      key={o.value}
                      name="cbf-fact"
                      value={o.value}
                      label={o.label}
                      checked={values.fact === o.value}
                      onChange={() => set("fact", o.value)}
                    />
                  ))}
                </Group>
                <Group legend="¿Quién lleva hoy vuestro marketing?" error={bad.equipo && ERROR_TEXT.equipo}>
                  {EQUIPO_OPTIONS.map((o) => (
                    <Option
                      key={o.value}
                      name="cbf-equipo"
                      value={o.value}
                      label={o.label}
                      checked={values.equipo === o.value}
                      onChange={() => set("equipo", o.value)}
                    />
                  ))}
                </Group>
              </Step>
            )}

            {view === "form" && step === 3 && (
              <Step title="¿Qué quieres conseguir?" sub="Lo que más te preocupa hoy de tus redes, con tus palabras.">
                <Field id="cbf-reto" label="Tu objetivo o tu mayor bloqueo" error={bad.reto && ERROR_TEXT.reto}>
                  <textarea
                    id="cbf-reto"
                    placeholder="Publicamos cada semana pero no nos llegan clientes…"
                    value={values.reto}
                    onChange={(e) => set("reto", e.target.value)}
                  />
                </Field>
              </Step>
            )}

            {view === "ok" && (
              <div className="cbf-result">
                <h2>Encajamos. Elige tu hueco</h2>
                <p className="cbf-sub">
                  Reserva directamente tu consultoría estratégica de 30 minutos con nuestra dirección. Al confirmar te
                  llegará la invitación al email.
                </p>
                <a className="cbf-btn cbf-primary cbf-big" href={CONFIG.calendarUrl} target="_blank" rel="noopener noreferrer">
                  Ver el calendario y reservar
                </a>
                <div className="cbf-note">
                  Usa el mismo email que has puesto aquí (<strong>{values.email.trim()}</strong>) para que podamos preparar
                  la llamada con tus respuestas.
                </div>
              </div>
            )}

            {view === "wait" && (
              <div className="cbf-result">
                <h2>Tenemos algo hecho para ti</h2>
                <p className="cbf-sub">
                  Por el momento de tu negocio, lo que mejor encaja ahora mismo es nuestra <strong>{CONFIG.membershipName}</strong>:
                  te acompañamos mano a mano cada semana con tus redes sociales y aprendes junto a la comunidad de nuestra
                  agencia, con el mismo método que usamos con nuestros clientes.
                </p>
                {CONFIG.waitlistUrl ? (
                  <a
                    className="cbf-btn cbf-primary cbf-big"
                    href={CONFIG.waitlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apuntarme a la lista de espera
                  </a>
                ) : (
                  <button type="button" className="cbf-btn cbf-primary cbf-big" disabled>
                    Apuntarme a la lista de espera
                  </button>
                )}
                <div className="cbf-note">
                  Las plazas son limitadas. Apúntate y te avisaremos en cuanto abramos la siguiente edición.
                </div>
              </div>
            )}

            {view === "form" && (
              <div className="cbf-actions">
                <button type="button" className="cbf-ghost" onClick={back} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
                  Atrás
                </button>
                <button type="button" className="cbf-btn cbf-primary" onClick={next}>
                  {step === TOTAL_STEPS - 1 ? "Enviar" : "Siguiente"}
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <path d="M5 9.2l2.6 2.6L13 6.4" fill="none" stroke="#DC93E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RouteItem({ index, current, last }: { index: number; current: number; last: boolean }) {
  const cls = index < current ? "done" : index === current ? "now" : "";
  return (
    <>
      <span className={`cbf-hold ${cls}`} />
      {!last && (
        <span className={`cbf-rope ${index < current ? "done" : ""}`}>
          <i />
        </span>
      )}
    </>
  );
}

function Step({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="cbf-step">
      <h2>{title}</h2>
      <p className="cbf-sub">{sub}</p>
      {children}
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  error?: string | false | null;
  children: ReactNode;
}) {
  return (
    <div className={`cbf-field ${error ? "bad" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <div className="cbf-err">{error}</div>}
    </div>
  );
}

function Group({ legend, error, children }: { legend: string; error?: string | false | null; children: ReactNode }) {
  return (
    <fieldset className={`cbf-field cbf-group ${error ? "bad" : ""}`}>
      <legend className="cbf-legend">{legend}</legend>
      <div className="cbf-options">{children}</div>
      {error && <div className="cbf-err">{error}</div>}
    </fieldset>
  );
}

function Option({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="cbf-opt">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
