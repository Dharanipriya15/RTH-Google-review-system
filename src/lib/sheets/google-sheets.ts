import "server-only";

import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { getServerEnv } from "@/lib/env";

/** True when GOOGLE_SHEETS_SPREADSHEET_ID, _CLIENT_EMAIL and _PRIVATE_KEY are all set. */
export function isGoogleSheetsConfigured(): boolean {
  return getServerEnv().googleSheets !== null;
}

export interface FeedbackRowInput {
  rating: number;
  customerName: string | undefined;
  customerPhone: string | undefined;
  customerEmail: string | undefined;
  message: string | undefined;
  submittedAt: Date;
}

/**
 * Appends one row to the configured Google Sheet for a 1–3★ submission.
 * Throws when Sheets is not configured or the API call fails — callers must
 * treat that as a hard failure, never as a silent success.
 */
export async function appendFeedbackRow(
  input: FeedbackRowInput,
): Promise<{ rowNumber: number }> {
  const config = getServerEnv().googleSheets;
  if (!config) {
    throw new Error(
      "Google Sheets is not configured: set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY.",
    );
  }

  const auth = new JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(config.spreadsheetId, auth);
  await doc.loadInfo();

  const sheet = config.sheetName ? doc.sheetsByTitle[config.sheetName] : doc.sheetsByIndex[0];
  if (!sheet) {
    throw new Error(
      config.sheetName
        ? `Google Sheets tab "${config.sheetName}" was not found in the configured spreadsheet.`
        : "The configured Google Sheet has no tabs.",
    );
  }

  // Column names must match the sheet's existing header row exactly:
  // Rating | Name | Phone | Customer Email | Message | Created At
  const row = await sheet.addRow({
    Rating: input.rating,
    Name: input.customerName ?? "",
    Phone: input.customerPhone ?? "",
    "Customer Email": input.customerEmail ?? "",
    Message: input.message ?? "",
    "Created At": input.submittedAt.toISOString(),
  });

  return { rowNumber: row.rowNumber };
}
