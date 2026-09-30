const { cmd, TTL } = require("./_redis");

module.exports = async (req, res) => {
  try {
    // GET: solo dice el nombre del dueño del enlace (no consume el secreto).
    if (req.method === "GET") {
      const p = JSON.parse((await cmd(["GET", `p:${String(req.query.k || "")}`])) || "null");
      if (!p) return res.status(404).json({ error: "Enlace no válido o vencido." });
      return res.status(200).json({ n: p.n });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const tok = String((req.body && req.body.tok) || "");
    const p = JSON.parse((await cmd(["GET", `p:${tok}`])) || "null");
    if (!p) return res.status(404).json({ error: "Enlace no válido o vencido." });

    // SET ... NX es atómico: solo la primera persona en llegar lo consigue.
    const ok = await cmd(["SET", `rev:${tok}`, "1", "NX", "EX", TTL]);
    if (ok !== "OK") {
      return res.status(409).json({ error: "Este secreto ya fue revelado. Si no fuiste tú, avisa al organizador." });
    }
    res.status(200).json({ n: p.n, r: p.r });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
