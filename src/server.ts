import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from "fs";
//import { getFirstListingSite } from './googleScraper';
import { startANewPage, searchCityOnListingSite, getPropertyLinks, extractPropertyDetails } from './listingScraper';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/scrape', async (req: Request, res: Response): Promise<void> => {
    console.log("Scrape request received");
    const query = req.query.q as string || "top home listing websites";
    const city = req.query.city as string || "Seattle, WA";

    try{
        // console.log(`Searching Google for ${query}`);
        // const listingSite = await getFirstListingSite(query);
        // if(!listingSite) {
        //     res.status(404).json({ error: "No home listing site found." });
        //     return;
        // }

        const listingSite = "https://www.zillow.com/";

        console.log(`Searching for homes in ${city}`);
        const searchResPage = await searchCityOnListingSite(listingSite, city);
        if(!searchResPage) {
            res.status(404).json({ error: "No home listing site found." });
            return;
        }

        console.log(`Scraping property listings from ${searchResPage}`);
        const { browser, page } = await startANewPage();
        const propertyLinks = await getPropertyLinks(searchResPage);

        if(propertyLinks.length === 0) {
            res.status(404).json({ error: "No property listings found." });
            return;
        }

        const listings = [];
        for(const propertyLink of propertyLinks) {
            console.log(`Scraping property: ${propertyLink}`);
            await page.goto(propertyLink, { waitUntil: "domcontentloaded" });

            const details = await extractPropertyDetails(page);

            const childPages = [];

            const baseUrl = "https://www.zillow.com";
            const childLinks = await page.$$eval("a", (anchors, base) => {
                return anchors
                    .map(a => a.getAttribute("href")) // Get raw href
                    .filter(href => href && !href.startsWith("#") && !href.startsWith("javascript")) // Remove invalid links
                    .map(href => href!.startsWith("/") ? new URL(href!, base).href : href) // Convert relative to absolute URLs
                    .filter(url => url!.includes("zillow.com/homedetails/"));
            }, baseUrl);

            console.log(`Found ${childLinks.length} child links`);

            for(const childLink of childLinks) {
                if(!childLink || !childLink.startsWith("http")) {
                    console.log(`Skipping invalid URL: ${childLink}`);
                    continue;
                }

                console.log(`Scraping child page: ${childLink}`);
                try{
                    await page.goto(childLink, { waitUntil: "domcontentloaded" });

                    const content = await page.evaluate(() => document.body.innerText.slice(0, 500)); // Extract page content
                    childPages.push({ url: childLink, content });
                }catch(err) {
                    console.warn(`Failed to load ${childLink}`);
                }
            }

            listings.push({ url: propertyLink, details, childPages });
        }

        await browser.close();

        const jsonOutput = { listings };
        fs.writeFileSync("listings.json", JSON.stringify(jsonOutput, null, 2));
        console.log("Listings saved to listings.json");

        res.json(jsonOutput);
    }catch(err) {
        console.error("Scraping failed: ", err);
        res.status(500).json({ error: "Scraping failed", details: err });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
