import { createApiServer } from "./server.js";

const port = Number(process.env.PORT ?? 3001);
const server = createApiServer();

server.listen(port, () => {
  process.stdout.write(`xstocks api listening on http://localhost:${port}\n`);
});
