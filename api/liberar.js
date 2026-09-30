const { cmd } = require("./_redis");

// Permite al organizador "reabrir" un enlace (por ejemplo si alguien lo cerró sin verlo).
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  try {
    const { a, tok } = req.body || {};
    const lista = JSON.parse((await cmd(["GET", `a:${String(a)}`])) || "null");
    if (!lista || !lista.includes(tok)) return res.status(404).json({ error: "No encontrado." });
    await cmd(["DEL", `rev:${tok}`]);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
