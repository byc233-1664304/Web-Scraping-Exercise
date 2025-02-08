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
exports.getFirstListingSite = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
// Did not use this in server.ts because this cannot bypass the bot detection of Google
// May need to use playwright instead of puppeteer or use Google search API such as 
// serpapi to resolve this.
function getFirstListingSite(searchQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const proxyServer = "http://72.10.160.94:17103";
        const browser = yield puppeteer_extra_1.default.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox", `--proxy-server=${proxyServer}`] // Fix permission issues
        });
        const page = yield browser.newPage();
        yield page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36");
        // Go to google
        yield page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });
        // Bypassing consent page
        const consentButton = yield page.$('button[aria-label="Accept all"]');
        if (consentButton) {
            yield consentButton.click();
            yield new Promise(resolve => setTimeout(resolve, 3000));
        }
        // Mimic human behavior to bypass bot detection
        yield page.mouse.move(Math.floor(Math.random() * 500), Math.floor(Math.random() * 500));
        yield page.evaluate(() => window.scrollBy(0, window.innerHeight));
        yield new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));
        // Enter the search query
        yield page.type('input[name="q"]', searchQuery);
        yield page.keyboard.press("Enter");
        // Wait for results to load
        yield page.waitForSelector("h3");
        // Get the first search result link
        const firstRes = yield page.$("h3");
        if (firstRes) {
            yield firstRes.click();
            yield page.waitForNavigation();
            const url = page.url();
            console.log(`The first (chosen) site is ${url}`);
            yield browser.close();
            return url;
        }
        yield browser.close();
        return null;
    });
}
exports.getFirstListingSite = getFirstListingSite;
