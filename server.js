const dotenv = require("dotenv");

dotenv.config();

const { createApp } = require("./src/app");
const { prisma } = require("./src/prisma");

const PORT = Number(process.env.PORT) || 3000;
const app = createApp({ prisma, env: process.env });

const server = app.listen(PORT, () => {
  console.log(`AshTech website running at http://localhost:${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing AshTech server.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
