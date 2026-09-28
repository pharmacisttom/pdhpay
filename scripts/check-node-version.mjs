const [major, minor] = process.versions.node
  .split(".")
  .map((part) => Number.parseInt(part, 10));

const supported =
  (major === 22 && minor >= 17) || major >= 24;

if (!supported) {
  console.error(
    [
      `Unsupported Node.js ${process.version}.`,
      "PDH Smart Payment requires Node.js >=22.17.0 <23 or >=24.",
      "On this workspace, prepend .tools\\node-v24.21.0-win-x64 to PATH before running npm.",
    ].join("\n"),
  );
  process.exit(1);
}
