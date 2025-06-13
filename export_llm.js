// scripts/export-llm.js
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputFile = path.join(__dirname, "..", "output_for_llm.txt");

function runGitList() {
  try {
    const raw = execSync("git ls-files", { encoding: "utf8" });
    const files = raw
      .split("\n")
      .filter(Boolean)
      .filter((file) => {
        return (
          !/^tests\//.test(file) &&
          !/\.(exe|dll|obj|bin|pdb|cache|log|md)$/.test(file) &&
          !/\.(jpg|jpeg|png|gif|bmp|ico|svg|webp|tiff)$/.test(file) &&
          !/(node_modules|packages|dist|build|target)\//.test(file) &&
          !/(\.vs|\.vscode|\.idea)\//.test(file) &&
          !/\.min\.(js|css)$/.test(file) &&
          !/\.git|\.DS_Store/.test(file) &&
          !/(package-lock\.json|yarn\.lock|npm-shrinkwrap\.json)$/.test(file) &&
          !/\.(csproj|sln|nuspec|nupkg)$/.test(file)
        );
      });
    return files;
  } catch (err) {
    console.error("Error running git ls-files:", err.message);
    process.exit(1);
  }
}

function writeOutput(files) {
  const sep = "===";
  const header = `--- START OF FILE output.txt ---\n\nFile list:\n`;
  fs.writeFileSync(
    outputFile,
    header + files.join("\n") + "\n\n" + sep + "\n\n",
    "utf8",
  );

  files.forEach((file, index) => {
    fs.appendFileSync(outputFile, `${file}\n`, "utf8");

    try {
      const content = fs.readFileSync(file, "utf8");
      fs.appendFileSync(outputFile, "\n" + content + "\n", "utf8");
    } catch (e) {
      fs.appendFileSync(
        outputFile,
        `\n[Error reading file: ${e.message}]\n`,
        "utf8",
      );
    }

    if (index !== files.length - 1) {
      fs.appendFileSync(outputFile, `\n${sep}\n\n`, "utf8");
    } else {
      fs.appendFileSync(outputFile, `\n`, "utf8");
    }
  });
}

const files = runGitList();

if (!files.length) {
  console.warn(
    "No files matched the criteria or no files are tracked by Git. Exiting.",
  );
  process.exit(0);
}

console.log(`Found ${files.length} matching files. Processing...`);
writeOutput(files);
console.log(`Done. Output written to ${outputFile}`);
