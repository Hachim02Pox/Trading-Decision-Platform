import { google, type drive_v3 } from "googleapis";
import { loadAppConfig } from "../../config/env";
import type { DriveFileRef } from "./discovery";
import type { ControlReader } from "./control";

// Google Drive access for the unified Gold market-state pipeline (Sunday
// Reads V2/V3 + intermediate recaps) — reuses the SAME service-account
// credentials as apps/backend/src/sundayRead/ingestion/driveClient.ts
// (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY), only
// the target folder id differs (loadAppConfig().goldDrive.outputFolderId,
// which itself defaults to GOOGLE_DRIVE_FOLDER_ID — see config/env.ts). This
// keeps a single Drive credential/grant for the whole Gold pipeline rather
// than provisioning a second service account. drive.readonly scope only:
// this pipeline never writes to Drive, and never reads the separate "Gold
// Sunday Read Control" folder (NEXT_GOLD_RECAP.json is operational state for
// ChatGPT Work only, per GOLD_NEXT_RECAP_HANDOFF_SPEC.md §8).

export class GoldDriveNotConfiguredError extends Error {
  constructor() {
    super(
      "Gold Drive output is not configured — set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY and either GOLD_OUTPUT_FOLDER_ID or GOOGLE_DRIVE_FOLDER_ID in apps/backend/.env."
    );
    this.name = "GoldDriveNotConfiguredError";
  }
}

let cachedDrive: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (cachedDrive) return cachedDrive;
  const auth0 = loadAppConfig().googleDrive;
  if (!auth0) throw new GoldDriveNotConfiguredError();
  const auth = new google.auth.JWT({
    email: auth0.serviceAccountEmail,
    key: auth0.privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  cachedDrive = google.drive({ version: "v3", auth });
  return cachedDrive;
}

function escapeForDriveQuery(value: string): string {
  return value.replace(/'/g, "\\'");
}

/** Lists every non-trashed file directly inside the configured Gold Output folder (paginated). */
export async function listGoldOutputDriveFiles(): Promise<DriveFileRef[]> {
  const auth = loadAppConfig().googleDrive;
  const gold = loadAppConfig().goldDrive;
  if (!auth || !gold) throw new GoldDriveNotConfiguredError();
  const drive = getDriveClient();

  const files: DriveFileRef[] = [];
  let pageToken: string | undefined;
  do {
    const response = await drive.files.list({
      q: `'${escapeForDriveQuery(gold.outputFolderId)}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, modifiedTime)",
      pageSize: 200,
      pageToken,
    });
    for (const file of response.data.files ?? []) {
      if (file.id && file.name && file.modifiedTime) {
        files.push({ id: file.id, name: file.name, modifiedTime: file.modifiedTime });
      }
    }
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

/** Downloads a Drive file's raw text content. */
export async function downloadGoldDriveFileText(fileId: string): Promise<string> {
  const drive = getDriveClient();
  const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "text" });
  return response.data as unknown as string;
}

/** Read-only Control plane reader. Listing is paginated and scoped to
 * run_records; publication code must treat any Drive error as a refusal. */
export function createGoldControlReader(): ControlReader {
  const config = loadAppConfig();
  if (!config.googleDrive || !config.goldDrive) throw new GoldDriveNotConfiguredError();
  const drive = getDriveClient();
  const listFolder = async (folderId: string): Promise<DriveFileRef[]> => {
    const files: DriveFileRef[] = []; let pageToken: string | undefined;
    do {
      const response = await drive.files.list({ q: `'${escapeForDriveQuery(folderId)}' in parents and trashed = false`, fields: "nextPageToken, files(id, name, modifiedTime)", pageSize: 200, pageToken });
      for (const file of response.data.files ?? []) if (file.id && file.name && file.modifiedTime) files.push({ id: file.id, name: file.name, modifiedTime: file.modifiedTime });
      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);
    return files;
  };
  return {
    listRunRecords: () => listFolder(config.goldDrive!.runRecordsFolderId),
    downloadText: downloadGoldDriveFileText,
    async readCurrentHandoff(): Promise<unknown> { return JSON.parse(await downloadGoldDriveFileText(config.goldNextRecap?.fileId ?? "1vjvIgPV7umsbaCiuUdyxu6R980zg_dsU")); },
  };
}

/** Test-only escape hatch — mirrors the codebase's __reset*ForTests() convention. */
export function __resetGoldDriveClientForTests(): void {
  cachedDrive = null;
}
