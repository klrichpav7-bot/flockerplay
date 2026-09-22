const http = require("http");

// Host under memory pressure can fail to allocate undici's llhttp WASM.
// Warm it up FIRST, before loading Next.js / Prisma, while memory is free.
// undici caches the parser instance after the first successful load, so a
// successful warmup prevents any later WASM allocation.
async function warmupLlhttp() {
  for (let attempt = 1; attempt <= 10; attempt++) {
    const srv = http.createServer((req, res) => res.end("ok"));
    await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
    const warmPort = srv.address().port;
    try {
      const resp = await fetch(`http://127.0.0.1:${warmPort}/`);
      await resp.text();
      console.log(`> llhttp warmup OK (attempt ${attempt})`);
      return;
    } catch (err) {
      console.error(`> llhttp warmup attempt ${attempt} failed: ${err.message}`);
    } finally {
      srv.close();
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  console.error("> llhttp warmup exhausted retries, continuing anyway");
}

process.on("uncaughtException", (err) => {
  if (err && /WebAssembly\.instantiate/.test(err.stack || "")) {
    console.error("> non-fatal wasm exception, continuing");
    return;
  }
  console.error("uncaughtException:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  if (reason && /WebAssembly\.instantiate/.test(reason.stack || "")) {
    console.error("> non-fatal wasm rejection, continuing");
    return;
  }
  console.error("unhandledRejection:", reason);
  process.exit(1);
});

console.log(`> server.js pid=${process.pid} started at ${new Date().toISOString()}`);
const siglog = (sig) => () => {
  console.error(`> signal ${sig} received at ${new Date().toISOString()}`);
  process.exit(0);
};
["SIGTERM", "SIGINT", "SIGHUP", "SIGUSR1", "SIGUSR2", "SIGPIPE", "SIGALRM"].forEach((sig) => {
  process.on(sig, siglog(sig));
});
process.on("beforeExit", (code) => {
  console.error(`> beforeExit code=${code} handles=${process._getActiveRequests?.().length ?? "?"} at ${new Date().toISOString()}`);
});
process.on("exit", (code) => {
  console.error(`> exit code=${code} at ${new Date().toISOString()}`);
});

warmupLlhttp()
  .catch(() => {})
  .then(() => {
    const { createServer } = require("http");
    const next = require("next");
    const { Server } = require("socket.io");
    const { PrismaClient } = require("@prisma/client");

    const dev = process.env.NODE_ENV !== "production";
    const port = parseInt(process.env.PORT || "3000", 10);

    const app = next({ dev });
    const handle = app.getRequestHandler();
    const prisma = new PrismaClient();

    return app
      .prepare()
      .then(() => {
        const server = createServer((req, res) => handle(req, res));

        const io = new Server(server, {
          path: "/api/socket",
          cors: { origin: "*", methods: ["GET", "POST"] },
        });

        globalThis.__io = io;

        io.on("connection", async (socket) => {
          const userId = socket.handshake?.auth?.userId;
          if (!userId) return socket.disconnect(true);

          let role = null;
          try {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, role: true, isBlocked: true },
            });
            if (!user || user.isBlocked) return socket.disconnect(true);
            role = user.role;
          } catch {
            return socket.disconnect(true);
          }

          if (role === "ROLE_ADMIN") {
            socket.join("admin");
          } else {
            socket.join(`user:${userId}`);
          }

          socket.on("support:typing", (data = {}) => {
            const payload = { userId, isTyping: true, from: role === "ROLE_ADMIN" ? "admin" : "user", ticketId: data.ticketId };
            if (role === "ROLE_ADMIN") {
              io.to(`user:${data.userId}`).emit("support:typing", payload);
            } else {
              io.to("admin").emit("support:typing", payload);
            }
          });

          socket.on("support:stopTyping", (data = {}) => {
            const payload = { userId, isTyping: false, from: role === "ROLE_ADMIN" ? "admin" : "user", ticketId: data.ticketId };
            if (role === "ROLE_ADMIN") {
              io.to(`user:${data.userId}`).emit("support:typing", payload);
            } else {
              io.to("admin").emit("support:typing", payload);
            }
          });
        });
        server.listen(port, (err) => {
          if (err) throw err;
          console.log(`> FlockerPlay ready on http://localhost:${port} (${dev ? "dev" : "prod"})`);
        });
      });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
