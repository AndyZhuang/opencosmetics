// Test Annex II lookup (must be in app dir to find @duckdb/node-api)
const { DuckDBInstance } = require("@duckdb/node-api");
const path = require("path");

(async () => {
  const inst = await DuckDBInstance.create(path.join(process.cwd(), "data/bebd.duckdb"));
  const conn = await inst.connect();

  const r1 = await conn.runAndReadAll(`
    SELECT "Reference Number" AS ref, "Chemical name / INN" AS name
    FROM annex_ii_prohibited
    WHERE UPPER("Chemical name / INN") = 'HYDROQUINONE'
    LIMIT 3
  `);
  console.log("Exact match for HYDROQUINONE:");
  for (const row of r1.getRows()) {
    console.log(" ", row[0], "=>", JSON.stringify(row[1]));
  }

  const r2 = await conn.runAndReadAll(`
    SELECT "Reference Number" AS ref, "Chemical name / INN" AS name
    FROM annex_ii_prohibited
    WHERE UPPER("Chemical name / INN") LIKE '%HYDROQUINONE%'
    LIMIT 3
  `);
  console.log("\nLIKE match for HYDROQUINONE:");
  for (const row of r2.getRows()) {
    console.log(" ", row[0], "=>", JSON.stringify(row[1]));
  }

  const r3 = await conn.runAndReadAll(`
    SELECT "Reference Number" AS ref, "Chemical name / INN" AS name
    FROM annex_ii_prohibited
    WHERE UPPER("Chemical name / INN") LIKE '%BIFIDA%'
    LIMIT 3
  `);
  console.log("\nLIKE match for BIFIDA (old false positive):");
  for (const row of r3.getRows()) {
    console.log(" ", row[0], "=>", JSON.stringify(row[1]));
  }

  const r4 = await conn.runAndReadAll(`
    SELECT "Reference Number" AS ref, "Chemical name / INN" AS name
    FROM annex_ii_prohibited
    WHERE UPPER("Chemical name / INN") = 'HYDROQUINONE'
       OR 'HYDROQUINONE' = ANY(string_split(UPPER("Chemical name / INN"), ', '))
    LIMIT 3
  `);
  console.log("\nNew exact+split match for HYDROQUINONE:");
  for (const row of r4.getRows()) {
    console.log(" ", row[0], "=>", JSON.stringify(row[1]));
  }

  await inst.close();
})();
