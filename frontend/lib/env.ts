const fallbackApiBaseUrl = "http://127.0.0.1:8000/api";

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl;
}

export function getBackendBaseUrl() {
  const apiBaseUrl = getApiBaseUrl();
  return apiBaseUrl.endsWith("/api") ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
}

export function getWhatsAppNumber() {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
}
