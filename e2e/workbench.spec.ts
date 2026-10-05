import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function start(page: Page) {
  await page.goto("/#app");
  await page.getByRole("button", { name: "Explore an example" }).click();
  await expect(page.getByRole("status")).toHaveText("Example workspace added");
}
async function nav(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
}

test("landing desktop/mobile and workspace primary action", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Less managing. More making." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Less managing. More making." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Start your workspace" })
    .first()
    .click();
  await page.getByRole("button", { name: "Start fresh", exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Your work, in motion." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/workspace-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(failures).toEqual([]);
});

test("real planning-to-delivery workflow persists and exports/restores", async ({
  page,
}) => {
  await start(page);
  await page.screenshot({
    path: "test-results/workspace-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await nav(page, "Projects");
  await page
    .getByRole("main")
    .getByRole("button", { name: "New project", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Project name").fill("Verified release");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("An actual complete project workflow");
  await dialog
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("active");
  await dialog.getByLabel("Target date").fill("2027-01-31");
  await dialog.getByRole("button", { name: "Save project" }).click();
  await nav(page, "Cycles");
  await page.getByRole("button", { name: "New cycle", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Cycle name").fill("Delivery cycle");
  await dialog.getByLabel("Start date").fill("2027-01-01");
  await dialog.getByLabel("End date").fill("2027-01-14");
  await dialog.getByRole("button", { name: "Save cycle" }).click();
  await page.getByRole("button", { name: "New ticket" }).first().click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("Ship a verified workflow");
  await dialog
    .getByLabel("Description & acceptance criteria")
    .fill("User can finish the workflow and restore a backup.");
  await dialog
    .getByRole("combobox", { name: "Project", exact: true })
    .selectOption({ label: "Verified release" });
  await dialog
    .getByRole("combobox", { name: "Cycle", exact: true })
    .selectOption({ label: "Delivery cycle" });
  await dialog.getByLabel("Assignee").fill("Sam");
  await dialog.getByLabel("Labels (comma separated)").fill("Release, Quality");
  await dialog.getByLabel("Estimate (points)").fill("5");
  await dialog
    .getByRole("button", { name: "Create ticket", exact: true })
    .click();
  await page.getByLabel("Search tickets").fill("Ship a verified workflow");
  await expect(
    page.getByRole("button", { name: /ZET-7 Ship a verified workflow/ }),
  ).toBeVisible();
  await page.getByLabel("Status of ZET-7").selectOption("in_progress");
  await page
    .getByRole("button", { name: /ZET-7 Ship a verified workflow/ })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Labels (comma separated)")).toHaveValue(
    "Release, Quality",
  );
  await dialog
    .getByLabel("Add a comment")
    .fill("Confirmed persistence and backup behavior.");
  await dialog
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("done");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await page.reload();
  await page.getByLabel("Search tickets").fill("Ship a verified workflow");
  await expect(page.getByLabel("Status of ZET-7")).toHaveValue("done");
  await nav(page, "Notes");
  await page.getByRole("button", { name: "New note" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title", { exact: true }).fill("Release evidence");
  await dialog
    .getByRole("combobox", { name: "Project", exact: true })
    .selectOption({ label: "Verified release" });
  await dialog
    .getByLabel("Note", { exact: true })
    .fill("This project has linked, real tickets.");
  await expect(dialog.getByText("Ship a verified workflow")).toBeVisible();
  await dialog.getByRole("button", { name: "Save note" }).click();
  await page.getByRole("button", { name: "Settings & backups" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const download = await downloadPromise;
  const path = (await download.path())!;
  const backup = JSON.parse(await readFile(path, "utf8"));
  expect(
    backup.issues.find((i: { identifier: string }) => i.identifier === "ZET-7")
      .comments[0].body,
  ).toContain("persistence");
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"schemaVersion":99}'),
    });
  await expect(page.getByRole("alert")).toContainText(
    "Import could not be opened",
  );
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await page
    .getByRole("button", { name: "Reset workspace", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset workspace", exact: true })
    .click();
  await page.getByRole("button", { name: "Settings & backups" }).click();
  await page.locator('input[type="file"]').setInputFiles(path);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Back up & restore" })
    .click();
  await page.getByLabel("Search tickets").fill("Ship a verified workflow");
  await expect(page.getByLabel("Status of ZET-7")).toHaveValue("done");
  await page.getByRole("button", { name: "Board view" }).click();
  await expect(
    page.getByRole("heading", { name: "Ship a verified workflow" }),
  ).toBeVisible();
});

test("stale drafts cannot overwrite a concurrent edit even after reload", async ({
  page,
  context,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: /ZET-2 Build the first complete workflow/ })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Title", { exact: true })
    .fill("Unsaved first draft");
  const second = await context.newPage();
  await second.goto("/#app");
  await second
    .getByRole("button", { name: /ZET-2 Build the first complete workflow/ })
    .click();
  await second
    .getByRole("dialog")
    .getByLabel("Description & acceptance criteria")
    .fill("A newer description from another window");
  await second
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes" })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "changed",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reload workspace" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes" })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "changed",
  );
  await expect(
    page.getByRole("dialog").getByLabel("Title", { exact: true }),
  ).toHaveValue("Unsaved first draft");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: /ZET-2 Build the first complete workflow/ })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Description & acceptance criteria"),
  ).toHaveValue("A newer description from another window");
});
