import { showToast, Toast } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { writeFile } from "node:fs/promises";

export async function saveTextWithDialog(text: string, defaultFileName: string): Promise<void> {
  try {
    const path = await runAppleScript<string>(
      `
      set defaultName to item 1 of argv
      set chosenFile to choose file name with prompt "Save linted text as:" default name defaultName
      POSIX path of chosenFile
      `,
      [defaultFileName || "linted-text.md"],
      { timeout: 0 },
    );

    const normalizedPath = path.trim();
    if (!normalizedPath) {
      return;
    }

    await writeFile(normalizedPath, text, "utf8");
    await showToast({ style: Toast.Style.Success, title: "Saved File", message: normalizedPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("User canceled")) {
      return;
    }
    await showToast({ style: Toast.Style.Failure, title: "Could Not Save File", message });
  }
}
