import { expect, test } from "@playwright/test";

const SCREENS: [string, RegExp][] = [
  ["/dashboard", /Dashboard/], ["/machines", /Machines|EXT|PRS/], ["/machines/north-ext-01", /EXT-01/], ["/alerts", /Alerts|outer race/i],
  ["/signals", /Signals/], ["/acoustics", /Spectrum/i], ["/vision", /Vision/], ["/labelling", /Label/i],
  ["/models", /Models/], ["/sources", /Sources/], ["/audit", /Chain verified/], ["/group", /Group/], ["/settings", /Configuration/],
];

for (const [path, heading] of SCREENS) {
  test(`${path} renders`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.locator("main").getByText(heading).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("sign in asks for the six-digit code", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("lucia.barreiro@ferrovela.example");
  await page.getByLabel(/password/i).fill("correct horse");
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByText(/6-digit code/i)).toBeVisible();
});

test("the theme toggle switches to dark and back", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/dashboard");
  const html = page.locator("html");
  await page.getByRole("button", { name: /switch to dark theme/i }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /switch to light theme/i }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("a dragged widget keeps its new place after a reload", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Customize" }).click();
  const titles = () => page.locator("[data-widget]").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  const before = await titles();
  const grip = page.locator("[data-widget]").nth(1).getByRole("button", { name: /^Move / }).first();
  const target = page.locator("[data-widget]").nth(3);
  const from = (await grip.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 20, from.y + 5, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
  const after = await titles();
  expect(after).not.toEqual(before);
  await page.reload();
  await expect.poll(titles).toEqual(after);
});

test("the commissioning wizard reaches a baseline that the audit log records", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sources");
  await page.getByRole("button", { name: "Commission a point" }).click();
  const dlg = page.getByRole("dialog");
  const next = dlg.getByRole("button", { name: "Next", exact: true });
  await dlg.getByLabel("Machine").selectOption("north-ext-01");
  await dlg.getByLabel("Edge device").selectOption("edge-1");
  await dlg.getByLabel("Driver").selectOption("drv-1");
  for (let i = 0; i < 5; i++) await next.click();
  await expect(next).toBeDisabled();
  await dlg.getByRole("button", { name: "Capture 1 s" }).click();
  await expect(dlg.getByText("Shaft peak where the speed says")).toBeVisible();
  await next.click();
  await expect(dlg.getByRole("group", { name: /Kurtogram/ })).toBeVisible();
  await next.click();
  await dlg.getByRole("button", { name: "Start baseline", exact: true }).click();
  await expect(dlg.getByText("The baseline is running")).toBeVisible();
  await dlg.getByRole("button", { name: "Close", exact: true }).last().click();
  await page.getByRole("link", { name: "Audit" }).click();
  await expect(page.getByRole("cell", { name: "Started baseline" }).first()).toBeVisible();
  await expect(page.getByText("EXT-01 · Motor DE axial")).toBeVisible();
});

test("the spectrum zooms by preset, by drag, and resets", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/acoustics");
  const range = page.locator("main").getByText(/^0 Hz – /).first();
  await expect(range).toHaveText("0 Hz – 500 Hz");
  await page.getByRole("radio", { name: "Full" }).click();
  await expect(range).toHaveText("0 Hz – 5 kHz");
  await page.getByRole("radio", { name: "200 Hz" }).click();
  await expect(range).toHaveText("0 Hz – 200 Hz");
  const over = (await page.getByRole("img", { name: "Amplitude spectrum" }).locator(".u-over").boundingBox())!;
  await page.mouse.move(over.x + over.width * 0.4, over.y + over.height / 2);
  await page.mouse.down();
  await page.mouse.move(over.x + over.width * 0.6, over.y + over.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByRole("radiogroup", { name: "Frequency range" }).getByRole("radio", { checked: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("main").getByText("0 Hz – 500 Hz")).toBeVisible();
});
