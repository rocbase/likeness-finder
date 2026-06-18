export function hasOpenAI() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function hasFaceCheck() {
  return Boolean(process.env.FACECHECK_API_KEY);
}

export function hasSerpApi() {
  return Boolean(process.env.SERPAPI_KEY);
}

export function hasYandex() {
  return Boolean(process.env.YANDEX_SEARCH_API_KEY);
}

export function allowDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export function getCompreFaceUrl() {
  return process.env.COMPREFACE_URL ?? "http://localhost:8000";
}

export function getCompreFaceApiKey() {
  return process.env.COMPREFACE_API_KEY ?? "";
}

export function getNudeNetUrl() {
  return process.env.NUDENET_URL ?? "http://localhost:5001";
}

export function isNudeNetEnabled() {
  return process.env.NUDENET_ENABLED !== "false";
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}