import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8")

test("admin home points unauthenticated users at the backend admin Google sign-in route", () => {
  assert.match(source, /\/auth\/google\/signin\?target=admin/)
})
