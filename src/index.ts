import { getFirstListingSite } from "./googleScraper";
import { searchCityOnListingSite, getPropertyLinks, extractPropertyDetails } from "./listingScraper";
import puppeteer from "puppeteer";
import fs from "fs";

// (async () => {
//     const query = "top home listing websites";
//     const city = "Seattle";

//     // Get home listing site dynamically
//     console.log(`Searching Google for ${query}`);
//     const listingSite = await getFirstListingSite(query);
//     if(!listingSite) {
//         console.error("No home listing site found.");
//         return;
//     }

//     // Search for homes in the City
//     const searchResPage = await searchCityOnListingSite(listingSite, city);
//     if(!searchResPage) {
//         console.error("Failed to get city search result page.");
//         return;
//     }

//     // Start Puppeteer for property scraping
//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();

//     // Get property listings dynamically
//     console.log(`Getting property listings from ${searchResPage}`);
//     const propertyLinks = await getPropertyLinks(searchResPage);
//     if(propertyLinks.length === 0) {
//         console.error("No property listings found.");
//         await browser.close();
//         return;
//     }

//     // Extract home details from each listing
//     const listings = []
//     for(const propertyLink of propertyLinks) {
//         console.log(`Scraping property: ${propertyLink}`);
//         await page.goto(propertyLink, { waitUntil: "domcontentloaded" });

//         const details = await extractPropertyDetails(page);
        
//         // Scrape Child Pages
//         const childPages = [];
//         const childLinks = await page.$$eval("a", anchors =>
//             anchors.map(a => a.href)
//         );

//         for(const childLink of childLinks) {
//             console.log(`Scraping child page: ${childLink}`);
//             await page.goto(childLink, { waitUntil: "domcontentloaded" });

//             const content = await page.evaluate(() => document.body.innerText.slice(0, 500)); // Extract page content
//             childPages.push({ url: childLink, content });
//         }

//         listings.push({ url: propertyLink, details, childPages });
//     }

//     // Save Listings as JSON
//     const jsonOutput = { listings };
//     fs.writeFileSync("listings.json", JSON.stringify(jsonOutput, null, 2));
//     console.log("Listings saved to listings.json");

//     await browser.close();
// })();