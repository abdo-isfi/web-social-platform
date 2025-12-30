const app = require("./app");
const envVar = require("./config/EnvVariable");
const connectDB = require("./config/Db");
const http = require("http");
const { initSocket } = require("./socket");

async function run() {
  try {
    await connectDB();

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
