const app = require("./app");
const envVar = require("./config/EnvVariable");
const connectDB = require("./config/Db");
const http = require("http");
const { initSocket } = require("./socket");
const initMinIO = require("./utils/initMinIO");

async function run() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize MinIO bucket
    await initMinIO();

    const server = http.createServer(app);

    initSocket(server);

    server.listen(envVar.PORT, () => {
      console.log(`Server listening on port ${envVar.PORT}`);
    });

  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

run();
