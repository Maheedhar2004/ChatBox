const http = require("node:http");
const path = require("node:path");
const { readFile } = require("node:fs/promises");

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log("Key exists:", !!process.env.GEMINI_API_KEY);
console.log("Key prefix:", process.env.GEMINI_API_KEY?.substring(0, 5));
const MODEL_NAME = "gemini-2.5-flash";
const FALLBACK_MODEL_NAME = "gemini-2.5-flash";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const sendJson = (response, statusCode, body) => {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
};

const readJsonBody = (request) => new Promise((resolve, reject) => {
  let body = "";
  request.on("data", (chunk) => {
    body += chunk;
    if (body.length > 10 * 1024 * 1024) request.destroy();
  });
  request.on("end", () => {
    try {
      resolve(JSON.parse(body || "{}"));
    } catch {
      reject(new Error("Request body must be valid JSON."));
    }
  });
  request.on("error", reject);
});

const proxyRequest = async (response, url, body, fallbackUrl) => {
  if (!GEMINI_API_KEY) {
    sendJson(response, 500, { error: { message: "Server is missing GEMINI_API_KEY." } });
    return;
  }

  try {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    };
    let upstream = await fetch(url, requestOptions);

    // Keep chats available when the primary model is temporarily saturated.
    if (fallbackUrl && [429, 503].includes(upstream.status)) {
      upstream = await fetch(fallbackUrl, requestOptions);
    }

    const responseBody = await upstream.text();
    response.writeHead(upstream.status, { "Content-Type": "application/json; charset=utf-8" });
    response.end(responseBody);
  } catch {
    sendJson(response, 502, { error: { message: "The server could not reach the Google API." } });
  }
};

const serveFile = async (request, response, pathname) => {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(ROOT_DIR, `.${requestedPath}`);
  if (!filePath.startsWith(`${ROOT_DIR}${path.sep}`)) {
    response.writeHead(403).end();
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
};

http.createServer(async (request, response) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "POST" && pathname === "/api/generate") {
    try {
      const body = await readJsonBody(request);
      await proxyRequest(
        response,
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`,
        body,
        `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL_NAME}:generateContent`
      );
    } catch (error) {
      sendJson(response, 400, { error: { message: error.message } });
    }
    return;
  }

  if (request.method === "GET") {
    await serveFile(request, response, pathname);
    return;
  }

  response.writeHead(405).end();
}).listen(PORT, () => {
  console.log(`Mahi Assistant is running at http://localhost:${PORT}`);
});
