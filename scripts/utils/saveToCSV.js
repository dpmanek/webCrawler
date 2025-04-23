// utils/saveToCSV.js
import fs from "fs";
import path from "path";
import { parse } from "json2csv";

export function saveToCSV(data, filename, append = false, fields = null) {
  if (!data || data.length === 0) {
    console.log("No data provided to save.");
    return;
  }

  const filePath = path.join(process.cwd(), "output", filename);
  const csv = parse(data, {
    header: !append,
    fields: fields || Object.keys(data[0]),
  });

  try {
    if (append && fs.existsSync(filePath)) {
      fs.appendFileSync(filePath, `\n${csv}`, "utf8");
    } else {
      fs.writeFileSync(filePath, csv, "utf8");
    }
    console.log(`✅ Saved: ${filePath}`);
  } catch (error) {
    console.error("❌ Error saving CSV file:", error);
  }
}
