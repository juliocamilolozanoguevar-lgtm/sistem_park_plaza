import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Banknote, BedDouble, CalendarDays, Car, Check, ChevronRight, ClipboardList, Clock3, ConciergeBell, CreditCard, Download, HelpCircle, Home, Minus, Plus, QrCode, Search, ShoppingBag, Smartphone, Sparkles, SunMedium, Users, Waves, Map, BookOpen, Wifi, Coffee, FileText, CheckCircle2, Utensils, ChefHat, Bike } from "lucide-react";
import { ExperienceFlow } from "./ExperienceFlows";
import { ModernHome, ModernWelcome } from "./ModernExperience";
import { apiBaseUrl } from "./config/api";
import { connectCustomerRealtime, realtime } from "./api/realtime";
import { getGuestProfile, loginCustomer, loginGuest } from "./api/authApi";
import { getEvents } from "./api/eventsApi";
import { getConsumptions } from "./api/consumptionsApi";
import { createOrder, getMenu, getOrders } from "./api/ordersApi";
import { createClient, createPublicEvent, createReservation, getPublicEventSpaces, getServiceExtras, getServicePlans, getServices, recoverReservations } from "./api/publicApi";
import { createServiceReservation, getCustomerServiceReservations } from "./api/servicesApi";
const serviceImages = {
  HOSPEDAJE: "/images/experiences/hospedaje.webp",
  PISCINA: "/images/experiences/piscina.webp",
  MIRADOR: "/images/experiences/mirador.webp",
  EVENTOS: "/images/experiences/eventos.webp"
};
const menuImages = { CEVICHE: "/images/menu/ceviche.webp", LOMO: "/images/menu/lomo.webp", JUANE: "/images/menu/juane.webp", PISCO: "/images/menu/pisco.webp", SELVA: "/images/menu/selva.webp" };
const productImageHints = [
  [["ARROZ", "JUANE", "POLLO", "LECHUGA", "PIMIENTA"], "/images/menu/juane.webp"],
  [["ACEITE", "LOMO", "CARNE", "FIDEOS", "TALLARIN"], "/images/menu/lomo.webp"],
  [["AZUCAR", "LIMON", "GASEOSA", "SELVA", "JUGO"], "/images/menu/selva.webp"],
  [["PISCO", "GIN", "RON", "CERVEZA", "BEBIDA", "COCTEL"], "/images/menu/pisco.webp"],
  [["PESCADO", "CEVICHE", "MARISCO"], "/images/menu/ceviche.webp"]
];
const fallbackMenuImage = "/images/menu/juane.webp";
const menuPresentationHints = [
  { keys: ["ACEITE"], name: "Lomo saltado de la casa", category: "Fondos - Cocina", description: "Lomo salteado con papas doradas y arroz.", image: "/images/menu/lomo.webp", tags: ["Caliente", "Favorito"] },
  { keys: ["ARROZ"], name: "Arroz chaufa amazónico", category: "Fondos - Cocina", description: "Arroz salteado con toque regional.", image: "/images/menu/juane.webp", tags: ["Regional"] },
  { keys: ["AZUCAR"], name: "Refresco natural de camu camu", category: "Bebidas - Cocina", description: "Bebida fresca de fruta regional.", image: "/images/menu/selva.webp", tags: ["Frío"] },
  { keys: ["FIDEOS", "TALLARIN"], name: "Tallarines saltados", category: "Fondos - Cocina", description: "Tallarines salteados con verduras y salsa de la casa.", image: "/images/menu/lomo.webp", tags: ["Caliente"] },
  { keys: ["LECHUGA"], name: "Ensalada fresca Park Plaza", category: "Entradas - Cocina", description: "Ensalada ligera con vegetales frescos.", image: "/images/menu/juane.webp", tags: ["Ligero"] },
  { keys: ["PIMIENTA"], name: "Pollo grillado con guarnición", category: "Fondos - Cocina", description: "Pollo a la plancha con guarnición de temporada.", image: "/images/menu/juane.webp", tags: ["Casa"] },
  { keys: ["PESCADO"], name: "Ceviche regional", category: "Entradas - Cocina", description: "Pescado fresco con cítricos y acompañamientos.", image: "/images/menu/ceviche.webp", tags: ["Fresco"] },
  { keys: ["LIMON"], name: "Limonada frozen", category: "Bebidas - Bar", description: "Limonada helada preparada al momento.", image: "/images/menu/selva.webp", tags: ["Sin alcohol"] },
  { keys: ["PISCO"], name: "Pisco sour clásico", category: "Cocteles - Bar", description: "Cóctel clásico peruano.", image: "/images/menu/pisco.webp", tags: ["Clásico"] },
  { keys: ["GINEBRA", "GIN"], name: "Gin tonic amazónico", category: "Cocteles - Bar", description: "Gin tonic con notas cítricas.", image: "/images/menu/pisco.webp", tags: ["Bar"] }
];
const icons = { HOSPEDAJE: BedDouble, PISCINA: Waves, MIRADOR: SunMedium, EVENTOS: Sparkles };
const initialIdentity = { reservationCode: "", documentType: "DNI", documentNumber: "", firstName: "", lastName: "", phone: "", email: "" };

export function App() {
  const storedCustomer = JSON.parse(localStorage.getItem("pp_customer_client") || "null");
  const [screen, setScreen] = useState(() => sessionStorage.getItem("pp_customer_screen") || (storedCustomer ? "home" : "welcome"));
  const [client, setClient] = useState(storedCustomer);
  const [catalog, setCatalog] = useState({ services: [], roomTypes: [], menu: [], eventSpaces: [], restaurantMenu: [], plans: {}, extrasByService: {}, eventLayouts: [], eventEquipment: [], parking: {} });
  const [experience, setExperience] = useState(null);
  const [selection, setSelection] = useState(() => JSON.parse(sessionStorage.getItem("pp_customer_selection") || "null"));
  const [paymentResult, setPaymentResult] = useState(null);
  const [notice, setNotice] = useState("");
  const [identityDraft, setIdentityDraft] = useState(() => JSON.parse(sessionStorage.getItem("pp_customer_identity_draft") || JSON.stringify(initialIdentity)));
  const [recoveryDocument, setRecoveryDocument] = useState(() => sessionStorage.getItem("pp_customer_recovery_document") || "");
  const [identityNext, setIdentityNext] = useState(() => sessionStorage.getItem("pp_customer_identity_next") || "");
  const sessionVersion = useRef(0);

  useEffect(() => { loadCatalog().then(setCatalog).catch(() => {}); }, []);
  useEffect(() => { if (client) { connectCustomerRealtime(); refreshExperience(); loadCatalog(true).then(setCatalog).catch(() => {}); } }, [client]);
  useEffect(() => { sessionStorage.setItem("pp_customer_screen", screen); }, [screen]);
  useEffect(() => { sessionStorage.setItem("pp_customer_selection", JSON.stringify(selection)); }, [selection]);
  useEffect(() => { sessionStorage.setItem("pp_customer_identity_draft", JSON.stringify(identityDraft)); }, [identityDraft]);
  useEffect(() => { sessionStorage.setItem("pp_customer_recovery_document", recoveryDocument); }, [recoveryDocument]);
  useEffect(() => { sessionStorage.setItem("pp_customer_identity_next", identityNext); }, [identityNext]);
  useEffect(() => {
    if (!client) return undefined;
    let timer;
    const sync = (event = {}) => {
      if (event.clientId && Number(event.clientId) !== Number(client.id)) return;
      clearTimeout(timer);
      timer = setTimeout(() => { refreshExperience(); loadCatalog().then(setCatalog).catch(() => {}); }, 80);
    };
    const reconnect = () => sync({ source: "reconnect" });
    const fallback = setInterval(() => {
      if (document.visibilityState === "visible") sync({ source: "fallback" });
    }, 2500);
    const refreshOnReturn = () => { if (document.visibilityState === "visible") refreshExperience(); };
    realtime.on("state:changed", sync);
    realtime.on("connect", reconnect);
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => { clearTimeout(timer); clearInterval(fallback); document.removeEventListener("visibilitychange", refreshOnReturn); realtime.off("state:changed", sync); realtime.off("connect", reconnect); };
  }, [client?.id]);

  async function refreshExperience() {
    const version = ++sessionVersion.current;
    const token = localStorage.getItem("pp_customer_token");
    const storedClient = JSON.parse(localStorage.getItem("pp_customer_client") || "null");
    if (!token) {
      if (storedClient?.documentNumber) {
        const value = await buildPublicExperience(storedClient.documentNumber).catch(() => null);
        if (version === sessionVersion.current) setExperience(value);
        return value;
      }
      setExperience(null);
      return null;
    }
    try {
      const value = storedClient?.customerScope ? await buildCustomerExperience(storedClient) : await buildGuestExperience();
      const sameSession = version === sessionVersion.current && token === localStorage.getItem("pp_customer_token");
      if (sameSession) setExperience(value);
      return sameSession ? value : null;
    } catch (error) {
      // A temporary Wi-Fi/API failure must never expel the guest. Only an
      // explicitly invalid or disabled session is cleared.
      if (version === sessionVersion.current && [401, 403].includes(error?.status)) {
        localStorage.removeItem("pp_customer_token");
        localStorage.removeItem("pp_customer_client");
        setClient(null);
        setExperience(null);
      }
      return null;
    }
  }
  function activateClient(value) { sessionVersion.current += 1; setExperience(null); setPaymentResult(null); setClient(value); }
  function showError(error) { setNotice(error.message || String(error)); }
  function go(next) { setScreen(next); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function requireIdentity(next) { setIdentityNext(next); go("identify"); }
  function continueWithCustomer(next) {
    const savedClient = JSON.parse(localStorage.getItem("pp_customer_client") || "null");
    const token = localStorage.getItem("pp_customer_token");
    const needsRegisteredClient = (next === "checkout" && selection?.service?.code === "HOSPEDAJE") || next === "event-confirmation";
    if (needsRegisteredClient) {
      if (savedClient?.reservationDraftClient && savedClient?.documentNumber && savedClient?.firstName && savedClient?.lastName) {
        if (!client) setClient(savedClient);
        go(next);
        return;
      }
      requireIdentity(next);
      return;
    }
    if (token) {
      if (!client) setClient(savedClient);
      go(next);
      return;
    }
    requireIdentity(next);
  }
  function completeIdentity(value) { const next = identityNext || "home"; setIdentityNext(""); activateClient(value); go(next); }
  function resetExperience(next = "welcome") { sessionVersion.current += 1; localStorage.removeItem("pp_customer_token"); localStorage.removeItem("pp_customer_client"); ["pp_customer_selection", "pp_customer_identity_draft", "pp_customer_identity_next", "pp_customer_recovery_document"].forEach((key) => sessionStorage.removeItem(key)); setClient(null); setExperience(null); setSelection(null); setPaymentResult(null); setIdentityDraft(initialIdentity); setIdentityNext(""); setRecoveryDocument(""); setNotice(""); go(next); }

  async function registerPublicCustomer(draftClient) {
    const dbClient = await createClient(draftClient);
    const session = await loginCustomer(dbClient.documentNumber);
    const savedClient = { ...draftClient, ...dbClient, ...(session.client || {}), reservationDraftClient: true, customerScope: true };
    localStorage.setItem("pp_customer_token", session.token);
    localStorage.setItem("pp_customer_client", JSON.stringify(savedClient));
    return savedClient;
  }

  return (
    <div className={`customer-app ${screen === "welcome" ? "welcome-active" : ""}`}>
      {notice ? <div className="toast" onClick={() => setNotice("")}>{notice}</div> : null}
      {screen === "welcome" ? <ModernWelcome onCredential={async (draftClient) => { if (draftClient) { try { const saved = await registerPublicCustomer(draftClient); activateClient(saved); } catch (error) { showError(error); return; } } go("home"); }} onRecover={() => go("recover")} /> : null}
      {screen === "identify" ? <Identify form={identityDraft} setForm={setIdentityDraft} onBack={() => go(identityNext === "checkout" || identityNext === "event-confirmation" ? "experience-flow" : "welcome")} onDone={completeIdentity} reservationFlow={identityNext === "checkout" || identityNext === "event-confirmation"} registrationFlow={(identityNext === "checkout" && selection?.service?.code === "HOSPEDAJE") || identityNext === "event-confirmation"} /> : null}
      {screen === "recover" ? <RecoverReservation documentNumber={recoveryDocument} setDocumentNumber={setRecoveryDocument} onBack={() => go("welcome")} onDone={(value) => { activateClient(value.client); setExperience(value.experience); go("reservations"); }} /> : null}
      {screen === "home" ? <ModernHome client={client} catalog={catalog} experience={experience} onService={(service) => { setSelection({ service }); go("experience-flow"); }} onExperience={() => go("experience")} onReservations={() => go("reservations")} onExit={() => resetExperience("welcome")} /> : null}
      {screen === "experience-flow" ? <ExperienceFlow service={selection?.service} catalog={catalog} hasExistingParking={Boolean((experience?.bookings || []).some((item) => (item.vehicles || []).length || item.parkingSpace || item.parkingSpaces?.length))} onBack={() => go("home")} onCheckout={(value) => { setSelection(value); continueWithCustomer("checkout"); }} onEventCheckout={(eventDraft) => { setSelection({ eventDraft }); continueWithCustomer("event-confirmation"); }} /> : null}
      {screen === "event-quote" ? <EventQuote catalog={catalog} onBack={() => go("home")} onDone={async (result) => { setPaymentResult({ event: result }); await refreshExperience(); go("event-success"); }} /> : null}
      {screen === "checkout" ? <Checkout selection={selection} catalog={catalog} onBack={() => go("experience-flow")} onPaid={async (result) => { setPaymentResult(result); await refreshExperience(); go("success"); }} /> : null}
      {screen === "event-confirmation" ? <EventConfirmation draft={selection?.eventDraft} onBack={() => go("experience-flow")} onPaid={async (result) => { setPaymentResult({ event: result }); await refreshExperience(); go("event-success"); }} /> : null}
      {screen === "balance-payment" ? <BalancePayment booking={selection?.booking} event={selection?.event} onBack={() => go(selection?.returnTo || "reservations")} onPaid={async () => { await refreshExperience(); setNotice("Pago registrado. Tu QR está listo para ser validado al ingresar."); go(selection?.returnTo || "reservations"); }} /> : null}
      {screen === "success" ? <PaymentSuccess result={paymentResult} selection={selection} onExperience={() => go("experience")} onAdd={() => go("home")} /> : null}
      {screen === "event-success" ? <EventSuccess event={paymentResult?.event || paymentResult} onReservations={() => go("reservations")} onAdd={() => go("home")} /> : null}
      {screen === "reservations" ? <MyReservations experience={experience} onBack={() => go("home")} onPay={(booking) => { setSelection({ booking, returnTo: "reservations" }); go("balance-payment"); }} onPayEvent={(event) => { setSelection({ event, returnTo: "reservations" }); go("balance-payment"); }} onAdd={() => go("home")} /> : null}
      {screen === "experience" ? <Experience experience={experience} onBack={() => go("home")} onPay={(booking) => { setSelection({ booking, returnTo: "experience" }); go("balance-payment"); }} onOrders={async () => { await refreshExperience(); go("orders"); }} onRequest={() => go("requests")} onAdd={() => go("home")} /> : null}
      {screen === "orders" ? <Orders catalog={catalog} experience={experience} onBack={() => go("experience")} onPlaced={async () => { await refreshExperience(); go("experience"); }} /> : null}
      {screen === "requests" ? <Requests onBack={() => go("experience")} onDone={async () => { await refreshExperience(); go("experience"); }} /> : null}
      {screen === "directory" ? <Directory onBack={() => go("home")} /> : null}
      {!["welcome", "identify", "recover", "experience-flow", "checkout", "event-confirmation", "balance-payment", "success", "event-quote", "event-success"].includes(screen) ? <BottomNav screen={screen} go={go} ordersEnabled={canPlaceOrders(experience)} hasClient={Boolean(client)} /> : null}
    </div>
  );
}

function RecoverReservation({ onBack, documentNumber, setDocumentNumber, onDone }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const recovered = await recoverReservations(documentNumber);
      const session = await loginCustomer(recovered.client.documentNumber);
      const savedClient = { ...recovered.client, ...(session.client || {}), reservationDraftClient: true, customerScope: true };
      localStorage.setItem("pp_customer_token", session.token);
      localStorage.setItem("pp_customer_client", JSON.stringify(savedClient));
      const orders = await getOrders().catch(() => []);
      onDone({ client: savedClient, experience: { ...normalizeRecoveredExperience(recovered), orders } });
    } catch (cause) {
      setError(cause.message || "No encontramos reservas con ese documento.");
    } finally {
      setBusy(false);
    }
  }
  return <Page title="Recupera tu reserva" subtitle="Consulta tus reservas registradas en el hotel con tu documento." onBack={onBack}><form className="card form" onSubmit={submit}><Info icon={QrCode} title="Búsqueda en el sistema" text="Si el documento existe, mostraremos el titular y sus reservas guardadas."/><Field label="DNI o carnet de extranjería" value={documentNumber} onChange={setDocumentNumber}/>{error ? <p className="error">{error}</p> : null}<button className="primary wide" disabled={busy}>{busy ? "Revisando…" : "Recuperar mi reserva"}</button></form></Page>;
}

function Identify({ onBack, onDone, form, setForm, reservationFlow, registrationFlow }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event) { event.preventDefault(); setBusy(true); setError(""); try { if (registrationFlow) { const dbClient = await createClient({ documentType: form.documentType || "DNI", documentNumber: form.documentNumber, firstName: form.firstName, lastName: form.lastName, phone: form.phone, email: form.email }); const session = await loginCustomer(dbClient.documentNumber); const savedClient = { ...dbClient, ...(session.client || {}), reservationDraftClient: true, customerScope: true }; localStorage.setItem("pp_customer_token", session.token); localStorage.setItem("pp_customer_client", JSON.stringify(savedClient)); onDone(savedClient); return; } const result = await loginGuest({ reservationCode: form.reservationCode, documentNumber: form.documentNumber }); const savedClient = { ...(result.client || {}), ...(result.stay ? { stay: result.stay } : {}), documentNumber: form.documentNumber, reservationCode: form.reservationCode }; localStorage.setItem("pp_customer_token", result.token); localStorage.setItem("pp_customer_client", JSON.stringify(savedClient)); connectCustomerRealtime(); onDone(savedClient); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  if (registrationFlow) return <Page title="Datos del titular" subtitle="Registra al cliente que aparecerá en la reserva." onBack={onBack}><form className="card form" onSubmit={submit}><div className="segments"><button type="button" className={form.documentType === "DNI" ? "active" : ""} onClick={() => setForm({ ...form, documentType: "DNI" })}>Nacional · DNI</button><button type="button" className={form.documentType !== "DNI" ? "active" : ""} onClick={() => setForm({ ...form, documentType: "CE" })}>Extranjero</button></div><Info icon={QrCode} title="Reserva pública segura" text="Estos datos quedarán guardados para asociar tus reservas en el panel del hotel."/><Field label="Número de documento" value={form.documentNumber} onChange={(documentNumber) => setForm({ ...form, documentNumber })}/><div className="two"><Field label="Nombres" value={form.firstName} onChange={(firstName) => setForm({ ...form, firstName })}/><Field label="Apellidos" value={form.lastName} onChange={(lastName) => setForm({ ...form, lastName })}/></div><Field label="Celular" value={form.phone} onChange={(phone) => setForm({ ...form, phone })}/><Field label="Correo para comprobantes" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })}/>{error ? <p className="error">{error}</p> : null}<button className="primary" disabled={busy}>{busy ? "Guardando…" : "Continuar a confirmar reserva"}</button></form></Page>;
  return <Page title={reservationFlow ? "Identifica tu estadía" : "Identifica al huésped"} subtitle="Ingresa con una estadía activa. El hotel valida tu identidad con el código de reserva y tu documento." onBack={onBack}><form className="card form" onSubmit={submit}><Info icon={QrCode} title="Acceso de huésped" text="El portal usará un token seguro; tus pedidos y consumos se asociarán a tu estadía activa."/><Field label="Código de reserva" value={form.reservationCode || ""} onChange={(reservationCode) => setForm({ ...form, reservationCode })}/><Field label="Número de documento" value={form.documentNumber} onChange={(documentNumber) => setForm({ ...form, documentNumber })}/>{error ? <p className="error">{error}</p> : null}<button className="primary" disabled={busy}>{busy ? "Validando…" : "Entrar a mi experiencia"}</button></form></Page>;
}

function JourneySteps({ current }) {
  return <div className="journey" aria-label={`Paso ${current} de 3`}>{["Elige", "Revisa", "Confirma"].map((label, index) => <span className={index + 1 <= current ? "done" : ""} key={label}><i>{index + 1 < current ? "✓" : index + 1}</i>{label}</span>)}</div>;
}

function Checkout({ selection, onBack, onPaid }) {
  const [mode, setMode] = useState("FULL");
  const [method, setMethod] = useState("YAPE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cash = method === "CAJA HOTEL";
  const due = cash ? 0 : mode === "HALF" ? selection.total / 2 : selection.total;
  const isLodging = selection?.service?.code === "HOSPEDAJE";

  async function pay() { 
    setBusy(true); setError(""); 
    try { 
      let result;
      if (isLodging) {
        const clientStr = localStorage.getItem("pp_customer_client");
        const client = clientStr ? JSON.parse(clientStr) : {};
        const payload = {
          roomId: selection.room?.id,
          checkInDate: selection.checkIn || selection.date,
          checkOutDate: selection.checkOut,
          adults: selection.adults,
          children: selection.children,
          documentType: client.documentType || "DNI",
          documentNumber: client.documentNumber,
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
          email: client.email,
          address: client.address || "",
          notes: selection.notes || ""
        };
        
        if (!payload.documentNumber || !payload.firstName || !payload.lastName) {
            setError("Faltan datos de contacto del cliente. Por favor, regresa al paso anterior para identificarte.");
            setBusy(false);
            return;
        }

        const backendRes = await createReservation(payload);
        const session = await loginCustomer(backendRes.client?.documentNumber || payload.documentNumber);
        const savedClient = { ...client, ...(backendRes.client || {}), ...(session.client || {}), reservationDraftClient: true, customerScope: true };
        localStorage.setItem("pp_customer_token", session.token);
        localStorage.setItem("pp_customer_client", JSON.stringify(savedClient));
        result = { 
          booking: { 
            ...backendRes,
            paid: backendRes.advance 
          } 
        };
      } else {
        if (!selection?.slotId || !selection?.planId) throw new Error("Selecciona un horario y plan disponible.");
        const backendRes = await createServiceReservation({
          serviceType: selection.service.code,
          date: selection.date,
          slotId: selection.slotId,
          planId: selection.planId,
          adults: selection.adults,
          children: selection.children,
          extras: (selection.extras || []).map((item) => ({ id: item.id, quantity: item.quantity || 1 })),
          notes: selection.notes || ""
        });
        result = { booking: normalizeServiceBooking(backendRes) };
      }
      await onPaid(result); 
    } catch (cause) { 
      setError(cause.message || "No se pudo registrar la operación"); 
    } finally { 
      setBusy(false); 
    } 
  }

  return <Page title={isLodging ? "Confirma tu reserva" : "Confirma tu experiencia"} subtitle={isLodging ? "Revisa tu reserva antes de confirmar." : "Revisa cada concepto y decide cuánto deseas pagar ahora."} onBack={onBack}>
    <JourneySteps current={3}/>
    <section className="checkout-grid">
      {!isLodging && (
        <div>
          <div className="card"><h2>1. ¿Cómo deseas reservar?</h2><button type="button" className={`pay-choice ${mode === "FULL" ? "selected" : ""}`} onClick={() => setMode("FULL")}><b>Pagar el total · S/ {Number(selection.total).toFixed(2)}</b><small>La reserva queda pagada. El QR estará listo, pero se activará cuando el personal valide tu ingreso.</small></button><button type="button" className={`pay-choice ${mode === "HALF" ? "selected" : ""}`} onClick={() => setMode("HALF")}><b>Reservar con 50% · S/ {(selection.total / 2).toFixed(2)}</b><small>Separa fecha, habitación o cupo. Podrás completar el saldo desde tu QR o tus reservas.</small></button></div>
          <div className="card"><h2>2. Método de pago</h2><PaymentMethods value={method} onChange={setMethod}/>{cash ? <Info icon={Banknote} title="Pago pendiente en Recepción" text="No se marcará como pagado hasta que Caja reciba y valide el efectivo. Podrás cambiar luego a un método digital."/> : null}</div>
        </div>
      )}
      <InvoiceSummary selection={selection} cash={isLodging ? true : cash} mode={isLodging ? "FULL" : mode}/>
    </section>
    {error ? <p className="error">{error}</p> : null}
    <div className="checkout-action">
      <button className="primary wide" disabled={busy} onClick={pay}>
        {busy ? "Procesando…" : isLodging ? "Confirmar reserva" : cash ? "Confirmar reserva pendiente de caja" : `Pagar S/ ${Number(due).toFixed(2)}`}
      </button>
    </div>
    {!isLodging && <small className="center">Esta reserva online estará disponible próximamente. No se guardará una operación hasta habilitar el contrato final.</small>}
  </Page>;
}

function EventConfirmation({ draft, onBack, onPaid }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  if (!draft) return <Page title="Confirma tu evento" subtitle="No encontramos la configuración del evento." onBack={onBack}/>;
  const due = draft.paymentMethod === "CAJA HOTEL" ? 0 : draft.payMode === "FULL" ? Number(draft.estimatedTotal || 0) : Number(draft.estimatedTotal || 0) / 2;
  async function submit() { setBusy(true); setError(""); try { const savedClient = JSON.parse(localStorage.getItem("pp_customer_client") || "null"); const result = await createPublicEvent({ ...(savedClient || {}), spaceId: Number(draft.spaceId), name: draft.name, type: draft.type, startsAt: draft.startsAt, endsAt: draft.endsAt, guests: Number(draft.guests), notes: draft.notes }); await onPaid(result); } catch (cause) { setError(cause.message || "No se pudo registrar el evento"); } finally { setBusy(false); } }
  return <Page title="Confirma tu evento" subtitle="Revisa el resumen y registra la reserva cuando estés listo." onBack={onBack}><JourneySteps current={3}/><section className="card"><small>EVENTO PRIVADO</small><h2>{draft.name}</h2><Row label="Fecha y horario" value={`${formatDate(draft.date)} · ${draft.start}–${draft.end}`}/><Row label="Invitados" value={`${draft.guests} personas`}/><Row label="Ambiente" value={draft.space?.name || "Ambiente seleccionado"}/><Row label="Montaje y temática" value={`${(draft.layouts || []).length} distribución(es) · ${draft.theme || "Por definir"}`}/><Row label="Banquete y bar" value={`${(draft.catering || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)} productos`}/><Row label="Cochera" value={`${(draft.vehicles || []).length} vehículo(s)`}/><Row label="Total estimado" value={`S/ ${Number(draft.estimatedTotal || 0).toFixed(2)}`}/><Row label="Forma de reserva" value="Adelanto obligatorio del 50%"/><Row total label={draft.paymentMethod === "CAJA HOTEL" ? "Pago en Recepción" : "Pagas ahora"} value={draft.paymentMethod === "CAJA HOTEL" ? "Pendiente" : `S/ ${due.toFixed(2)}`}/>{draft.paymentMethod === "CAJA HOTEL" ? <Info icon={Banknote} title="Validación en Recepción" text="La fecha se bloqueará cuando el personal valide el adelanto requerido."/> : null}</section>{error ? <p className="error">{error}</p> : null}<button className="sticky primary" disabled={busy} onClick={submit}>{busy ? "Registrando…" : draft.paymentMethod === "CAJA HOTEL" ? "Solicitar pago en Recepción" : `Confirmar evento · S/ ${due.toFixed(2)}`}</button></Page>;
}

function BalancePayment({ booking, event, onBack, onPaid }) {
  const [method, setMethod] = useState("YAPE"); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const record = booking || event;
  if (!record) return <Page title="Pago de saldo" subtitle="No encontramos la reserva seleccionada." onBack={onBack}/>;
  async function pay() { if (method === "CAJA HOTEL") { onBack(); return; } setBusy(true); setError(""); try { throw new Error(event ? "Pago online de eventos no disponible en esta versión." : "Pago online de saldo no disponible en esta versión."); } catch (cause) { setError(cause.message); } finally { setBusy(false); } }
  return <Page title={event ? "Completa el pago de tu evento" : "Completa tu reserva"} subtitle={`${record.code} · Elige cómo pagar el saldo pendiente.`} onBack={onBack}><section className="card balance-card"><div className="balance-amount"><small>SALDO PENDIENTE</small><strong>S/ {Number(record.balance || 0).toFixed(2)}</strong><span>Al completar el pago, tu pase quedará listo para validación de ingreso.</span></div><PaymentMethods value={method} onChange={setMethod}/>{method === "CAJA HOTEL" ? <Info icon={Banknote} title="Paga en Recepción" text="El personal validará el efectivo y recién después preparará tu acceso."/> : null}{error ? <p className="error">{error}</p> : null}<button className="primary wide" disabled={busy} onClick={pay}>{busy ? "Registrando…" : method === "CAJA HOTEL" ? "Mantener pago en Recepción" : `Pagar S/ ${Number(record.balance || 0).toFixed(2)}`}</button></section></Page>;
}

const paymentOptions = [{ id: "YAPE", label: "Yape", help: "Pago móvil", icon: Smartphone }, { id: "PLIN", label: "Plin", help: "Pago móvil", icon: Smartphone }, { id: "CAJA HOTEL", label: "Efectivo", help: "Solo en Recepción", icon: Banknote }];
function PaymentMethods({ value, onChange }) { return <div className="payment-methods">{paymentOptions.map(({ id, label, help, icon: Icon }) => <button type="button" className={value === id ? "selected" : ""} onClick={() => onChange(id)} key={id}><span className={`payment-logo ${id.toLowerCase().replace(" ", "-")}`}><Icon/></span><div><b>{label}</b><small>{help}</small></div><i>{value === id ? "✓" : ""}</i></button>)}</div>; }
function InvoiceSummary({ selection, cash, mode }) { const vehicles=selection.vehicles||[]; return <aside className="invoice-summary"><small>RESUMEN DE RESERVA</small><h2>{selection.service.name}</h2>{selection.room ? <p>{selection.room.type.name} {selection.room.number} · {selection.nights} noche(s)</p> : <p>{selection.planName} · {selection.people} persona(s)</p>}<Row label="Servicio base" value={`S/ ${Number(selection.base || 0).toFixed(2)}`}/><Row label={`Extras (${selection.extras?.length || 0})`} value={`S/ ${Number(selection.extrasTotal || 0).toFixed(2)}`}/><Row label={`Cochera (${vehicles.length} vehículo${vehicles.length === 1 ? "" : "s"})`} value={`S/ ${Number(selection.parkingTotal || 0).toFixed(2)}`}/><Row total label="Total" value={`S/ ${Number(selection.total || 0).toFixed(2)}`}/>{!cash && mode === "HALF" ? <Row label="Saldo por completar después" value={`S/ ${Number(selection.total / 2).toFixed(2)}`}/> : null}<p className="invoice-note">El botón inferior registra el pago. El acceso se habilita únicamente cuando el personal valida el ingreso.</p></aside>; }

function EventQuote({ catalog, onBack, onDone }) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ name: "Celebración", type: "CUMPLEAÑOS", spaceId: catalog.eventSpaces?.[0]?.id || 1, date: tomorrow, start: "18:00", end: "23:00", guests: 30, notes: "" }); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event) { event.preventDefault(); setBusy(true); setError(""); try { const result = await createEvent({ spaceId: Number(form.spaceId), name: form.name, type: form.type, guests: Number(form.guests), startsAt: `${form.date}T${form.start}:00`, notes: form.notes }); onDone(result); } catch (cause) { setError(cause.message); } finally { setBusy(false); } }
  return <Page title="Cuéntanos sobre tu evento" subtitle="Primero confirmamos disponibilidad y necesidades; después recibes el precio final." onBack={onBack}><JourneySteps current={1}/><form className="card form" onSubmit={submit}><Info icon={Sparkles} title="Cotización sin compromiso" text="No realizaremos ningún cobro en este paso. El equipo revisará aforo, montaje y alimentación."/><div className="two"><Field label="Nombre del evento" value={form.name} onChange={(name) => setForm({ ...form, name })}/><Field label="Tipo" type="select" value={form.type} onChange={(type) => setForm({ ...form, type })} options={["CUMPLEAÑOS", "MATRIMONIO", "EMPRESARIAL", "OTRO"]}/></div><div className="two"><Field label="Fecha" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })}/><Field label="Ambiente" type="select" value={form.spaceId} onChange={(spaceId) => setForm({ ...form, spaceId })} options={(catalog.eventSpaces || []).map((item) => ({ value: item.id, label: `${item.name} · hasta ${item.capacity}` }))}/></div><div className="two"><Field label="Hora de inicio" type="time" value={form.start} onChange={(start) => setForm({ ...form, start })}/><Field label="Hora de cierre" type="time" value={form.end} onChange={(end) => setForm({ ...form, end })}/></div><Field label="Número aproximado de invitados" type="number" value={form.guests} onChange={(guests) => setForm({ ...form, guests })}/><Field label="¿Qué necesitas? (montaje, comida, música...)" value={form.notes} onChange={(notes) => setForm({ ...form, notes })}/><PracticalInfo serviceCode="EVENTOS"/>{error ? <p className="error">{error}</p> : null}<button className="primary wide" disabled={busy}>{busy ? "Enviando…" : "Solicitar cotización"}</button></form></Page>;
}

function EventSuccess({ event, onReservations, onAdd }) {
  const cash = event?.status === "PENDIENTE_PAGO"; const paid = Number(event?.balance || 0) <= 0 && !cash;
  return <Page title="Solicitud de evento registrada" subtitle="Tu configuración quedó guardada en el sistema para cotización."><section className="success-card"><span className="success-icon"><Check/></span><small>{event?.code || "EVENTO PARK PLAZA"}</small><h2>{event?.name || "Tu evento"}</h2><p>El evento quedó en cotización. No se registró ni simuló ningún pago desde el portal.</p><div className="access-state pending"><Clock3/><div><b>En cotización</b><small>El equipo revisará disponibilidad, aforo y precio final.</small></div></div><button className="primary wide" onClick={onReservations}>Ver seguimiento</button><button className="link-button" onClick={onAdd}>Explorar otros servicios</button></section></Page>;
}

function PracticalInfo({ serviceCode }) {
  const data = serviceCode === "EVENTOS" ? ["Respuesta estimada: 30 minutos en horario de atención", "El aforo depende del ambiente seleccionado", "No se cobra hasta aprobar la propuesta"] : serviceCode === "PISCINA" ? ["Lleva ropa de baño y sandalias", "El QR valida exactamente el número de asistentes", "Llega 10 minutos antes de tu horario"] : serviceCode === "MIRADOR" ? ["Presenta el QR al llegar", "El acceso vale para la fecha y horario elegidos", "Menores deben ingresar con un adulto"] : ["Check-in desde las 3:00 p. m.", "Presenta documento y QR", "Cambios sujetos a disponibilidad"];
  return <div className="practical"><h3>Antes de continuar</h3>{data.map((item) => <p key={item}><Check/>{item}</p>)}</div>;
}

function MyReservations({ experience, onBack, onPay, onPayEvent, onAdd }) {
  const bookings = experience?.bookings || [];
  const events = experience?.events || [];
  const orders = experience?.orders || [];
  const clientName = clientFullName(experience?.client);
  const linkedOrderIds = new Set([...bookings.flatMap((item) => ordersForBooking(orders, item)), ...events.flatMap((item) => ordersForEvent(orders, item))].map((order) => order.id));
  const unlinkedOrders = orders.filter((order) => !linkedOrderIds.has(order.id));
  return <Page title="Mis reservas" subtitle="Fechas, pagos y próximos pasos, sin términos complicados." onBack={onBack}>{clientName ? <section className="reservation-client-card"><small>Titular registrado</small><b>{clientName}</b><span>{experience?.client?.documentNumber ? `DNI ${experience.client.documentNumber}` : "Documento no registrado"}</span></section> : null}<StatusLegend/>{!bookings.length && !events.length ? <div className="empty-friendly"><CalendarDays/><h2>Aún no tienes reservas</h2><p>Elige hospedaje, piscina, mirador o diseña un evento.</p><button className="primary" onClick={onAdd}>Explorar experiencias</button></div> : null}<div className="reservation-list">{bookings.map((item, index) => <BookingCard item={item} client={experience?.client} orders={[...ordersForBooking(orders, item), ...(index === 0 ? unlinkedOrders : [])]} onPay={onPay} key={`booking-${item.id}`}/>)}{events.map((item, index) => <EventCard item={item} client={experience?.client} orders={[...ordersForEvent(orders, item), ...(!bookings.length && index === 0 ? unlinkedOrders : [])]} key={`event-${item.id}`}/>)}</div></Page>;
}

function BookingCard({ item, client, orders, onPay }) {
  const pending = Number(item.balance) > 0;
  const checkedIn = item.status === "CHECKED_IN" || item.accessStatus === "INGRESO_VALIDADO";
  return <article><div className="reservation-top"><div><small>{item.code}</small><h2>{serviceName(item.serviceCode).replace("tu ", "")}</h2></div><FriendlyStatus value={pending ? "PENDIENTE_PAGO" : checkedIn ? "ACTIVO" : "LISTO_INGRESO"}/></div><div className="reservation-facts"><span><CalendarDays/>{formatDate(item.date)}</span><span><Clock3/>{item.slot}</span><span><Users/>{item.people} persona(s)</span></div><ReservationDetailBlock booking={item} client={client}/><OrderSummary orders={orders}/><Row label="Total" value={`S/ ${Number(item.total || 0).toFixed(2)}`}/><Row label="Pagado" value={`S/ ${Number(item.paid || 0).toFixed(2)}`}/>{pending ? <><Row label="Saldo pendiente" value={`S/ ${Number(item.balance || 0).toFixed(2)}`}/><div className="next-action"><b>Siguiente paso: completar pago</b><p>La fecha y los cupos están reservados. El QR continuará pendiente hasta completar el saldo.</p><button className="gold" onClick={() => onPay(item)}>Elegir método y pagar</button></div></> : checkedIn ? <div className="next-action ready"><b>Ingreso validado</b><p>Tu experiencia está habilitada y ya puedes utilizar sus servicios y consumos.</p></div> : <div className="next-action ready"><b>Pago completo · listo para ingreso</b><p>Presenta tu documento y QR. Recepción o el control de acceso debe validar tu entrada.</p></div>}</article>;
}

function EventCard({ item, client, orders }) {
  return <article><div className="reservation-top"><div><small>{item.code || `EVT-${item.id}`}</small><h2>{item.name}</h2></div><FriendlyStatus value={item.status}/></div><div className="reservation-facts"><span><CalendarDays/>{formatDate(item.startsAt)}</span><span><Users/>{item.guests} invitados</span></div><div className="reservation-detail-grid"><DetailItem label="Titular" value={clientFullName(client)}/><DetailItem label="Tipo" value={item.type}/><DetailItem label="Ambiente" value={item.space?.name}/><DetailItem label="Solicitado" value={item.notes}/></div><OrderSummary orders={orders}/><Row label="Estado" value={item.status === "COTIZACION" ? "Cotización solicitada" : item.status}/><Row label="Precio final" value={Number(item.price || 0) > 0 ? `S/ ${Number(item.price).toFixed(2)}` : "Por definir"}/><div className="next-action"><b>{item.status === "COTIZACION" ? "Solicitud registrada" : "Seguimiento de evento"}</b><p>{item.status === "COTIZACION" ? "El equipo revisará disponibilidad, aforo y precio. No hay pago confirmado desde el portal." : "Consulta con Recepción para completar los siguientes pasos."}</p></div></article>;
}

function ReservationDetailBlock({ booking, client }) {
  const extras = (booking.extras || []).filter((item) => Number(item.quantity || 0) > 0).map((item) => `${item.name}${Number(item.quantity || 0) > 1 ? ` x${item.quantity}` : ""}`);
  const roomLabel = booking.serviceCode === "HOSPEDAJE" ? `Hab. ${booking.room?.number || booking.roomId || "asignada"}` : serviceName(booking.serviceCode).replace("tu ", "");
  return <div className="reservation-detail-grid"><DetailItem label="Titular" value={clientFullName(client)}/><DetailItem label="Habitación / servicio" value={roomLabel}/><DetailItem label="Tipo o plan" value={booking.room?.type?.name || booking.plan?.name || booking.planName}/><DetailItem label="Estadía" value={booking.checkOutDate ? `${formatDate(booking.date)} al ${formatDate(booking.checkOutDate)}` : `${formatDate(booking.date)} · ${booking.slot}`}/><DetailItem label="Adultos / niños" value={`${Number(booking.adults || 0)} adulto(s) · ${Number(booking.children || 0)} niño(s)`}/><DetailItem label="Extras" value={extras.length ? extras.join(", ") : "Sin extras solicitados"}/><DetailItem label="Solicitudes" value={booking.notes || "Sin solicitudes adicionales"}/></div>;
}

function DetailItem({ label, value }) {
  return <div className="reservation-detail-item"><small>{label}</small><b>{value || "No registrado"}</b></div>;
}

function OrderSummary({ orders }) {
  if (!orders?.length) return <div className="reservation-orders empty"><ShoppingBag/><span><b>Comida y pedidos</b><small>Sin pedidos solicitados todavía.</small></span></div>;
  return <div className="reservation-orders"><div className="reservation-orders-title"><ShoppingBag/><span><b>Comida y pedidos</b><small>{orders.length} pedido(s) registrados</small></span></div>{orders.slice(0, 3).map((order) => <div className="reservation-order-line" key={order.id}><span><b>{order.code}</b><small>{order.area === "BARTENDER" ? "Bar" : "Restaurante"} · {order.items?.map((item) => `${item.quantity} ${item.name}`).join(", ") || "Sin detalle"}</small></span><strong>S/ {Number(order.total || 0).toFixed(2)}</strong></div>)}</div>;
}

function clientFullName(client) {
  return [client?.firstName, client?.lastName].filter(Boolean).join(" ").trim();
}

function ordersForBooking(orders, booking) {
  const roomId = booking?.room?.id || booking?.roomId;
  const roomNumber = booking?.room?.number;
  return (orders || []).filter((order) => {
    const orderRoomId = order?.room?.id || order?.roomId || order?.stay?.roomId || order?.stay?.room?.id;
    if (roomId && orderRoomId) return Number(orderRoomId) === Number(roomId);
    const text = normalizedText(`${order?.notes || ""} ${order?.destinationLabel || ""} ${order?.room?.number || ""} ${order?.stay?.room?.number || ""}`);
    return Boolean((roomNumber && text.includes(normalizedText(roomNumber))) || (booking?.code && text.includes(normalizedText(booking.code))));
  });
}

function ordersForEvent(orders, event) {
  return (orders || []).filter((order) => normalizedText(`${order?.notes || ""} ${order?.destinationLabel || ""}`).includes(normalizedText(event?.code || `EVT-${event?.id}`)) || normalizedText(`${order?.notes || ""} ${order?.destinationLabel || ""}`).includes(normalizedText(event?.name)));
}

function FriendlyStatus({ value }) { const labels = { PENDIENTE_PAGO: "Pago pendiente", LISTO_INGRESO: "Listo para ingreso", CONFIRMADA: "Confirmada", COTIZACION: "En cotización", ACTIVO: "Acceso activo", FINALIZADA: "Finalizada", CANCELADA: "Cancelada" }; return <span className={`friendly-status ${String(value || "").toLowerCase()}`}>{labels[value] || String(value || "").replaceAll("_", " ")}</span>; }
function StatusLegend() { return <div className="status-legend"><b>¿Qué significa cada estado?</b><span><i className="green"/>Confirmada: lista para usar</span><span><i className="gold-dot"/>Pendiente: falta una acción</span><span><i className="gray"/>Finalizada: ya terminó</span></div>; }
function formatDate(value) { if (!value) return "Fecha por confirmar"; return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }); }

function PaymentSuccess({ result, selection, onExperience, onAdd }) {
  const isLodging = selection?.service?.code === "HOSPEDAJE";
  const status = result?.booking?.status;
  const isPending = isLodging ? status === "PENDIENTE" : result?.booking?.balance > 0;
  
  let title = "¡Pago confirmado!";
  let subtitle = "Tu operación se registró correctamente.";
  let message = "Tu servicio está pagado y fue agregado a tu pase único.";
  let qrTitle = "QR listo para ingreso";
  let qrDesc = "Recepción o el control del servicio validará tu entrada antes de habilitar los consumos.";

  if (isLodging) {
    title = isPending ? "Reserva registrada correctamente" : "¡Reserva asegurada!";
    subtitle = isPending ? "Tu reserva quedó pendiente de confirmación/pago." : "Tu operación se registró correctamente.";
    message = isPending 
      ? `El total de tu reserva es S/ ${result?.booking?.totalPrice}. Por favor completa el pago en recepción.` 
      : `Reserva pagada (S/ ${result?.booking?.paid}).`;
    qrTitle = isPending ? "Pago pendiente en Recepción" : "Reserva lista";
    qrDesc = isPending ? "Acércate a recepción para validar tu reserva." : "Presenta tu código en recepción.";
  } else if (isPending) {
    title = "¡Reserva asegurada!";
    message = `Pagaste S/ ${result.booking.paid}. Mantienes un saldo de S/ ${result.booking.balance}.`;
    qrTitle = "QR pendiente de pago";
    qrDesc = "La fecha, horario y cupos están reservados. Completa el saldo antes de ingresar.";
  }

  return <Page title={title} subtitle={subtitle}><section className="success-card"><span className="success-icon"><Check/></span><small>{result?.booking?.code || "RESERVA PARK PLAZA"}</small><h2>{selection?.service?.name}</h2><p>{message}</p><div className={`access-state ${isPending ? "pending" : "ready"}`}><QrCode/><div><b>{qrTitle}</b><small>{qrDesc}</small></div></div><button className="primary wide" onClick={onExperience}>{isPending ? "Ver reserva y completar después" : "Ver mi pase y próximo paso"}</button><button className="link-button" onClick={onAdd}>Agregar otra experiencia</button></section></Page>;
}

function Experience({ experience, onBack, onPay, onOrders, onRequest, onAdd }) {
  const [connected, setConnected] = useState(realtime.connected);
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [expressCheckoutOpen, setExpressCheckoutOpen] = useState(false);
  useEffect(() => { const on = () => setConnected(true); const off = () => setConnected(false); realtime.on("connect", on); realtime.on("disconnect", off); return () => { realtime.off("connect", on); realtime.off("disconnect", off); }; }, []);
  const passes = experience?.passes || (experience?.pass ? [experience.pass] : []);
  const bookings = experience?.bookings || [];
  const events = experience?.events || [];
  const orders = experience?.orders || [];
  const clientName = clientFullName(experience?.client);
  const linkedOrderIds = new Set([...bookings.flatMap((item) => ordersForBooking(orders, item)), ...events.flatMap((item) => ordersForEvent(orders, item))].map((order) => order.id));
  const unlinkedOrders = orders.filter((order) => !linkedOrderIds.has(order.id));
  if (!passes.length) {
    return <Page title="Mi experiencia" subtitle={bookings.length || events.length ? "Reservas y planes registrados en tu cuenta." : "Aún no tienes reservas."} onBack={onBack}>
      {clientName ? <section className="reservation-client-card"><small>Titular registrado</small><b>{clientName}</b><span>{experience?.client?.documentNumber ? `DNI ${experience.client.documentNumber}` : "Documento no registrado"}</span></section> : null}
      <StatusLegend/>
      {!bookings.length && !events.length ? <div className="empty-friendly"><CalendarDays/><h2>Aún no tienes reservas</h2><p>Elige hospedaje, piscina, mirador o diseña un evento.</p><button className="primary" onClick={onAdd}>Explorar experiencias</button></div> : null}
      <div className="reservation-list">
        {bookings.map((item, index) => <BookingCard item={item} client={experience?.client} orders={[...ordersForBooking(orders, item), ...(index === 0 ? unlinkedOrders : [])]} onPay={onPay} key={`experience-booking-${item.id}`}/>)}
        {events.map((item, index) => <EventCard item={item} client={experience?.client} orders={[...ordersForEvent(orders, item), ...(!bookings.length && index === 0 ? unlinkedOrders : [])]} key={`experience-event-${item.id}`}/>)}
      </div>
      <div className="actions-grid"><button onClick={onAdd}><Plus/>Agregar servicio</button><button disabled={!canPlaceOrders(experience)} onClick={onOrders}><ShoppingBag/>{canPlaceOrders(experience) ? "Hacer pedido" : "Pedidos al validar ingreso"}</button><button onClick={onRequest}><ConciergeBell/>Solicitar ayuda</button></div>
    </Page>;
  }
  const ordersEnabled = canPlaceOrders(experience);
  const activeStay = bookings.find((item) => item.serviceCode === "HOSPEDAJE" && item.status === "CHECKED_IN" && item.stay?.status === "ACTIVA");
  const waitingCheckIn = bookings.find((item) => item.serviceCode === "HOSPEDAJE" && item.paymentStatus === "PAGADO" && item.status === "CONFIRMADA" && !item.stay);
  const entitlements = passes.flatMap((pass) => pass.entitlements || []);
  const activeAccesses = entitlements.filter((item) => ["ACTIVO", "UTILIZADO"].includes(item.status));
  const customerRequests = experience.requests || [];
  const activeRequests = customerRequests.filter((item) => !["ATENDIDO", "RESUELTO", "CANCELADO"].includes(item.status));
  const passVisual = entitlements.some((item) => item.status === "ACTIVO") ? { label: "ACCESO ACTIVO", tone: "active", help: "Tu ingreso fue validado. Ya puedes usar los beneficios y consumos de este servicio." } : entitlements.some((item) => item.status === "UTILIZADO") ? { label: "INGRESO VALIDADO", tone: "active", help: "Tu entrada fue validada y los consumos de esta experiencia están disponibles." } : entitlements.some((item) => item.status === "LISTO_INGRESO") ? { label: "LISTO PARA INGRESO", tone: "ready", help: "El pago está completo. Presenta este QR para validar tu entrada." } : entitlements.some((item) => item.status === "PENDIENTE") ? { label: "PAGO PENDIENTE", tone: "pending", help: "Tu QR existe, pero falta completar un saldo." } : { label: "SIN ACCESOS VIGENTES", tone: "used", help: "Agrega una experiencia para volver a utilizar este mismo QR." };
  const groups = Object.values((experience.orders || []).reduce((acc, order) => { const key = order.groupCode || order.code; acc[key] ||= { key, groupCode: order.groupCode, orders: [] }; acc[key].orders.push(order); return acc; }, {})).sort((a, b) => String(b.orders[0]?.createdAt).localeCompare(String(a.orders[0]?.createdAt)));
  
  async function doCheckout(method, code) {
    try {
      setCheckoutNotice("Check-out Express estará disponible próximamente. No se registró ninguna salida automática.");
      setExpressCheckoutOpen(false);
    } catch (e) {
      setCheckoutNotice("Error al realizar Check-out: " + (e.message || "Contacte recepción"));
    }
  }

  return <Page title="Mi experiencia" subtitle="Accesos y pedidos son procesos distintos. Aquí puedes seguir ambos sin confusiones." onBack={onBack}>
    {checkoutNotice ? <div className="toast">{checkoutNotice}</div> : null}
    <div className={`realtime-strip ${connected ? "online" : "reconnecting"}`}><i/><div><b>{connected ? "Actualización en vivo activa" : "Actualización por refresco disponible"}</b><small>{connected ? "Los cambios de cocina y bar aparecerán aquí sin recargar." : "Puedes volver a entrar a esta sección para consultar cambios recientes."}</small></div></div>{passes.map((pass) => <section className="digital-pass" key={pass.id}><div className="pass-head"><img src="/brand/park-plaza-mark.svg" alt="Park Plaza"/><div><small>{pass.kind === "MASTER" ? "PASE MAESTRO · PAQUETE" : `PASE DE ${serviceName(pass.serviceCode || pass.entitlements?.[0]?.serviceCode || "SERVICIO").toUpperCase()}`}</small><h2>{experience.client.firstName} {experience.client.lastName}</h2><p>{pass.code}</p></div><span className={passVisual.tone}>{passVisual.label}</span></div>{pass.virtual ? <div className="empty-order"><QrCode/><p>Tu estadía activa fue validada con JWT. El QR público queda pendiente para una versión posterior.</p></div> : <><img className="qr" src={`${apiBaseUrl}/public/pass/${pass.code}/qr`} alt={`Código QR del pase ${pass.code}`}/><a className="pass-download" href={`${apiBaseUrl}/public/pass/${pass.code}/qr`} download={`Park-Plaza-${pass.code}.png`}><Download/> Descargar mi QR</a></>}<p className="center">{pass.kind === "MASTER" ? "Este pase reúne exclusivamente los servicios de tu paquete promocional." : "Este acceso corresponde únicamente al servicio indicado y se valida al ingresar."}</p></section>)}
    
    {waitingCheckIn ? <section className="customer-journey-state waiting"><div className="journey-state-head"><span><Clock3/></span><div><small>SIGUIENTE PASO</small><h3>Tu pago está completo · falta validar tu llegada</h3><p>Presenta el pase en Recepción. Después del check-in se habilitarán Restaurante, Bartender y el check-out.</p></div></div><div className="journey-state-steps"><span className="done"><CheckCircle2/>Reserva</span><span className="done"><CheckCircle2/>Pago</span><span className="current"><Clock3/>Check-in</span><span><ShoppingBag/>Pedidos</span></div><p className="journey-state-code">{waitingCheckIn.code} · Habitación {waitingCheckIn.room?.number || "asignada"}</p></section> : null}
    {activeAccesses.length ? <section className="customer-journey-state active"><div className="journey-state-head"><span><CheckCircle2/></span><div><small>ACCESO ACTIVO</small><h3>{activeStay ? "Check-in validado · servicios habilitados" : `${serviceName(activeAccesses[0].serviceCode)} validado · experiencia habilitada`}</h3><p>Ya puedes realizar pedidos y solicitar asistencia desde esta misma aplicación.</p></div></div><div className="journey-state-steps"><span className="done"><CheckCircle2/>Reserva</span><span className="done"><CheckCircle2/>Pago</span><span className="done"><CheckCircle2/>Ingreso</span><span className="current"><ShoppingBag/>Pedidos</span></div></section> : null}

    {activeStay ? (
      <section className="checkout-express-banner">
        <div className="flex-row">
          <div>
            <h3>Check-out Express</h3>
            <p>Sal del hotel sin pasar por recepción. Cobraremos consumos extra de tu saldo.</p>
          </div>
          <button className="primary compact" onClick={() => setExpressCheckoutOpen(true)}>Hacer check-out</button>
        </div>
        {expressCheckoutOpen && <ExpressCheckoutPanel onCancel={() => setExpressCheckoutOpen(false)} onConfirm={doCheckout} />}
      </section>
    ) : null}

    <section className="experience-section"><div className="section-title"><div><small>MIS PLANES Y RESERVAS</small><h2>Reservas registradas en tu cuenta</h2></div><span>{bookings.length + events.length} registro(s)</span></div><div className="reservation-list compact">{bookings.map((item, index) => <BookingCard item={item} client={experience?.client} orders={[...ordersForBooking(orders, item), ...(index === 0 ? unlinkedOrders : [])]} onPay={onPay} key={`experience-pass-booking-${item.id}`}/>)}{events.map((item, index) => <EventCard item={item} client={experience?.client} orders={[...ordersForEvent(orders, item), ...(!bookings.length && index === 0 ? unlinkedOrders : [])]} key={`experience-pass-event-${item.id}`}/>)}</div></section><section className="experience-section"><div className="section-title"><div><small>CONTROL DE INGRESO</small><h2>Servicios incluidos en tu QR</h2></div><span>{entitlements.reduce((sum, item) => sum + Number(item.people || 0), 0)} accesos reservados</span></div><div className="entitlements">{entitlements.map((item) => <article key={item.id}><span className={`status ${item.status.toLowerCase()}`}>{accessLabel(item.status)}</span><h3>{item.serviceCode}</h3><p>{item.date} · {item.slot}</p><b>{peopleLabel(item.people)}</b>{item.usedAt ? <small>Ingreso validado: {new Date(item.usedAt).toLocaleString("es-PE")}</small> : null}</article>)}</div></section>{bookings.filter((item) => item.balance > 0).map((item) => <div className="payment-alert" key={item.id}><div><b>Completa {serviceName(item.serviceCode)}</b><p>Saldo pendiente S/ {item.balance}. El pago dejará el QR listo para validar tu ingreso.</p></div><button className="gold" onClick={() => onPay(item)}>Elegir método y pagar</button></div>)}<div className="actions-grid"><button onClick={onAdd}><Plus/>Agregar servicio</button><button disabled={!ordersEnabled} onClick={onOrders}><ShoppingBag/>{ordersEnabled ? "Hacer pedido" : "Pedidos al validar ingreso"}</button><button onClick={onRequest}><ConciergeBell/>Solicitar ayuda</button></div><section className="experience-section orders-section"><div className="section-title"><div><small>CONSUMOS</small><h2>Seguimiento de pedidos</h2></div><span>{groups.length} compra(s)</span></div>{groups.length ? groups.map((group) => <OrderGroup group={group} key={group.key}/>) : <div className="empty-order"><ShoppingBag/><p>Aún no hiciste pedidos. Cuando confirmes y pagues uno, verás aquí su avance en tiempo real.</p></div>}</section>

{customerRequests.length > 0 && <section className="experience-section requests-section"><div className="section-title"><div><small>ASISTENCIA</small><h2>Mis solicitudes</h2></div><span>{activeRequests.length ? `${activeRequests.length} en curso` : "Todas atendidas"}</span></div>{customerRequests.map((req) => <RequestGroup req={req} key={req.id}/>)}</section>}

</Page>;
}

function ExpressCheckoutPanel({ onCancel, onConfirm }) {
  const [method, setMethod] = useState("EFECTIVO");
  const [code, setCode] = useState("");
  const methods = [
    { id: "YAPE", label: "Yape" },
    { id: "PLIN", label: "Plin" },
    { id: "EFECTIVO", label: "Dejar en Caja" }
  ];

  return <div className="card mt-4 p-4 border border-park-gold">
    <h3 className="text-park-gold-deep font-bold mb-2">Método de pago (Consumos Extra)</h3>
    <div className="flex flex-wrap gap-2 mb-4">
      {methods.map(m => (
        <button key={m.id} className={`px-3 py-1 rounded border ${method === m.id ? 'bg-park-gold text-white font-bold' : 'bg-gray-100 text-gray-700'}`} onClick={() => setMethod(m.id)}>{m.label}</button>
      ))}
    </div>
    {method !== "EFECTIVO" ? (
      <Field label={`Código de operación / celular (${method})`} value={code} onChange={setCode} />
    ) : (
      <p className="text-xs text-gray-600 mb-3">Si tienes consumos, por favor deja el efectivo exacto en la habitación o pasa un momento por caja antes de salir.</p>
    )}
    <div className="flex gap-2">
      <button className="flex-1 bg-gray-200 text-gray-800 font-bold py-2 rounded" onClick={onCancel}>Cancelar</button>
      <button className="flex-1 bg-park-gold text-white font-bold py-2 rounded" disabled={method !== 'EFECTIVO' && !code} onClick={() => onConfirm(method, code)}>Confirmar Salida</button>
    </div>
  </div>;
}

function OrderGroup({ group }) {
  const delivered = group.orders.every((item) => item.status === "ENTREGADO");
  const total = group.orders.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const [rated, setRated] = useState(false);

  async function rate(stars) {
    setRated(true);
    try { setRated(true); } catch(e){}
  }

  return <article className={`order-card ${delivered ? "delivered" : ""}`}>
    <div className="order-card-head"><div><small>{group.groupCode ? "PEDIDO COMBINADO" : "PEDIDO"}</small><h3>{group.groupCode || group.orders[0]?.code}</h3><p>{group.orders.map((item) => item.area === "BARTENDER" ? "Bar" : "Restaurante").join(" + ")} · S/ {total.toFixed(2)}</p></div><span className="font-bold text-xs">{delivered ? "Entregado" : "En curso"}</span></div>
    {group.orders.map((order) => <ProgressTracker type="order" order={order} key={order.id} />)}
    
    {delivered && !rated && (
      <div className="feedback-prompt"><small>¿Qué tal estuvo tu pedido?</small><div className="stars">{[1,2,3,4,5].map(s => <button key={s} onClick={() => rate(s)}>★</button>)}</div></div>
    )}
    {rated && <div className="feedback-thanks"><small>¡Gracias por tu calificación!</small></div>}
  </article>;
}

function RequestGroup({ req }) {
  const delivered = ["ATENDIDO", "RESUELTO"].includes(req.status);
  return <article className={`order-card ${delivered ? "delivered" : ""}`}>
    <div className="order-card-head"><div><small>SOLICITUD</small><h3>{req.code}</h3><p>{req.type}</p></div><span className="font-bold text-xs">{delivered ? "Atendido" : "En curso"}</span></div>
    <ProgressTracker type="request" order={req} />
  </article>;
}

function ProgressTracker({ type, order }) {
  const isOrder = type === "order";
  const steps = isOrder ? ["Recibido", "En preparación", "Listo", "Entregado"] : ["Recibido", "Asignado", "Atendido"];
  
  let current = 0;
  if (isOrder) {
    if (["EN_COCINA", "PREPARANDO", "EN_PREPARACION"].includes(order.status)) current = 1;
    if (order.status === "LISTO") current = 2;
    if (order.status === "ENTREGADO") current = 3;
    if (order.status === "CANCELADO") current = 0;
  } else {
    if (order.status === "EN_CURSO") current = 1;
    if (["ATENDIDO", "RESUELTO"].includes(order.status)) current = 2;
    if (order.status === "CANCELADO") current = 0;
  }

  const iconsList = isOrder ? [ClipboardList, ChefHat, Bike, CheckCircle2] : [ClipboardList, Users, CheckCircle2];

  return <div style={{marginBottom: 16}}>
    {isOrder && <div className="mb-2"><b>{order.area === "BARTENDER" ? "Bar - " : "Restaurante - "}{order.code}</b><br/><small className="text-gray-400">{order.items?.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</small></div>}
    {!isOrder && <div className="mb-2"><b>{order.description || "Asistencia solicitada"}</b></div>}
    
    <div className="tracker">
      {steps.map((label, i) => {
        const done = i <= current;
        const active = i === current;
        const Icon = iconsList[i];
        return <div key={label} className={`track-step ${done ? "done" : ""} ${active && !isOrder && i!==2 ? "active" : ""} ${active && isOrder && i!==3 ? "active" : ""}`}>
          <i><Icon size={14} /></i>
          <small>{label}</small>
        </div>;
      })}
    </div>
    {isOrder && order.status !== "ENTREGADO" && order.status !== "CANCELADO" && <p className="text-xs text-center mt-4 text-park-gold">Tiempo estimado: {order.estimatedMinutes} min</p>}
  </div>;
}

function Directory({ onBack }) {
  return (
    <Page title="Directorio y Servicios" subtitle="Todo lo que necesitas saber durante tu estadía en Park Plaza." onBack={onBack}>
      <div className="card">
        <h2><Wifi className="inline mr-2" size={20}/> Conexión Wi-Fi</h2>
        <div className="flex justify-between items-center mt-3 p-3 bg-[var(--card-glass)] border border-[rgba(255,255,255,0.1)] rounded-lg">
          <div><small className="text-gray-400 block mb-1">Red</small><p className="font-bold">ParkPlaza_Guest</p></div>
          <div><small className="text-gray-400 block mb-1">Contraseña</small><p className="font-bold text-park-gold">Plaza2026</p></div>
        </div>
      </div>
      <div className="card">
        <h2><Utensils className="inline mr-2" size={20}/> Horarios de Restaurante</h2>
        <Row label="Desayuno Buffet" value="06:30 - 10:00" />
        <Row label="Almuerzo" value="12:30 - 15:30" />
        <Row label="Cena / Bar" value="18:30 - 23:00" />
      </div>
      <div className="card">
        <h2><BookOpen className="inline mr-2" size={20}/> Información Útil</h2>
        <Row label="Check-out" value="12:00 m." />
        <Row label="Piscina" value="08:00 - 20:00" />
        <Row label="Recepción" value="24 horas" />
        <p className="mt-4 text-xs text-gray-400">Por favor, recuerda que el uso de la piscina requiere reserva previa desde la app para controlar el aforo y garantizar tu comodidad.</p>
      </div>
    </Page>
  );
}

function accessLabel(status) { return ({ ACTIVO: "ACCESO ACTIVO", LISTO_INGRESO: "LISTO PARA VALIDAR", PENDIENTE: "PAGO PENDIENTE", UTILIZADO: "INGRESO VALIDADO", FINALIZADO: "FINALIZADO", REVOCADO: "DESHABILITADO" })[status] || status; }
function peopleLabel(value) { const count = Number(value || 1); return count === 1 ? "Acceso para 1 persona" : `Acceso para ${count} personas`; }
function orderStatusLabel(status) { return ({ PENDIENTE: "Pedido recibido", EN_COCINA: "En preparación", PREPARANDO: "En preparación", LISTO: "En camino", ENTREGADO: "Entregado", CANCELADO: "Cancelado" })[status] || status; }
function orderSteps() { return ["Recibido", "En preparación", "En camino", "Entregado"]; }
function orderStepIndex(order) { const flow = ["PENDIENTE", "PREPARANDO", "LISTO", "ENTREGADO"]; return order.status === "EN_COCINA" ? 1 : Math.max(0, flow.indexOf(order.status)); }

function serviceName(code) { return ({ HOSPEDAJE: "tu hospedaje", PISCINA: "tu reserva de piscina", MIRADOR: "tu reserva de mirador", EVENTOS: "tu evento" })[code] || "tu servicio"; }
function normalizedText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}
function menuPresentationFor(item) {
  const text = normalizedText(`${item?.code || ""} ${item?.name || ""} ${item?.category || ""}`);
  const hint = menuPresentationHints.find((entry) => entry.keys.some((key) => text.includes(key)));
  if (!hint) return { ...item, category: item?.area === "BARTENDER" ? "Bebidas - Bar" : "Platos - Cocina", image: menuImageFor(item), tags: item?.tags || [] };
  return {
    ...item,
    originalName: item.name,
    name: hint.name,
    category: hint.category,
    description: hint.description,
    image: hint.image,
    tags: hint.tags
  };
}
function menuImageFor(item) {
  if (item?.image) return item.image;
  const code = String(item?.code || "").toUpperCase();
  if (menuImages[code]) return menuImages[code];
  const text = normalizedText(`${item?.name || ""} ${item?.category || ""}`);
  return productImageHints.find(([keys]) => keys.some((key) => text.includes(key)))?.[1] || fallbackMenuImage;
}
function menuAvailableFor(item, serviceCode) {
  const availability = Array.isArray(item?.availableFor) ? item.availableFor : String(item?.availableFor || "").split(/[\s,|]+/);
  return availability.map((value) => String(value).toUpperCase()).includes(String(serviceCode || "").toUpperCase());
}
function destinationLabel(serviceCode, booking) {
  if (serviceCode === "HOSPEDAJE") return `Habitación ${booking?.room?.number || booking?.roomId || "asignada"}`;
  if (serviceCode === "PISCINA") return `Piscina · ${booking?.slot || "horario validado"}`;
  if (serviceCode === "MIRADOR") return `Mirador · ${booking?.slot || "horario validado"}`;
  return serviceName(serviceCode);
}
function reservationAllowsOrders(item) {
  return Boolean(item?.serviceCode) && !["CANCELADA", "FINALIZADA", "COMPLETADA", "NO_SHOW"].includes(item.status);
}
function eventAllowsOrders(item) {
  return Boolean(item?.id) && !["CANCELADO", "FINALIZADO"].includes(item.status);
}
function orderDestinations(experience) {
  const bookings = experience?.bookings || [];
  const destinations = [];
  const add = (booking, serviceCode) => {
    if (!reservationAllowsOrders({ ...booking, serviceCode })) return;
    const value = `booking:${booking.id}:${serviceCode}`;
    if (!destinations.some((item) => item.value === value)) destinations.push({ value, label: destinationLabel(serviceCode, booking) });
  };
  bookings.filter(reservationAllowsOrders).forEach((booking) => add(booking, booking.serviceCode));
  (experience?.events || []).filter(eventAllowsOrders).forEach((item) => destinations.push({ value: `event:${item.id}:EVENTOS`, label: `Evento · ${item.name}` }));
  return destinations;
}
function activePassEntitlements(experience) { return (experience?.passes || (experience?.pass ? [experience.pass] : [])).flatMap((pass) => pass.entitlements || []).filter((item) => ["ACTIVO", "UTILIZADO"].includes(item.status)); }
function canPlaceOrders(experience) { return Boolean(experience?.bookings?.some(reservationAllowsOrders) || experience?.events?.some(eventAllowsOrders)); }

function Orders({ catalog, experience, onBack, onPlaced }) {
  const destinations = useMemo(() => orderDestinations(experience), [experience]);
  const [area, setArea] = useState("TODOS"); const [category, setCategory] = useState("TODAS"); const [query, setQuery] = useState(""); const [cart, setCart] = useState({}); const [busy, setBusy] = useState(false); const [notes, setNotes] = useState(""); const [destination, setDestination] = useState(""); const [paymentMethod, setPaymentMethod] = useState("YAPE"); const [error, setError] = useState("");
  useEffect(() => { if (!destinations.some((item) => item.value === destination)) setDestination(destinations[0]?.value || ""); }, [destinations, destination]);
  const [destinationKind, destinationId, destinationService] = destination.split(":"); const activeService = destinationKind === "booking" ? destinationService : destinationKind === "event" ? "EVENTOS" : null;
  const baseItems = (catalog.menu || []).filter((item) => (area === "TODOS" || item.area === area) && (!activeService || menuAvailableFor(item, activeService)));
  const categories = ["TODAS", ...Array.from(new Set(baseItems.map((item) => item.category).filter(Boolean)))];
  useEffect(() => { if (!categories.includes(category)) setCategory("TODAS"); }, [category, categories.join("|")]);
  const items = baseItems.filter((item) => {
    const matchesCategory = category === "TODAS" || item.category === category;
    const text = normalizedText(`${item.name} ${item.category} ${item.description} ${(item.tags || []).join(" ")}`);
    return matchesCategory && (!query.trim() || text.includes(normalizedText(query)));
  });
  const selected = (catalog.menu || []).filter((item) => cart[item.id]);
  const total = selected.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  async function place() { setBusy(true); setError(""); try { const selectedAreas = [...new Set(selected.map((item) => item.area))]; if (selectedAreas.length !== 1) throw new Error("Envía pedidos de Restaurante y Bar por separado."); const destinationInfo = destinations.find((item) => item.value === destination); const payload = { area: selectedAreas[0], notes, destinationKind, destinationId: Number(destinationId) || null, serviceCode: activeService, destinationLabel: destinationInfo?.label || "", items: selected.map((item) => ({ productId: item.id, quantity: cart[item.id] })) }; if (destinationKind === "booking" && activeService === "HOSPEDAJE") payload.reservationId = Number(destinationId); if (destinationKind === "booking" && activeService !== "HOSPEDAJE") payload.serviceReservationId = Number(destinationId); if (destinationKind === "event") payload.eventId = Number(destinationId); await createOrder(payload); onPlaced(); } catch (cause) { setError(cause.message); } finally { setBusy(false); } }
  return <Page title="Carta Park Plaza" subtitle="Elige dónde recibirás el pedido. Cocina o bar lo reciben únicamente después de confirmar tu pago." onBack={onBack}><section className="card"><Field label="Servicio y punto de entrega" type="select" value={destination} options={destinations.length ? destinations : [{ value: "", label: "Aún no tienes una reserva registrada" }]} onChange={(value) => { setDestination(value); setCart({}); }}/><small className="center">Solo aparecen servicios con reserva registrada a tu nombre.</small></section>{!destinations.length ? <div className="empty-friendly"><ShoppingBag/><h2>Aún no puedes pedir</h2><p>Primero registra una reserva o cotización a tu nombre. Esta vista se actualizará automáticamente.</p><button className="primary" onClick={onBack}>Volver a mi experiencia</button></div> : <><div className="segments menu-segments">{[["TODOS", "Toda la carta"], ["RESTAURANTE", "Restaurante"], ["BARTENDER", "Bar"]].map(([value, label]) => <button key={value} className={area === value ? "active" : ""} onClick={() => { setArea(value); setCategory("TODAS"); }}>{label}</button>)}</div><label className="menu-search"><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar plato o bebida"/></label><div className="menu-filter">{categories.map((value) => <button type="button" className={category === value ? "active" : ""} onClick={() => setCategory(value)} key={value}>{value === "TODAS" ? "Todo" : value}</button>)}</div><div className="visual-menu">{items.map((item) => <article className={!item.available ? "unavailable" : ""} key={item.id}><img src={menuImageFor(item)} alt={item.name} onError={(event) => { event.currentTarget.src = fallbackMenuImage; }}/><div className="menu-copy"><span>{item.category} · {item.area === "BARTENDER" ? "Bar" : "Cocina"}</span><h3>{item.name}</h3><p>{item.description}</p><div className="menu-tags">{(item.tags || []).map((tag) => <small key={tag}>{tag}</small>)}</div><p className="ingredients">{(item.ingredients || []).map((entry) => entry.name).join(" · ")}</p><b>S/ {item.price} · {item.prepMinutes} min</b></div><div className="qty"><button type="button" aria-label={`Quitar ${item.name}`} disabled={!item.available} onClick={() => setCart({ ...cart, [item.id]: Math.max(0, (cart[item.id] || 0) - 1) })}><Minus/></button><strong>{cart[item.id] || 0}</strong><button type="button" aria-label={`Agregar ${item.name}`} disabled={!item.available} onClick={() => setCart({ ...cart, [item.id]: (cart[item.id] || 0) + 1 })}><Plus/></button></div>{!item.available ? <span className="sold-out">Agotado</span> : null}</article>)}</div>{!items.length ? <div className="empty-friendly"><Utensils/><h2>No encontramos opciones</h2><p>Prueba otra búsqueda o cambia el filtro.</p></div> : null}{selected.length ? <section className="cart-summary"><div className="cart-total"><span><b>{selected.reduce((sum, item) => sum + cart[item.id], 0)} productos</b><small>{selected.some((item) => item.area === "RESTAURANTE") && selected.some((item) => item.area === "BARTENDER") ? "Cocina y bar recibirán sus partes sincronizadas después del pago" : "El área responsable recibirá el pedido después del pago"}</small></span><strong>S/ {Number(total).toFixed(2)}</strong></div><Field label="Indicaciones para el equipo" value={notes} onChange={setNotes}/><h3>Pago inmediato</h3><PaymentMethods value={paymentMethod} onChange={setPaymentMethod}/>{paymentMethod === "CAJA HOTEL" ? <p className="error">Los pedidos desde la aplicación se pagan digitalmente. Para efectivo, solicita el pedido directamente en el área.</p> : null}{error ? <p className="error">{error}</p> : null}</section> : null}{total ? <button className="sticky primary" disabled={busy || !destination || paymentMethod === "CAJA HOTEL"} onClick={place}>{busy ? "Procesando pago…" : `Pagar y enviar pedido · S/ ${Number(total).toFixed(2)}`}</button> : null}</>}</Page>;
}

function Requests({ onBack, onDone }) { 
  const [type, setType] = useState("LIMPIEZA"); 
  const [description, setDescription] = useState(""); 
  const [busy, setBusy] = useState(false);

  async function send() { 
    setBusy(true);
    try {
      throw new Error("Conserjería digital estará disponible próximamente.");
    } catch(e) { alert(e.message || "Conserjería digital estará disponible próximamente."); } finally { setBusy(false); }
  } 

  const categories = [
    { value: "LIMPIEZA", label: "Limpieza Extra", desc: "Aseo a la habitación", icon: Sparkles },
    { value: "TOALLAS", label: "Toallas Nuevas", desc: "Solicitar recambio", icon: Waves },
    { value: "MANTENIMIENTO", label: "Falla/Avería", desc: "Foco fundido, AC", icon: Home },
    { value: "CONSERJERIA", label: "Conserjería", desc: "Otras solicitudes", icon: ConciergeBell }
  ];

  return <Page title="Conserjería Digital" subtitle="Tu solicitud llegará al momento al equipo responsable (Housekeeping o Mantenimiento)." onBack={onBack}>
    <div className="support-grid">
      {categories.map(({ value, label, desc, icon: Icon }) => (
        <button className={type === value ? "selected" : ""} key={value} onClick={() => setType(value)}>
          <Icon size={28} />
          <b>{label}</b>
          <small>{desc}</small>
        </button>
      ))}
    </div>
    <div className="card mt-4">
      <Field label="Detalle u observación (Opcional)" value={description} onChange={setDescription} />
      <button className="primary" onClick={send} disabled={busy}>{busy ? "Enviando..." : "Enviar solicitud"}</button>
    </div>
  </Page>; 
}

function Extras({ selected, setSelected }) { const extras = [{ id: "TOALLA", name: "Toalla premium", price: 8 }, { id: "SNACK", name: "Snack de bienvenida", price: 18 }, { id: "DESAYUNO", name: "Desayuno", price: 24 }]; return <div className="card"><h2>Complementa tu experiencia</h2>{extras.map((item) => { const active = selected.some((entry) => entry.id === item.id); return <label className="check-line" key={item.id}><span><b>{item.name}</b><small>+ S/ {item.price}</small></span><input type="checkbox" checked={active} onChange={() => setSelected(active ? selected.filter((entry) => entry.id !== item.id) : [...selected, item])}/></label>; })}</div>; }
function Parking({ value, setValue }) { return <div className="card"><h2>Cochera y vehículos</h2><p>Vehículos menores no pagan. Autos y camionetas usan un espacio reservado.</p><div className="parking"><button className={value?.type === "MOTO" ? "selected" : ""} onClick={() => setValue({ type: "MOTO", plate: "", price: 0 })}>Moto · cortesía</button><button className={value?.type === "AUTO" ? "selected" : ""} onClick={() => setValue({ type: "AUTO", plate: "DEMO-01", price: 15 })}>Auto · S/ 15</button><button className={value?.type === "CAMIONETA" ? "selected" : ""} onClick={() => setValue({ type: "CAMIONETA", plate: "DEMO-02", price: 20 })}>Camioneta · S/ 20</button><button onClick={() => setValue(null)}>Sin cochera</button></div>{value ? <Field label="Placa" value={value.plate} onChange={(plate) => setValue({ ...value, plate })}/> : null}</div>; }
function Counter({ label, value, setValue }) { return <div className="counter"><span>{label}</span><div><button onClick={() => setValue(Math.max(1, value - 1))}><Minus/></button><b>{value}</b><button onClick={() => setValue(value + 1)}><Plus/></button></div></div>; }
function Page({ title, subtitle, onBack, children }) { return <main className="page-shell"><header><div className="top-row">{onBack ? <button className="back" type="button" aria-label="Volver" onClick={onBack}><ArrowLeft/></button> : <span/>}<img src="/brand/park-plaza-mark.svg" alt="Park Plaza"/><span className="avatar" aria-label="Perfil Park Plaza">PP</span></div><small>EXPERIENCIA PARK PLAZA</small><h1>{title}</h1><p>{subtitle}</p></header><section className="page-content">{children}</section></main>; }
function Field({ label, value, onChange, type = "text", options = [] }) { return <label className="field"><span>{label}</span>{type === "select" ? <select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((item) => { const option = typeof item === "object" ? item : { value: item, label: item }; return <option value={option.value} key={option.value}>{option.label}</option>; })}</select> : <input required type={type} value={value} onChange={(e) => onChange(e.target.value)}/>}</label>; }
function Info({ icon: Icon, title, text }) { return <div className="notice-card"><Icon/><div><b>{title}</b><small>{text}</small></div></div>; }
function Row({ label, value, total }) { return <div className={`row ${total ? "total" : ""}`}><span>{label}</span><b>{value}</b></div>; }
function BottomNav({ screen, go, ordersEnabled, hasClient }) { return <nav><button className={screen === "home" ? "active" : ""} onClick={() => go("home")}><Home/>Inicio</button>{hasClient ? <button className={screen === "reservations" ? "active" : ""} onClick={() => go("reservations")}><CalendarDays/>Reservas</button> : null}<button className={screen === "directory" ? "active" : ""} onClick={() => go("directory")}><Map/>Directorio</button>{hasClient ? <><button className={screen === "experience" ? "active" : ""} onClick={() => go("experience")}><QrCode/>Mi QR</button><button disabled={!ordersEnabled} className={screen === "orders" ? "active" : ""} onClick={() => go("orders")}><ShoppingBag/>Pedidos</button></> : null}</nav>; }
async function loadCatalog() {
  const baseServices = [
    { code: "HOSPEDAJE", name: "Hospedaje", price: 0, description: "Habitaciones con disponibilidad real." },
    { code: "EVENTOS", name: "Eventos", price: 0, description: "Solicita una cotización para tu celebración." }
  ];
  const serviceDescriptions = {
    PISCINA: { price: 0, description: "Reserva online en preparación." },
    MIRADOR: { price: 0, description: "Reserva online en preparación." }
  };
  const publicServices = await getServices().catch(() => []);
  const serviceCodes = new Set(baseServices.map((item) => item.code));
  const services = [...baseServices, ...publicServices.filter((item) => !serviceCodes.has(item.code)).map((item) => ({ ...serviceDescriptions[item.code], ...item }))];
  const plansEntries = await Promise.all(["HOSPEDAJE", "PISCINA", "MIRADOR"].map(async (code) => [code, code === "HOSPEDAJE" ? [{ code: "BASICO", name: "Solo hospedaje", price: 0, description: "Reserva de habitación." }] : await getServicePlans(code).catch(() => [])]));
  const extrasEntries = await Promise.all(["HOSPEDAJE", "PISCINA", "MIRADOR"].map(async (code) => [code, await getServiceExtras(code).catch(() => [])]));
  const [restaurantMenu, bartenderMenu, eventSpaces, events] = await Promise.all([
    localStorage.getItem("pp_customer_token") ? getMenu("RESTAURANTE").catch(() => []) : [],
    localStorage.getItem("pp_customer_token") ? getMenu("BARTENDER").catch(() => []) : [],
    getPublicEventSpaces().catch(() => []),
    localStorage.getItem("pp_customer_token") ? getEvents().catch(() => []) : []
  ]);
  const localize = (item) => menuPresentationFor({ ...item, image: menuImageFor(item) });
  const normalizeMenu = (area, items) => (items || []).map((item) => localize({ ...item, area, availableFor: ["HOSPEDAJE", "PISCINA", "MIRADOR", "EVENTOS"], prepMinutes: item.prepMinutes || 20 }));
  const menu = [...normalizeMenu("RESTAURANTE", restaurantMenu), ...normalizeMenu("BARTENDER", bartenderMenu)];
  return {
    services,
    roomTypes: [],
    menu,
    restaurantMenu: normalizeMenu("RESTAURANTE", restaurantMenu),
    eventSpaces: eventSpaces.map((item) => ({ ...item, available: true, description: item.description || "Ambiente disponible para cotización." })),
    events,
    plans: Object.fromEntries(plansEntries),
    extrasByService: Object.fromEntries(extrasEntries),
    eventLayouts: [{ code: "BANQUETE", name: "Banquete" }, { code: "AUDITORIO", name: "Auditorio" }, { code: "COCTEL", name: "Cóctel" }],
    eventEquipment: [],
    parking: {}
  };
}

function normalizeLodgingBooking(item) {
  const nights = item.checkInDate && item.checkOutDate ? Math.max(0, Math.round((new Date(item.checkOutDate) - new Date(item.checkInDate)) / 86400000)) : 0;
  return {
    id: item.id,
    code: item.code,
    serviceCode: "HOSPEDAJE",
    status: item.status,
    paymentStatus: Number(item.balance || 0) > 0 ? "PENDIENTE" : "PAGADO",
    date: item.checkInDate,
    checkOutDate: item.checkOutDate,
    slot: item.status === "CHECKED_IN" ? "Estadía activa" : "Check-in 15:00",
    people: Number(item.adults || 0) + Number(item.children || 0),
    adults: Number(item.adults || 0),
    children: Number(item.children || 0),
    nights,
    total: Number(item.totalPrice || 0),
    paid: Number(item.advance || 0),
    balance: Number(item.balance || 0),
    notes: item.notes,
    roomId: item.roomId || item.room?.id,
    room: item.room
  };
}

function normalizeServiceBooking(item) {
  return {
    id: item.id,
    code: item.code,
    serviceCode: item.serviceCode || item.serviceType,
    status: item.status,
    paymentStatus: Number(item.balance || 0) > 0 ? "PENDIENTE" : "PAGADO",
    date: item.date,
    slot: typeof item.slot === "string" ? item.slot : item.slot?.startTime,
    people: item.people,
    adults: Number(item.adults || 0),
    children: Number(item.children || 0),
    plan: item.plan,
    planName: item.plan?.name || item.planName,
    extras: item.extras || [],
    notes: item.notes,
    total: Number(item.total || item.totalAmount || 0),
    paid: Number(item.paid || item.advance || 0),
    balance: Number(item.balance || 0),
    accessStatus: item.checkedInAt ? "INGRESO_VALIDADO" : "PENDIENTE"
  };
}

function normalizeRecoveredExperience(recovered) {
  return {
    client: recovered.client,
    bookings: [
      ...(recovered.reservations || []).map(normalizeLodgingBooking),
      ...(recovered.serviceReservations || []).map(normalizeServiceBooking)
    ],
    events: recovered.events || [],
    orders: [],
    consumptions: [],
    requests: [],
    passes: []
  };
}

async function buildPublicExperience(documentNumber) {
  const recovered = await recoverReservations(documentNumber);
  return normalizeRecoveredExperience(recovered);
}

async function buildCustomerExperience(storedClient) {
  const [publicExperience, serviceReservations, orders] = await Promise.all([
    buildPublicExperience(storedClient.documentNumber),
    getCustomerServiceReservations().catch(() => []),
    getOrders().catch(() => [])
  ]);
  const serviceBookings = serviceReservations.map(normalizeServiceBooking);
  const serviceIds = new Set(serviceBookings.map((item) => `service-${item.id}`));
  const bookings = [
    ...publicExperience.bookings.filter((item) => item.serviceCode === "HOSPEDAJE" || !serviceIds.has(`service-${item.id}`)),
    ...serviceBookings
  ];
  return { ...publicExperience, bookings, orders };
}

async function buildGuestExperience() {
  const [profile, orders, consumptions, events] = await Promise.all([
    getGuestProfile(),
    getOrders().catch(() => []),
    getConsumptions().catch(() => []),
    getEvents().catch(() => [])
  ]);
  const stay = profile.stay || {};
  const booking = {
    id: stay.id,
    code: stay.reservationCode,
    serviceCode: "HOSPEDAJE",
    status: "CHECKED_IN",
    paymentStatus: "PAGADO",
    date: stay.checkInAt,
    slot: "Estadía activa",
    people: 1,
    total: 0,
    paid: 0,
    balance: 0,
    room: { number: stay.room, type: { name: stay.roomType } },
    stay: { id: stay.id, status: "ACTIVA" }
  };
  return {
    client: profile.client,
    bookings: [booking],
    events,
    orders,
    consumptions,
    requests: [],
    passes: [{
      id: `stay-${stay.id}`,
      code: stay.reservationCode || `STAY-${stay.id}`,
      serviceCode: "HOSPEDAJE",
      kind: "STAY",
      virtual: true,
      entitlements: [{
        id: `stay-entitlement-${stay.id}`,
        serviceCode: "HOSPEDAJE",
        status: "ACTIVO",
        date: stay.checkInAt,
        slot: "Estadía activa",
        people: 1,
        bookingId: stay.id
      }]
    }]
  };
}
