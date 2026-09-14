import { google, type drive_v3 } from "googleapis";
import { loadAppConfig } from "../../config/env";
import type { DriveFileRef } from "./discovery";

// Google Drive access — service-account auth (see config/env.ts's
// loadGoogleDrive() and this project's final report for why: a service
// account can be granted read access simply by sharing the "Gold Sunday
// Read Output" folder with its email, exactly like sharing with a person.
// No OAuth consent screen, no refresh token to keep alive, no browser
// interaction ever required again — the credential is a long-lived JSON
// keypair that never expires on its own. drive.readonly scope only: this
// pipeline never writes to Drive.

export class DriveNotConfiguredError extends Error {
  constructor() {
    super(
      "Google Drive is not configured — set GOOGLE_DRIVE_FOLDER_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in apps/backend/.env."
    );
    this.name = "DriveNotConfiguredError";
  }
}

let cachedDrive: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (cachedDrive) return cachedDrive;
  const config = loadAppConfig().googleDrive;
  if (!config) throw new DriveNotConfiguredError();
  const auth = new google.auth.JWT({
    email: config.serviceAccountEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  cachedDrive = google.drive({ version: "v3", auth });
  return cachedDrive;
}

/** Drive query-string values must not contain an unescaped single quote — folderId is a deployment secret, not user input, but this is a cheap, harmless guard against a malformed `q` filter. */
function escapeForDriveQuery(value: string): string {
  return value.replace(/'/g, "\\'");
}

/** Lists every non-trashed file directly inside the configured Sunday Read Output folder (paginated). */
export async function listSundayReadDriveFiles(): Promise<DriveFileRef[]> {
  const config = loadAppConfig().googleDrive;
  if (!config) throw new DriveNotConfiguredError();
  const drive = getDriveClient();

  const files: DriveFileRef[] = [];
  let pageToken: string | undefined;
  do {
    const response = await drive.files.list({
      q: `'${escapeForDriveQuery(config.folderId)}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, modifiedTime)",
      pageSize: 100,
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

/** Downloads a Drive file's raw text content (used for both the JSON candidate and its companion Markdown reports). */
export async function downloadDriveFileText(fileId: string): Promise<string> {
  const drive = getDriveClient();
  const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "text" });
  return response.data as unknown as string;
}

/** Test-only escape hatch — mirrors this codebase's __reset*ForTests() convention (config/env.ts, db/pool.ts). */
export function __resetDriveClientForTests(): void {
  cachedDrive = null;
}
