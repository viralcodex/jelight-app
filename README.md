# jelight-app

A runnable demo of the [`jelight`](https://github.com/viralcodex/jelight) semantic
highlighter: an Express server plus a thin-client editor UI. Type code in a fullscreen
editor, pick a language, and watch it get colored by **meaning** — powered by **Jev**
(TypeSafe's System One model) through the
[Vercel AI Gateway](https://vercel.com/docs/ai-gateway).

## How it works

- The browser is a thin client: it sends changed lines to the server and only renders the
  results. All highlighting logic lives in the `jelight` library — the UI keeps no classifier
  of its own.
- `POST /highlight-base` runs the synchronous classifier (comments, literals, operators,
  punctuation, keywords, plus provisional identifier roles) with **no model calls**, so base
  colors come back fast while typing.
- `POST /highlight-lines` runs the same base pass and then asks Jev **one `choice` question
  per identifier** to resolve semantic roles.
- Each token is judged against the **full document** as shared state, so identifiers are
  classified with real scope context — not in isolation.
- Answers carry a **confidence**; low-confidence tokens render dimmed in the UI.
- The client caches results **per line**, so editing one line only re-requests that line,
  while a pasted chunk goes out as a **single batched request**.

## Setup

```bash
npm install
```

This pulls the `jelight` library from GitHub (`github:viralcodex/jelight`) along with the
server dependencies. Then add your Vercel AI Gateway key to `.env`:

```bash
cp .env.example .env   # then set AI_GATEWAY_API_KEY
```

String model IDs like `typesafe-ai/jev` resolve through the Gateway automatically using
`AI_GATEWAY_API_KEY` — no base URL or extra provider package needed. The Gateway requires a
credit card on file to unlock free credits.

## Run

```bash
npm run dev     # watch mode (tsx)
npm start       # one-off
```

Then open http://localhost:3000, choose a language, and start typing.

## API

| Method | Path               | Body                                                   | Description                                                                    |
| ------ | ------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| GET    | `/`                | —                                                      | Serves the editor UI                                                           |
| POST   | `/highlight-base`  | `{ code, lang, lines: [{ line, lineNumber }] }`        | Synchronous lexical + provisional tokens (no model)                            |
| POST   | `/highlight-lines` | `{ code, lang, mode?, lines: [{ line, lineNumber }] }` | Classifies each line's tokens in one Jev call (`mode`: `"assist"` or `"full"`) |

Response shape:

```json
{
  "results": [
    {
      "lineNumber": 0,
      "tokens": [
        { "text": "const", "start": 0, "end": 5, "category": "keyword", "confidence": 1 }
      ]
    }
  ]
}
```

### Example

```bash
curl -X POST http://localhost:3000/highlight-lines \
  -H 'content-type: application/json' \
  -d '{"code":"let n = 5;","lang":"javascript","lines":[{"line":"let n = 5;","lineNumber":0}]}'
```

## Structure

| Path                | Responsibility                                                      |
| ------------------- | ------------------------------------------------------------------- |
| `src/config.ts`     | Deployment env config (`PORT`, `AI_MODEL`)                          |
| `src/parse.ts`      | Request validation (`parseHighlightRequest`, `InvalidRequestError`) |
| `src/index.ts`      | Express app: static UI + `/highlight-base` and `/highlight-lines`   |
| `public/index.html` | Thin-client editor UI (renders server results, caches per line)     |

## Model

The model defaults to `typesafe-ai/jev`. Override it with `AI_MODEL` in `.env`.

## License

MIT
