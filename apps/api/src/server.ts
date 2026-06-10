import { buildApp } from "./app.js";

const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({
      port: app.env.PORT,
      host: "0.0.0.0",
    });

    app.log.info(`Addressor API running on port ${app.env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();