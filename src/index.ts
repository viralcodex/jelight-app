import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { MODEL, PORT } from "./config.js";
import { highlightBaseLines, highlightLines } from "jelight";
import { createGatewayEvaluate } from "jelight/gateway";
import { InvalidRequestError, parseHighlightRequest } from "./parse.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

// Inject the Vercel AI Gateway as the semantic provider. Swap this for
// createTypeSafeEvaluate() to hit the TypeSafe API directly.
const evaluate = createGatewayEvaluate({ model: MODEL });


const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(PUBLIC_DIR)); // serves public/index.html at "/"

// Synchronous base highlighting: lexical tokens + provisional roles, no model
// calls. The browser uses this so ALL highlighting logic stays in the jelight
// library — the UI keeps no duplicate classifier of its own.
app.post("/highlight-base", (req: Request, res: Response) => {
  try {
    const { lines, lang } = parseHighlightRequest(req.body);
    res.json({ results: highlightBaseLines(lines, lang) });
  } catch (err) {
    if (err instanceof InvalidRequestError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Unable to highlight code" });
  }
});

// Classify a batch of lines in one Jev call, with the full document as context.
// Batching keeps a pasted chunk to a single request.
app.post("/highlight-lines", async (req: Request, res: Response) => {
  try {
    const { code, lines, lang, mode } = parseHighlightRequest(req.body);
    const results = await highlightLines(code, lines, lang, { evaluate, mode });
    res.json({ results });
  } catch (err) {
    if (err instanceof InvalidRequestError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Unable to highlight code" });
  }
});

app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? (err as { status?: unknown }).status
        : undefined;
    if (status === 400) {
      res.status(400).json({ error: "Request body must be valid JSON" });
      return;
    }
    if (status === 413) {
      res.status(413).json({ error: "Request body is too large" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`Jelight running at http://localhost:${PORT}`);
  console.log(`   Model: ${MODEL}`);
});
