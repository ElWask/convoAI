# Output file path
$outputFile = "output_for_llm.txt"

# Ensure Git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git command not found. Please ensure Git is installed and in your PATH."
    exit 1
}

# Get files from git and filter them
Write-Host "Getting files from git..."
$files = git ls-files | Where-Object {
    $_ -notmatch '^tests/' -and
    $_ -notmatch '\.(exe|dll|obj|bin|pdb|cache|log|md)$' -and
    $_ -notmatch '\.(jpg|jpeg|png|gif|bmp|ico|svg|webp|tiff)$' -and
    $_ -notmatch '(node_modules|packages|dist|build|target)/' -and
    $_ -notmatch '(\.vs|\.vscode|\.idea)/' -and
    $_ -notmatch '\.(min\.js|min\.css)$' -and
    $_ -notmatch '(\.git|\.DS_Store)' -and
    $_ -notmatch '(package-lock\.json|yarn\.lock|npm-shrinkwrap\.json)$' -and
    $_ -notmatch '\.(csproj|sln|nuspec|nupkg)$'
} | Sort-Object

if (-not $files) {
    Write-Warning "No files matched the criteria or no files are tracked by Git. Exiting."
    exit
}

Write-Host "Found $($files.Count) files matching criteria."

# Create the output file with the header
"--- START OF FILE output.txt ---" | Set-Content -Path $outputFile -Encoding UTF8
"" | Add-Content -Path $outputFile -Encoding UTF8
"File list:" | Add-Content -Path $outputFile -Encoding UTF8 # Changed header slightly

# --- Add the flat list of file paths ---
foreach ($file in $files) {
    # Normalize path separators for consistency in the list (optional)
    $normalizedPath = $file.Replace('\', '/')
    Add-Content -Path $outputFile -Value $normalizedPath -Encoding UTF8
}
# --- End of file list section ---

# Add delimiter before code blocks
"" | Add-Content -Path $outputFile -Encoding UTF8
"===" | Add-Content -Path $outputFile -Encoding UTF8
"" | Add-Content -Path $outputFile -Encoding UTF8

# Add each file's content
$fileCounter = 0
$totalFiles = $files.Count
foreach ($file in $files) {
    $fileCounter++
    Write-Progress -Activity "Adding file content" -Status "Processing $file ($fileCounter/$totalFiles)" -PercentComplete (($fileCounter / $totalFiles) * 100)

    # Write the filename header
    Add-Content -Path $outputFile -Value $file -Encoding UTF8

    # Get the file content
    try {
        if (Test-Path $file -PathType Leaf) {
            $fileContent = Get-Content $file -Raw -Encoding UTF8 -ErrorAction Stop
            Add-Content -Path $outputFile -Value "" -Encoding UTF8 # Blank line before content
            Add-Content -Path $outputFile -Value $fileContent -Encoding UTF8
        } else {
            Write-Warning "File listed by git not found on disk: '$file'"
            Add-Content -Path $outputFile -Value "" -Encoding UTF8 # Blank line before message
            Add-Content -Path $outputFile -Value "[File not found on disk]" -Encoding UTF8
        }
    } catch {
        Write-Warning "Error reading file '$file': $($_.Exception.Message)"
        Add-Content -Path $outputFile -Value "" -Encoding UTF8 # Blank line before message
        Add-Content -Path $outputFile -Value "[Error reading file content: $($_.Exception.Message)]" -Encoding UTF8
    }

    # Add separator for the next file
    if ($fileCounter -lt $totalFiles) {
        Add-Content -Path $outputFile -Value "" -Encoding UTF8 # Blank line before separator
        Add-Content -Path $outputFile -Value "===" -Encoding UTF8
        Add-Content -Path $outputFile -Value "" -Encoding UTF8 # Blank line after separator
    } else {
        # Add a final newline after the last file's content
        Add-Content -Path $outputFile -Value "" -Encoding UTF8
    }
}

Write-Progress -Activity "Adding file content" -Completed
Write-Host "Processing complete. Output written to $outputFile"