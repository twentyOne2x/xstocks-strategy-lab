import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import {
  bootstrapSharedEnv,
  expandHomePath,
  optionalEnv,
  resolveSecret,
} from "./lib/shared-env.mjs";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CURRENT_DIR, "..");
const MODE = process.argv[2] ?? "status";
const DEFAULT_CDP_URL = "http://127.0.0.1:9224";
const DEFAULT_BRAVE_BINARY =
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const DEFAULT_BRAVE_USER_DATA_DIR = resolve(
  process.env.HOME ?? "~",
  "Library/Application Support/xstocks-operator-brave",
);
const DEFAULT_ONBOARDING_URL = "https://24-7.markets/onboarding";
const DEFAULT_ACTIVATE_URL =
  "https://24-7.markets/activate/onboarding-default-basket--basket-starter-h6-p100-c5-cap18-a0-r300-v1";

function timestampSlug() {
  return new Date().toISOString().replaceAll(":", "-");
}

function redact(value, { head = 6, tail = 4 } = {}) {
  if (typeof value !== "string" || value.length <= head + tail) {
    return value ?? null;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function ensureArtifactDir() {
  const artifactDir = resolve(
    REPO_ROOT,
    "tmp/proof",
    `operator-browser-harness-${timestampSlug()}`,
  );
  await mkdir(artifactDir, { recursive: true });
  return artifactDir;
}

async function writeJson(artifactDir, name, value) {
  await writeFile(
    resolve(artifactDir, name),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

async function fetchJson(url) {
  const response = await fetch(url);
  const payload = await response.json();
  return payload;
}

function summarizeTargets(targets) {
  return targets.map((target) => ({
    id: target.id,
    type: target.type,
    title: target.title,
    url: target.url,
  }));
}

function getBrowserExpectations(browserVersion) {
  const isHeadless =
    /HeadlessChrome/i.test(browserVersion?.["User-Agent"] ?? "") ||
    /HeadlessChrome/i.test(browserVersion?.Browser ?? "");

  return {
    isHeadless,
    walletUiCapable: !isHeadless,
  };
}

async function connectToBrowser(cdpUrl) {
  const browser = await chromium.connectOverCDP(cdpUrl);
  const contexts = browser.contexts();
  const context = contexts[0] ?? (await browser.newContext());
  return {
    browser,
    context,
    close: async () => browser.close(),
  };
}

async function launchOperatorBrowser({
  braveBinary,
  userDataDir,
  remoteDebuggingPort,
}) {
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath: braveBinary,
    headless: false,
    viewport: { width: 1440, height: 1200 },
    args: [
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${remoteDebuggingPort}`,
    ],
  });

  return {
    browser: context.browser(),
    context,
    close: async () => context.close(),
  };
}

async function findOrCreatePage(context, targetUrl) {
  const existingPage = context.pages().find((page) =>
    page.url().startsWith(targetUrl),
  );

  if (existingPage) {
    await existingPage.bringToFront().catch(() => {});
    return existingPage;
  }

  const page = await context.newPage();
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  return page;
}

async function capturePageState(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText ?? "";
    const provider =
      typeof window !== "undefined" && "ethereum" in window
        ? window.ethereum
        : null;

    return {
      title: document.title,
      url: window.location.href,
      bodyTextSample: text.slice(0, 2000),
      hasEthereumProvider: Boolean(provider),
      selectedAddress:
        typeof provider?.selectedAddress === "string"
          ? provider.selectedAddress
          : null,
      chainId:
        typeof provider?.chainId === "string" ? provider.chainId : null,
      walletLabels: Array.from(document.querySelectorAll("button, [role='button']"))
        .map((node) => node.textContent?.trim() ?? "")
        .filter(Boolean)
        .slice(0, 50),
    };
  });
}

async function screenshot(page, artifactDir, name) {
  const path = resolve(artifactDir, name);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function waitForProvider(page, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const hasProvider = await page
      .evaluate(() => typeof window.ethereum !== "undefined")
      .catch(() => false);

    if (hasProvider) {
      return true;
    }

    await sleep(500);
  }

  return false;
}

async function clickByNames(page, names, label) {
  for (const name of names) {
    const locator = page.getByRole("button", { name }).first();

    if ((await locator.count()) > 0) {
      await locator.click({ force: true });
      await sleep(1000);
      return {
        clicked: true,
        label,
        name: String(name),
      };
    }
  }

  return {
    clicked: false,
    label,
    name: null,
  };
}

async function findWalletPanelPage(browser, cdpUrl) {
  const liveTargets = await fetchJson(`${cdpUrl}/json/list`).catch(() => []);

  for (const context of browser.contexts()) {
    for (const page of context.pages()) {
      if (page.url().startsWith("chrome://wallet-panel.top-chrome")) {
        return page;
      }
    }
  }

  const target = liveTargets.find((candidate) =>
    candidate.url.startsWith("chrome://wallet-panel.top-chrome"),
  );

  return target
    ? {
        url: () => target.url,
        title: async () => target.title ?? "wallet-panel",
      }
    : null;
}

async function unlockWalletPanel(page, password) {
  const passwordField = page.locator("input[type='password']").first();

  if ((await passwordField.count()) === 0) {
    return {
      unlocked: false,
      reason: "password_input_missing",
    };
  }

  await passwordField.fill(password);

  const unlockButton = page
    .getByRole("button", { name: /unlock wallet|unlock|continue/i })
    .first();

  if ((await unlockButton.count()) > 0) {
    await unlockButton.click({ force: true });
  } else {
    await passwordField.press("Enter");
  }

  await sleep(1500);

  const stillLocked = (await page.locator("input[type='password']").count()) > 0;

  return {
    unlocked: !stillLocked,
    reason: stillLocked ? "wallet_panel_still_locked" : null,
  };
}

async function captureWalletPageState(page) {
  return page.evaluate(() => ({
    title: document.title,
    url: window.location.href,
    bodyTextSample: (document.body?.innerText ?? "").slice(0, 3000),
    buttons: Array.from(document.querySelectorAll("button, leo-button"))
      .map((node) => node.textContent?.trim() ?? "")
      .filter(Boolean)
      .slice(0, 40),
    inputs: Array.from(document.querySelectorAll("input")).map((input) => ({
      type: input.type,
      name: input.getAttribute("name"),
      placeholder: input.getAttribute("placeholder"),
      ariaLabel: input.getAttribute("aria-label"),
    })),
    checkboxLabels: Array.from(
      document.querySelectorAll('label[role="checkbox"]'),
    )
      .map((node) => node.textContent?.trim() ?? "")
      .filter(Boolean)
      .slice(0, 20),
  }));
}

async function bootstrapBraveWallet({
  context,
  routePage,
  artifactDir,
  password,
  steps,
}) {
  const walletPage = await findOrCreatePage(
    context,
    "chrome://wallet/crypto/onboarding/welcome",
  );
  await walletPage.waitForLoadState("domcontentloaded").catch(() => {});
  await sleep(1000);

  const initialState = await captureWalletPageState(walletPage);
  await writeJson(artifactDir, "wallet-bootstrap-initial.json", initialState);
  await screenshot(walletPage, artifactDir, "wallet-bootstrap-initial.png");
  steps.push(`Opened dedicated wallet route \`${initialState.url}\`.`);

  if (
    /crypto\/onboarding\/welcome$/i.test(initialState.url) ||
    /Need a new wallet\?/i.test(initialState.bodyTextSample)
  ) {
    await walletPage.locator("button").first().click({ force: true });
    await sleep(1000);
    steps.push("Started Brave wallet onboarding in the dedicated profile.");
  }

  const checkboxCount = await walletPage
    .locator('label[role="checkbox"]')
    .count();

  if (checkboxCount >= 2) {
    await walletPage
      .locator('label[role="checkbox"]')
      .nth(0)
      .click({ force: true });
    await walletPage
      .locator('label[role="checkbox"]')
      .nth(1)
      .click({ force: true });
    await sleep(500);

    const termsContinue = walletPage
      .locator("leo-button")
      .filter({ hasText: "Continue" })
      .first();

    if ((await termsContinue.count()) > 0) {
      await termsContinue.click({ force: true });
      await sleep(1000);
      steps.push("Accepted Brave wallet terms in the dedicated profile.");
    }
  }

  const networksButton = walletPage.getByRole("button", {
    name: /Continue with .* Networks/i,
  });

  if ((await networksButton.count()) > 0) {
    await networksButton.click({ force: true });
    await sleep(1000);
    steps.push("Accepted the default supported-network selection.");
  }

  const passwordField = walletPage.locator('input[name="password"]').first();
  const confirmationField = walletPage
    .locator('input[name="password-confirmation"]')
    .first();

  if ((await passwordField.count()) > 0 && (await confirmationField.count()) > 0) {
    await passwordField.fill(password);
    await confirmationField.fill(password);
    await walletPage
      .getByRole("button", { name: /^Continue$/ })
      .first()
      .click({ force: true });
    await sleep(12000);
    steps.push("Created a dedicated Brave wallet password in the isolated profile.");
  }

  await routePage.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  await sleep(1500);
  const providerAvailable = await waitForProvider(routePage, 5000);
  const finalState = await captureWalletPageState(walletPage);

  await writeJson(artifactDir, "wallet-bootstrap-final.json", finalState);
  await screenshot(walletPage, artifactDir, "wallet-bootstrap-final.png");

  return {
    providerAvailable,
    finalState,
  };
}

async function requestAccountsWithTimeout(page, timeoutMs = 5000) {
  return page.evaluate(async ({ timeoutMs: evalTimeoutMs }) => {
    if (
      typeof window.ethereum === "undefined" ||
      typeof window.ethereum.request !== "function"
    ) {
      return {
        status: "provider_missing",
      };
    }

    const timeoutPromise = new Promise((resolve) => {
      window.setTimeout(() => resolve({ status: "timeout" }), evalTimeoutMs);
    });

    const requestPromise = window.ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => ({
        status: "resolved",
        accounts,
      }))
      .catch((error) => ({
        status: "rejected",
        code: typeof error?.code === "number" ? error.code : null,
        message: typeof error?.message === "string" ? error.message : String(error),
      }));

    return Promise.race([timeoutPromise, requestPromise]);
  }, { timeoutMs });
}

function summaryMarkdown({
  mode,
  browserVersion,
  expectations,
  secretSource,
  loadedPaths,
  blocker,
  steps,
}) {
  return `# xStocks Operator Browser Harness

Date: ${new Date().toISOString()}
Mode: \`${mode}\`

## Browser

1. Browser: \`${browserVersion?.Browser ?? "unknown"}\`
2. User agent: \`${browserVersion?.["User-Agent"] ?? "unknown"}\`
3. Wallet UI capable: \`${expectations.walletUiCapable}\`
4. Shared env sources loaded: ${loadedPaths.length > 0 ? loadedPaths.map((path) => `\`${path}\``).join(", ") : "none"}
5. Wallet password source: \`${secretSource ?? "missing"}\`

## Steps

${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Blocker

${blocker ?? "none"}
`;
}

async function run() {
  const artifactDir = await ensureArtifactDir();
  const envBootstrap = bootstrapSharedEnv(REPO_ROOT);
  const harnessMode =
    optionalEnv("XSTOCKS_BROWSER_HARNESS_MODE") ?? "launch";
  const cdpUrl = optionalEnv("XSTOCKS_BRAVE_CDP_URL") ?? DEFAULT_CDP_URL;
  const braveBinary =
    optionalEnv("XSTOCKS_BRAVE_BINARY") ?? DEFAULT_BRAVE_BINARY;
  const braveUserDataDir = expandHomePath(
    optionalEnv("XSTOCKS_BRAVE_USER_DATA_DIR") ?? DEFAULT_BRAVE_USER_DATA_DIR,
  );
  const remoteDebuggingPort =
    optionalEnv("XSTOCKS_BRAVE_CDP_PORT") ?? "9225";
  const onboardingUrl =
    optionalEnv("XSTOCKS_CANONICAL_ONBOARDING_URL") ?? DEFAULT_ONBOARDING_URL;
  const activateUrl =
    optionalEnv("XSTOCKS_CANONICAL_ACTIVATE_URL") ?? DEFAULT_ACTIVATE_URL;
  const walletPasswordSecret = resolveSecret({
    envName: "XSTOCKS_BRAVE_WALLET_PASSWORD",
    commandEnvName: "XSTOCKS_BRAVE_WALLET_PASSWORD_COMMAND",
    contextLabel: "the xStocks operator browser harness",
  });

  const browserVersion =
    harnessMode === "attach"
      ? await fetchJson(`${cdpUrl}/json/version`)
      : {
          Browser: "Brave (launched by Playwright)",
          "User-Agent": "launchPersistentContext",
        };
  const cdpTargets =
    harnessMode === "attach" ? await fetchJson(`${cdpUrl}/json/list`) : [];
  const expectations = getBrowserExpectations(browserVersion);
  const steps = [];
  let blocker = null;

  await writeJson(artifactDir, "browser-version.json", browserVersion);
  await writeJson(artifactDir, "cdp-targets.json", summarizeTargets(cdpTargets));
  await writeJson(artifactDir, "environment.json", {
    cdpUrl,
    harnessMode,
    braveBinary: redact(braveBinary, { head: 24, tail: 18 }),
    braveUserDataDir: redact(braveUserDataDir, { head: 24, tail: 18 }),
    remoteDebuggingPort,
    onboardingUrl,
    activateUrl,
    sharedEnvPath: envBootstrap.sharedEnvPath,
    loadedPaths: envBootstrap.loadedPaths,
    hasWalletPassword: Boolean(walletPasswordSecret.value),
    walletPasswordSource: walletPasswordSecret.source,
  });

  steps.push(
    harnessMode === "attach"
      ? `Connected to CDP endpoint \`${cdpUrl}\`.`
      : `Launched dedicated Brave operator profile from \`${braveBinary}\`.`,
  );

  if (!expectations.walletUiCapable) {
    blocker =
      "The configured CDP browser is headless. Wallet-panel UI automation requires a non-headless Brave operator profile.";
  }

  const browserSession =
    harnessMode === "attach"
      ? await connectToBrowser(cdpUrl)
      : await launchOperatorBrowser({
          braveBinary,
          userDataDir: braveUserDataDir,
          remoteDebuggingPort,
        });
  const { browser, context } = browserSession;

  try {
    const onboardingPage = await findOrCreatePage(context, onboardingUrl);
    await onboardingPage.waitForLoadState("domcontentloaded");
    await sleep(1000);

    const onboardingState = await capturePageState(onboardingPage);
    await writeJson(artifactDir, "onboarding-state.json", onboardingState);
    await screenshot(onboardingPage, artifactDir, "onboarding-state.png");
    steps.push(`Loaded canonical onboarding route \`${onboardingState.url}\`.`);

    if (MODE === "frontend-buy") {
      const routePage = await findOrCreatePage(context, activateUrl).catch(
        async () => onboardingPage,
      );
      await routePage.waitForLoadState("domcontentloaded").catch(() => {});
      await sleep(1000);

      const routeState = await capturePageState(routePage);
      await writeJson(artifactDir, "activate-state.json", routeState);
      await screenshot(routePage, artifactDir, "activate-state.png");
      steps.push(`Loaded canonical activate route \`${routeState.url}\`.`);

      if (!routeState.hasEthereumProvider && walletPasswordSecret.value) {
        const bootstrapResult = await bootstrapBraveWallet({
          context,
          routePage,
          artifactDir,
          password: walletPasswordSecret.value,
          steps,
        });
        const postBootstrapState = await capturePageState(routePage);
        await writeJson(artifactDir, "post-bootstrap-state.json", postBootstrapState);
        await screenshot(routePage, artifactDir, "post-bootstrap-state.png");

        if (bootstrapResult.providerAvailable) {
          steps.push(
            "Bootstrapped a dedicated Brave wallet profile and confirmed provider injection on the canonical route.",
          );
        } else {
          blocker =
            blocker ??
            "The dedicated profile completed wallet bootstrap steps but still did not expose an injected wallet provider on the canonical route.";
        }
      }

      await routePage.bringToFront().catch(() => {});
      await sleep(750);

      const routeStateAfterBootstrap = await capturePageState(routePage);
      await writeJson(
        artifactDir,
        "activate-state-after-bootstrap.json",
        routeStateAfterBootstrap,
      );
      await screenshot(
        routePage,
        artifactDir,
        "activate-state-after-bootstrap.png",
      );

      const actions = [
        {
          label: "connect_wallet",
          names: [/connect wallet/i],
        },
        {
          label: "see_my_portfolio",
          names: [/see my portfolio/i, /see portfolio/i],
        },
        {
          label: "skip",
          names: [/skip/i],
        },
        {
          label: "start_deposit",
          names: [/start deposit/i, /buy portfolio/i],
        },
        {
          label: "continue_with_wallet",
          names: [/continue with a wallet/i, /^continue$/i],
        },
        {
          label: "brave_wallet",
          names: [/brave wallet/i],
        },
      ];

      for (const action of actions) {
        const result = await clickByNames(routePage, action.names, action.label);
        steps.push(
          result.clicked
            ? `Clicked \`${action.label}\` via ${result.name}.`
            : `Did not find a clickable \`${action.label}\` button on the current surface.`,
        );
      }

      const postClickState = await capturePageState(routePage);
      await writeJson(artifactDir, "post-click-state.json", postClickState);
      await screenshot(routePage, artifactDir, "post-click-state.png");

      if (!postClickState.hasEthereumProvider) {
        blocker =
          blocker ??
          "The dedicated operator browser profile does not expose an injected wallet provider yet. Set up Brave Wallet or another supported injected wallet in that non-interference profile before frontend wallet proof can continue.";
      }

      if (postClickState.hasEthereumProvider) {
        await routePage.bringToFront().catch(() => {});
        await sleep(750);
        const requestAccountsResult = await requestAccountsWithTimeout(routePage);
        await writeJson(
          artifactDir,
          "eth-request-accounts.json",
          requestAccountsResult,
        );
        steps.push(
          `Direct eth_requestAccounts probe returned \`${requestAccountsResult.status}\`.`,
        );

        if (requestAccountsResult.status === "rejected" && !blocker) {
          blocker =
            requestAccountsResult.message ??
            "The injected wallet provider rejected the direct account request.";
        }
      }

      const walletPanelPage =
        harnessMode === "attach"
          ? await findWalletPanelPage(browser, cdpUrl)
          : await findWalletPanelPage(
              browser,
              `http://127.0.0.1:${remoteDebuggingPort}`,
            );

      if (!walletPanelPage && !blocker) {
        blocker =
          "The frontend flow did not open a Brave wallet panel on the configured browser.";
      } else if (!expectations.walletUiCapable) {
        blocker =
          blocker ??
          "A wallet panel may exist, but the configured browser is headless so the operator UI cannot be trusted.";
      } else if (!walletPasswordSecret.value) {
        blocker =
          blocker ??
          "Wallet-panel automation is ready, but XSTOCKS_BRAVE_WALLET_PASSWORD or XSTOCKS_BRAVE_WALLET_PASSWORD_COMMAND is not configured.";
      } else if ("locator" in walletPanelPage) {
        await walletPanelPage.bringToFront().catch(() => {});
        await sleep(1000);
        await screenshot(
          walletPanelPage,
          artifactDir,
          "wallet-panel-before-unlock.png",
        );
        const unlockResult = await unlockWalletPanel(
          walletPanelPage,
          walletPasswordSecret.value,
        );
        const walletPanelState = {
          url: walletPanelPage.url(),
          title: await walletPanelPage.title(),
          unlockResult,
        };
        await writeJson(artifactDir, "wallet-panel-state.json", walletPanelState);
        await screenshot(
          walletPanelPage,
          artifactDir,
          "wallet-panel-after-unlock.png",
        );
        steps.push(
          unlockResult.unlocked
            ? "Unlocked the Brave wallet panel with the configured secret source."
            : `Wallet unlock attempt did not close the lock screen (${unlockResult.reason}).`,
        );

        if (!unlockResult.unlocked) {
          blocker =
            blocker ??
            `Wallet unlock failed: ${unlockResult.reason}.`;
        }
      } else {
        blocker =
          blocker ??
          `Detected wallet panel target ${walletPanelPage.url()} but could not attach a Playwright page handle to automate it.`;
      }
    }
  } finally {
    await browserSession.close();
  }

  const summary = summaryMarkdown({
    mode: MODE,
    browserVersion,
    expectations,
    secretSource: walletPasswordSecret.source,
    loadedPaths: envBootstrap.loadedPaths,
    blocker,
    steps,
  });

  await writeFile(resolve(artifactDir, "summary.md"), summary, "utf8");
  await writeJson(artifactDir, "summary.json", {
    mode: MODE,
    artifactDir,
    blocker,
    browserVersion: {
      Browser: browserVersion?.Browser ?? null,
      userAgent: browserVersion?.["User-Agent"] ?? null,
    },
    walletUiCapable: expectations.walletUiCapable,
    steps,
    loadedPaths: envBootstrap.loadedPaths,
    walletPasswordSource: walletPasswordSecret.source,
  });

  console.log(
    JSON.stringify(
      {
        status: blocker ? "blocked" : "ok",
        mode: MODE,
        artifactDir,
        blocker,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        name: error instanceof Error ? error.name : null,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
