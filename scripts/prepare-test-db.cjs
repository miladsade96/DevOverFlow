// Downloads once into the standard user cache, before Vitest's startup timeout.
const { MongoBinary } = require("mongodb-memory-server-core");
MongoBinary.getPath({ version: "8.0.20" }).catch((error) => {
  console.error(
    "Could not prepare the disposable test database:",
    error.message,
  );
  process.exitCode = 1;
});
