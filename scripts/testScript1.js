import puppeteer from "puppeteer";

export async function loginToCivcastUsa() {
  console.log("Logging into CivCast USA");
  console.log("Opening browser...");
  console.log(process.env.USERNAME, process.env.PASSWORD);
}
