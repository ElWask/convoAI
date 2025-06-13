import fs from "fs";
import chalk from "chalk";
import { execSync } from "child_process";

const OUTPUT_FILE = "output_for_llm.txt";

const shouldIncludeFile = (file) => {
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
};

const runGitList = () => {
  try {
    const raw = execSync("git ls-files", { encoding: "utf8" });
    const files = raw.split("\n").filter(Boolean).filter(shouldIncludeFile);
    return files;
  } catch (err) {
    console.error(chalk.red("❌ Error running git ls-files:", err.message));
    process.exit(1);
  }
};

const writeOutput = (files) => {
  const sep = "===";
  const header = `--- START OF FILE ${OUTPUT_FILE} ---\n\nFile list:\n`;
  fs.writeFileSync(
    OUTPUT_FILE,
    header + files.join("\n") + "\n\n" + sep + "\n\n",
    "utf8",
  );

  files.forEach((file, index) => {
    fs.appendFileSync(OUTPUT_FILE, `${file}\n`, "utf8");

    try {
      const content = fs.readFileSync(file, "utf8");
      fs.appendFileSync(OUTPUT_FILE, "\n" + content + "\n", "utf8");
    } catch (e) {
      fs.appendFileSync(
        OUTPUT_FILE,
        `\n[Error reading file: ${e.message}]\n`,
        "utf8",
      );
    }

    if (index !== files.length - 1) {
      fs.appendFileSync(OUTPUT_FILE, `\n${sep}\n\n`, "utf8");
    } else {
      fs.appendFileSync(OUTPUT_FILE, `\n`, "utf8");
    }
  });
};

const main = async () => {
  console.log("Getting file list...");
  let files = [];
  try {
    files = runGitList();
    console.log(chalk.green(`✅ Found ${files.length} files`));
  } catch (err) {
    console.error(chalk.red("❌ Failed to get files:", err.message));
  }

  if (!files.length) {
    console.warn(
      chalk.yellow(
        "⚠️ No files matched the criteria or no files are tracked by Git. Exiting.",
      ),
    );
    process.exit(0);
  }

  console.log(chalk.blue("Processing..."));
  writeOutput(files);
  console.log(chalk.green(`✅ Done. Output written to ${OUTPUT_FILE}`));
};

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
