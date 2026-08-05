const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

app
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
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
