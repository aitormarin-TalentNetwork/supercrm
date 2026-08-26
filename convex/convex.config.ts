import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";

// AIT-62: límite de solicitudes de reseteo de contraseña (ver
// convex/ResendOTPPasswordReset.ts). Primer componente registrado en este
// proyecto.
const app = defineApp();
app.use(rateLimiter);

export default app;
