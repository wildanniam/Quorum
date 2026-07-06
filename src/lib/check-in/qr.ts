import QRCode from "qrcode";

function publicAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!value) return null;

  return value.replace(/\/+$/, "");
}

export function checkInPathForToken(eventId: string, tokenId: string) {
  return `/check-in/${eventId}?token=${encodeURIComponent(tokenId)}`;
}

export function checkInQrPayload(eventId: string, tokenId: string) {
  const path = checkInPathForToken(eventId, tokenId);
  const appUrl = publicAppUrl();

  return appUrl ? `${appUrl}${path}` : path;
}

export async function createQrSvg(value: string) {
  return QRCode.toString(value, {
    color: {
      dark: "#0c0b0b",
      light: "#f4efe7",
    },
    errorCorrectionLevel: "M",
    margin: 1,
    type: "svg",
    width: 220,
  });
}
