import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Metrics endpoint for live dashboard monitoring
http.route({
  path: "/dashboard-metrics",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token
    const authHeader = request.headers.get("Authorization");
    const expectedToken = process.env.METRICS_API_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const kpis = await ctx.runQuery(internal.metrics.getKpis, {});

      return new Response(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          kpis,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      console.error("Metrics query error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});


// Analytics endpoint for detailed user/feature data
http.route({
  path: "/dashboard-analytics",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get("Authorization");
    const expectedToken = process.env.METRICS_API_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const analytics = await ctx.runQuery(internal.analytics.getAnalytics, {});

      return new Response(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          ...analytics,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      console.error("Analytics query error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
