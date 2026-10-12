const GRAPH = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

/** Normaliza un celular argentino al formato que pide Meta: 549 + área + número */
export function normalizeAR(raw: string) {
  let n = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (n.startsWith('54')) n = n.slice(2);
  n = n.replace(/^9/, '');           // sacar el 9 si ya viene
  n = n.replace(/^(\d{2,4})15/, '$1'); // sacar el "15" tras el código de área
  return '549' + n;
}

export async function sendTemplate(to: string, template: string, params: string[]) {
  const res = await fetch(GRAPH, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', to: normalizeAR(to), type: 'template',
      template: {
        name: template, language: { code: 'es_AR' },
        components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
      },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`);
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Argentina/Tucuman',
  });

export async function notifyBarberNewBooking({ barber, service, appt }: any) {
  // Plantilla "nuevo_turno": {{1}} cliente, {{2}} servicio, {{3}} fecha/hora, {{4}} WhatsApp del cliente
  await sendTemplate(barber.whatsapp, 'nuevo_turno', [
    `${appt.client_first_name} ${appt.client_last_name}`, service.name, fmt(appt.starts_at), appt.client_whatsapp,
  ]);
}