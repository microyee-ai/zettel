import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing and workspace have no serious or critical automated accessibility violations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const mode of ["landing", "workspace"]) {
    if (mode === "workspace") {
      await page
        .getByRole("button", { name: "Start your workspace" })
        .first()
        .click();
      await page.getByRole("button", { name: "Explore an example" }).click();
    }
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect
      .soft(
        results.violations
          .filter((v) => ["serious", "critical"].includes(v.impact ?? ""))
          .map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              detail: n.failureSummary,
            })),
          })),
        mode,
      )
      .toEqual([]);
  }
});
