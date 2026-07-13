const PRIMARY_MODEL = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-3.1-flash-lite";

const generateContent = (model, apiKey, body) => fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  }
);

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: { message: "Method not allowed." } }, { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: { message: "Server is missing GEMINI_API_KEY." } },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { message: "Request body must be valid JSON." } }, { status: 400 });
  }

  try {
    let upstream = await generateContent(PRIMARY_MODEL, apiKey, body);
    if ([429, 503].includes(upstream.status)) {
      upstream = await generateContent(FALLBACK_MODEL, apiKey, body);
    }

    const responseBody = await upstream.text();
    return new Response(responseBody, {
      status: upstream.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch {
    return Response.json(
      { error: { message: "The server could not reach the Google API." } },
      { status: 502 }
    );
  }
};
