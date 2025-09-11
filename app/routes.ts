import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/api/search/:query", "routes/api/search/index.ts"),
] satisfies RouteConfig;
