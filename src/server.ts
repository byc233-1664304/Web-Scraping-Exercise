import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from "fs";
//import { getFirstListingSite } from './googleScraper';
import { searchCityOnListingSite, scrapeListingFromSearchRes } from './listingScraper';

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
        const listings = await scrapeListingFromSearchRes(searchResPage);

        if(listings.length === 0) {
            res.status(404).json({ error: "No property listings found." });
            return;
        }

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
