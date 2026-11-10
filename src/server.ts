import { app } from "./app";
import { env } from "./config/env";

import { connectDatabase, disconnectDatabase } from "./config/database";

import { connectFirebase } from "./config/firebase";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await connectFirebase();

    const server = app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });

    const shutdown = () => {
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Server startup failed:", error);
    await disconnectDatabase();
    process.exit(1);
  }
};

void startServer();
