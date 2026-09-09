const http = require("http");

async function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, text: data });
        } catch {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on("error", (err) => reject(err));

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testRouteStatus(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        const hasChunkError = body.includes("ChunkLoadError");
        const hasException = body.includes("Application error: a client-side exception has occurred");
        resolve({
          path,
          status: res.statusCode,
          ok: res.statusCode === 200 && !hasChunkError && !hasException,
          hasChunkError,
          hasException,
        });
      });
    }).on("error", (err) => {
      resolve({ path, status: 500, ok: false, error: err.message });
    });
  });
}

async function runAllTests() {
  console.log("==================================================");
  console.log("SENTINALX PRODUCTION PIPELINE & DATABASE AUDIT");
  console.log("==================================================");

  const results = {};

  // 1. Submit field report
  console.log("\n[TEST 1] Submitting Citizen Field Report...");
  const reportPayload = {
    hazardType: "Landslide",
    locationName: "Tawang Sector, Near Monastery Switchback",
    latitude: 27.589,
    longitude: 91.865,
    severity: 4,
    description: "Active rockfall debris accumulation across single lane near switchback 3. Verified by field observer.",
  };
  const createReportRes = await fetchJson("http://localhost:3000/api/reports", {
    method: "POST",
    body: reportPayload,
  });
  console.log("Status:", createReportRes.status, "Response:", createReportRes.data);
  const createdReportId = createReportRes.data?.reportId;
  results.reportCreated = createReportRes.status === 201 && Boolean(createdReportId);

  // 2. Fetch Report History
  console.log("\n[TEST 2] Verifying Report History Listing...");
  const reportsRes = await fetchJson("http://localhost:3000/api/reports");
  const reportsList = reportsRes.data?.data || [];
  const foundReport = reportsList.find((r) => r.reportId === createdReportId);
  console.log(`Found report in registry: ${foundReport ? "YES (" + foundReport.reportId + ")" : "NO"}`);
  results.reportHistory = Boolean(foundReport);

  // 3. Fetch Report Details
  console.log(`\n[TEST 3] Fetching Single Report Details (${createdReportId})...`);
  const singleReportRes = await fetchJson(`http://localhost:3000/api/reports/${createdReportId}`);
  console.log("Report Details Status:", singleReportRes.status, "History entries:", singleReportRes.data?.history?.length);
  results.reportDetails = singleReportRes.status === 200 && singleReportRes.data?.reportId === createdReportId;

  // 4. Update Report Status to VERIFIED
  console.log(`\n[TEST 4] Updating Report Status to VERIFIED (${createdReportId})...`);
  const updateStatusRes = await fetchJson(`http://localhost:3000/api/reports/${createdReportId}/status`, {
    method: "PATCH",
    body: {
      verificationStatus: "VERIFIED",
      responseStatus: "VERIFIED",
      statusMessage: "Cross-verified with geotechnical inclinometer array.",
    },
  });
  console.log("Update Status:", updateStatusRes.status, "Message:", updateStatusRes.data?.message);
  
  // 5. Verify status persists on reload
  console.log(`\n[TEST 5] Verifying VERIFIED Status Persists After Refresh...`);
  const verifyPersistRes = await fetchJson(`http://localhost:3000/api/reports/${createdReportId}`);
  const currentStatus = verifyPersistRes.data?.data?.responseStatus || verifyPersistRes.data?.data?.verificationStatus;
  console.log("Persisted Status:", currentStatus);
  results.reportStatusPersisted = currentStatus === "VERIFIED";

  // 6. Sensor Ingestion
  console.log("\n[TEST 6] Ingesting Sensor Telemetry...");
  const sensorIngestRes = await fetchJson("http://localhost:3000/api/sensors/ingest", {
    method: "POST",
    body: {
      sensorId: "SENSOR-TW-01",
      stationName: "Tawang Pass Surface Inclinometer Node Alpha",
      soilMoisture: 86.4,
      porePressure: 44.2,
      tiltAngle: 6.8,
      rainfall: 39.5,
      status: "ONLINE",
    },
  });
  console.log("Sensor Ingest Status:", sensorIngestRes.status, "Ingested:", sensorIngestRes.data?.telemetrySummary);
  results.sensorIngest = sensorIngestRes.status === 201;

  // 7. Latest Sensor Query
  console.log("\n[TEST 7] Querying Latest Sensor Reading...");
  const latestSensorRes = await fetchJson("http://localhost:3000/api/sensors/latest?location=Tawang");
  console.log("Latest Sensor Status:", latestSensorRes.status, "Reading:", latestSensorRes.data?.data?.sensorId);
  results.sensorLatest = latestSensorRes.status === 200;

  // 8. Risk Assessment Generation & Persistence
  console.log("\n[TEST 8] Triggering Risk Computation and Persistence...");
  const riskRes = await fetchJson("http://localhost:3000/api/risk?location=tawang");
  console.log("Risk Score:", riskRes.data?.result?.score, "Level:", riskRes.data?.result?.level);
  
  console.log("\n[TEST 9] Querying Latest Risk Assessment from Table...");
  const latestRiskRes = await fetchJson("http://localhost:3000/api/risk/latest?location=tawang");
  console.log("Latest Risk Table Entry:", latestRiskRes.data?.data?.score, latestRiskRes.data?.data?.level);
  results.riskAssessmentPersisted = Boolean(latestRiskRes.data?.data?.score != null);

  // 10. Alert Creation & Persistence
  console.log("\n[TEST 10] Creating and Persisting Emergency Alert...");
  const alertCreateRes = await fetchJson("http://localhost:3000/api/alerts", {
    method: "POST",
    body: {
      type: "LANDSLIDE_RISK",
      severity: "HIGH",
      title: "High Landslide Threat • Tawang Sector",
      message: "High landslide risk detected on NH-13 Km 4 corridor. Elevated pore water pressure detected.",
      locationName: "Tawang Sector",
      latitude: 27.586,
      longitude: 91.859,
      riskScore: 78.4,
      riskLevel: "HIGH",
      primaryThreat: "Moisture Infiltration on Hill Slopes",
      triggeredBy: ["Rainfall > 35mm/24h", "Pore Pressure > 40 kPa", "Citizen Verified Report"],
    },
  });
  console.log("Alert Create Status:", alertCreateRes.status, "Alert ID:", alertCreateRes.data?.data?.id);
  results.alertCreated = alertCreateRes.status === 201 && Boolean(alertCreateRes.data?.data?.id);

  // 11. Query Notification Deliveries
  console.log("\n[TEST 11] Verifying Multi-Channel Notification Deliveries...");
  const deliveriesRes = await fetchJson("http://localhost:3000/api/notifications");
  const deliveriesList = deliveriesRes.data?.data || [];
  console.log("Deliveries count:", deliveriesList.length);
  deliveriesList.slice(0, 3).forEach((d) => {
    console.log(`  - Channel: ${d.channel} | Status: ${d.status} | Recipient: ${d.recipient}`);
  });
  results.notificationsPersisted = deliveriesList.length > 0;

  // 12. AI Risk Explainer Service
  console.log("\n[TEST 12] Testing AI Risk Explainer Endpoint...");
  const aiRes = await fetchJson("http://localhost:3000/api/ai/risk-explanation?location=Tawang%20Sector&score=78.4&level=HIGH");
  console.log("AI Provider Status:", aiRes.data?.data?.provider, "| Available:", aiRes.data?.data?.available);
  console.log("AI Message:", aiRes.data?.data?.explanation);
  results.aiExplainerHonest = Boolean(aiRes.data?.data?.explanation);

  // 13. Route Status Audit
  console.log("\n[TEST 13] Verifying All 13 User-Facing Pages in Production...");
  const routesToTest = [
    "/",
    "/map",
    "/routes",
    "/shelters",
    "/alerts",
    "/alerts/sms",
    "/alerts/history",
    "/alerts/notifications",
    "/report",
    "/report/history",
    `/report/track?id=${createdReportId}`,
    "/emergency",
    "/authority",
  ];

  let allRoutesPass = true;
  for (const r of routesToTest) {
    const routeRes = await testRouteStatus(r);
    console.log(`  ${routeRes.ok ? "✓" : "✗"} ${r} -> Status ${routeRes.status} (ChunkLoadError: ${routeRes.hasChunkError})`);
    if (!routeRes.ok) allRoutesPass = false;
  }
  results.allRoutesPass = allRoutesPass;

  console.log("\n==================================================");
  console.log("TEST SUMMARY RESULTS:", results);
  console.log("==================================================");
}

runAllTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
