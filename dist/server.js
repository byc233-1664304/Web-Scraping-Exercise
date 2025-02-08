"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
//import { getFirstListingSite } from './googleScraper';
const listingScraper_1 = require("./listingScraper");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/scrape', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Scrape request received");
    const query = req.query.q || "top home listing websites";
    const city = req.query.city || "Seattle, WA";
    try {
        // console.log(`Searching Google for ${query}`);
        // const listingSite = await getFirstListingSite(query);
        // if(!listingSite) {
        //     res.status(404).json({ error: "No home listing site found." });
        //     return;
        // }
        const listingSite = "https://www.zillow.com/";
        console.log(`Searching for homes in ${city}`);
        const searchResPage = yield (0, listingScraper_1.searchCityOnListingSite)(listingSite, city);
        if (!searchResPage) {
            res.status(404).json({ error: "No home listing site found." });
            return;
        }
        console.log(`Scraping property listings from ${searchResPage}`);
        const listings = yield (0, listingScraper_1.scrapeListingFromSearchRes)(searchResPage);
        if (listings.length === 0) {
            res.status(404).json({ error: "No property listings found." });
            return;
        }
        const jsonOutput = { listings };
        fs_1.default.writeFileSync("listings.json", JSON.stringify(jsonOutput, null, 2));
        console.log("Listings saved to listings.json");
        res.json(jsonOutput);
    }
    catch (err) {
        console.error("Scraping failed: ", err);
        res.status(500).json({ error: "Scraping failed", details: err });
    }
}));
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
