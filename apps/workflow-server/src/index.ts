import express from "express";
import { workflowsRouter } from "./routes/workflows.js";
import { executionsRouter } from "./routes/executions.js";
import { registryRouter } from "./routes/registry.js";
import { polymarketRouter } from "./routes/polymarket.js";
import { tokensRouter } from "./routes/tokens.js";
import { walletRouter } from "./routes/wallet.js";
import { initDb } from "./db/client.js";
import { startScheduler } from "./engine/scheduler.js";

const app = express();
app.use(express.json());

app.use("/api/workflows", workflowsRouter);
app.use("/api", executionsRouter);
app.use("/api/registry", registryRouter);
app.use("/api/polymarket", polymarketRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/wallet", walletRouter);

const PORT = 3001;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startScheduler();
  });
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
