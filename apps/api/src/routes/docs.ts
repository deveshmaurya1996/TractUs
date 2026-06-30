import express from "express";
import swaggerUi from "swagger-ui-express";
import { resolveApiPublicUrl } from "../lib/apiPublicUrl";
import { buildOpenApiSpec } from "../openapi/spec";

const router = express.Router();

router.get("/openapi.json", (req, res) => {
  const spec = buildOpenApiSpec(resolveApiPublicUrl(req));
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(spec, null, 2));
});

router.use("/docs", swaggerUi.serve);
router.get("/docs", (req, res, next) => {
  const spec = buildOpenApiSpec(resolveApiPublicUrl(req));
  swaggerUi.setup(spec, { customSiteTitle: "Tract-Us API" })(req, res, next);
});

export default router;
