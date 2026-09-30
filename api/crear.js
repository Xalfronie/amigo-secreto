const crypto = require("crypto");
const { cmd, norm, TTL } = require("./_redis");

function barajar(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  try {
    const crudos = Array.isArray(req.body && req.body.nombres) ? req.body.nombres : [];
    const vistos = new Set(), nombres = [];
    for (const x of crudos) {
      const n = String(x).trim().replace(/\s+/g, " ").slice(0, 40);
      if (!n) continue;
      if (vistos.has(norm(n))) return res.status(400).json({ error: `"${n}" está repetido. Agrega un apellido o inicial.` });
      vistos.add(norm(n)); nombres.push(n);
    }
    if (nombres.length < 3) return res.status(400).json({ error: "Necesitas al menos 3 participantes." });
    if (nombres.length > 60) return res.status(400).json({ error: "Máximo 60 participantes." });

    // Un solo ciclo: nadie se toca a sí mismo y nadie se repite.
    const orden = barajar(nombres);
    const admin = crypto.randomBytes(16).toString("base64url");
    const jugadores = [];
    for (let i = 0; i < orden.length; i++) {
      const tok = crypto.randomBytes(9).toString("base64url");
      const r = orden[(i + 1) % orden.length];
      await cmd(["SET", `p:${tok}`, JSON.stringify({ n: orden[i], r }), "EX", TTL]);
      jugadores.push({ n: orden[i], tok });
    }
    await cmd(["SET", `a:${admin}`, JSON.stringify(jugadores.map((j) => j.tok)), "EX", TTL]);
    res.status(200).json({ admin });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
