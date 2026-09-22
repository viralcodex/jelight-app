# jelight-app

A working app for using the [`jelight`](https://github.com/viralcodex/jelight) semantic
highlighter: a node server with a thin editor UI.

## How it works

- The browser is a thin client: it sends changed lines to the server and only renders the
  results. All highlighting logic lives in the `jelight` library.
- `POST /highlight-base` runs the synchronous classifier with **no model calls**, so base
  colors come back fast while typing.
- `POST /highlight-lines` runs the same base pass and then asks Jev **one `choice` question
  per identifier** to resolve semantic roles.
- The client caches results **per line**, so editing one line only re-requests that line,
  while a pasted chunk goes out as a **single batched request**.

## Setup
Clone this repo and then run:

```bash
npm install
```

This pulls the `jelight` library from GitHub (`github:viralcodex/jelight`) along with the
server dependencies. Then add your provider key to `.env`:

```bash
cp .env.example .env
```

The server uses the Vercel AI Gateway by default, so set `AI_GATEWAY_API_KEY`.
To use the TypeSafe API instead, swap the provider to `createTypeSafeEvaluate()` in
`src/index.ts` and set `TYPESAFE_API_KEY`:

| Env var              | Provider            | Used by                          |
| -------------------- | ------------------- | -------------------------------- |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway   | `jelight/gateway` (default)      |
| `TYPESAFE_API_KEY`   | Direct TypeSafe API | `jelight/typesafe`               |

## Run

```bash
npm run dev     

# OR 

npm start
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
| `src/index.ts`      | Express server: static UI + `/highlight-base` and `/highlight-lines`   |
| `public/index.html` | Thin-client editor UI (renders server results, caches per line)     |


## Disclaimer
This ain't a serious project and should not be used in production.

## License

MIT
