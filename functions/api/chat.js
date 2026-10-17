
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return new Response("Not found", { status: 404 });
    }

    if (!env.OPENAI_API_KEY) {
      return Response.json(
        { error: "API key belum dipasang di server." },
        { status: 500 }
      );
    }

    try {
      const body = await request.json();

      if (!Array.isArray(body.messages) || body.messages.length === 0) {
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
            model: env.OPENAI_MODEL || "gpt-4.1-mini",
            instructions:
              "Kamu adalah AI Anja Oktara, asisten ramah. Jawab dalam bahasa Indonesia jika pengguna menggunakan bahasa Indonesia.",
            input: messages
          })
        }
      );

      if (!response.ok) {
        return Response.json(
          { error: "Layanan AI gagal. Periksa API key, model, dan kuota." },
          { status: 502 }
        );
      }

      const result = await response.json();

      return Response.json({
        reply: result.output_text || "AI belum memberikan jawaban."
      });
    } catch {
      return Response.json(
        { error: "Permintaan gagal diproses oleh server." },
        { status: 500 }
      );
    }
  }


