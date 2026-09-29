const [major, minor] = process.versions.node
  .split(".")
  .map((part) => Number.parseInt(part, 10));

const supported = (major === 22 && minor >= 17) || major >= 24;

if (!supported) {
  console.error(
    [
      `Unsupported Node.js ${process.version}.`,
      "PDH Smart Payment requires Node.js >=22.17.0 <23 or >=24.",
      "Install a supported Node.js release and ensure node/npm are available on PATH.",
    ].join("\n"),
  );
  process.exit(1);
}
