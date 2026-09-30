const { cmd } = require("./_redis");

// Devuelve nombres, enlaces y estado. NUNCA devuelve a quién le tocó a cada uno.
module.exports = async (req, res) => {
  try {
    const a = String(req.query.a || "");
    const lista = JSON.parse((await cmd(["GET", `a:${a}`])) || "null");
    if (!lista) return res.status(404).json({ error: "Sorteo no encontrado o vencido." });
    const jugadores = await Promise.all(lista.map(async (tok) => {
      const p = JSON.parse(await cmd(["GET", `p:${tok}`]));
      const rev = await cmd(["EXISTS", `rev:${tok}`]);
      return { n: p.n, tok, rev: rev === 1 };
    }));
    res.status(200).json({ jugadores });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
