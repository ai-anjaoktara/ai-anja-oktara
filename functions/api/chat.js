export async function onRequestPost({ request, env }) {
  if (!env.OPENAI_API_KEY) {
    return Response.json(
      { error: "API key belum dipasang di server." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    if (!Array.isArray(body.messages)) {
      return Response.json(
        { error: "Pesan tidak valid." },
        { status: 400 }
      );
    }

    const messages = body.messages
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-10)
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 3000)
      }));

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: messages
        })
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: "Layanan AI gagal merespons. Periksa konfigurasi API." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.output_text ||
      (data.output || [])
        .flatMap(item => item.content || [])
        .filter(item => item.type === "output_text")
        .map(item => item.text)
        .join("\n");

    return Response.json({ reply: reply || "Belum ada jawaban." });
  } catch {
    return Response.json(
      { error: "Terjadi kesalahan saat memproses pesan." },
      { status: 500 }
    );
  }
}
