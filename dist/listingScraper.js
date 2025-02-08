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
exports.scrapeListingFromSearchRes = exports.searchCityOnListingSite = exports.autoScroll = exports.startANewPage = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_1 = require("puppeteer");
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const puppeteer_extra_plugin_anonymize_ua_1 = __importDefault(require("puppeteer-extra-plugin-anonymize-ua"));
const stealth = (0, puppeteer_extra_plugin_stealth_1.default)();
stealth.enabledEvasions.delete("chrome.runtime");
stealth.enabledEvasions.delete("navigator.webdriver");
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_anonymize_ua_1.default)());
const proxies = [
    "http://44.195.247.145:80",
    "http://3.21.101.158:3128"
];
const proxyServer = proxies[Math.floor(Math.random() * proxies.length)];
// export async function debugPuppeteer() {
//     try {
//         console.log("Launching Puppeteer...");
//         const browser = await puppeteer.launch({ headless: false });
//         console.log("Puppeteer launched successfully!");
//         const page = await browser.newPage();
//         console.log("Opening Google to check Puppeteer is working...");
//         await page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });
//         console.log("Puppeteer is working! Closing browser...");
//         await browser.close();
//     } catch (error) {
//         console.error("Puppeteer failed to start:", error);
//     }
// }
function startANewPage() {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_extra_1.default.launch({
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless: false,
            args: [
                '--user-data-dir=/tmp/chrome-user-data-' + Math.random(),
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-infobars",
                "--ignore-certificate-errors", // Ignore SSL Error
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process"
            ]
        });
        const page = yield browser.newPage();
        yield page.setRequestInterception(true);
        page.on('request', (req) => {
            const blockedResources = ['analytics', 'tracking', 'ads', 'perimeterx', 'captcha', 'px.gif', 'px.js', 'px.captcha', 'px.init.js'];
            if (blockedResources.some(resource => req.url().includes(resource))) {
                //console.log(`Blocking PerimeterX request: ${req.url()}`);
                req.abort();
            }
            else {
                req.continue();
            }
        });
        yield page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, "webdriver", { get: () => false });
            Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
            Object.defineProperty(navigator, "platform", { get: () => "Win32" });
            Object.defineProperty(navigator.connection, "rtt", { get: () => 50 });
            Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
            Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 });
        });
        yield page.deleteCookie(...yield page.cookies());
        const userAgents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        ];
        yield page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
        yield page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.google.com/",
            "Upgrade-Insecure-Requests": "1",
            "X-Requested-With": "XMLHttpRequest",
            "Accept-Encoding": "gzip, deflate, br"
        });
        return { browser, page };
    });
}
exports.startANewPage = startANewPage;
function slowNav(page, url) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Navigating to ${url} slowly...`);
        yield page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
        // Add random scroll & delays
        for (let i = 0; i < 3; i++) {
            yield page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
            yield new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 3000));
        }
        console.log("Navigation complete.");
    });
}
function detectBotProtection(page) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Checking for Zillow's bot detection...");
        const isCaptchaPage = yield page.evaluate(() => {
            return document.body.innerText.includes("Press & Hold") ||
                !!document.querySelector("iframe") ||
                !!document.querySelector('script[src*="perimeterx"]') ||
                !!document.querySelector('script[src*="captcha"]');
        });
        if (isCaptchaPage) {
            console.warn("Zillow is applying PerimeterX bot protection!");
            return true;
        }
        else {
            console.log("No PerimeterX bot protection detected.");
            return false;
        }
    });
}
const moveMouseRandomly = (page) => __awaiter(void 0, void 0, void 0, function* () {
    for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * 500) + 50;
        const y = Math.floor(Math.random() * 500) + 50;
        yield page.mouse.move(x, y, { steps: 20 });
        yield new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 500) + 300));
    }
});
function solvePressNHoldWithTab(page) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("'Press & Hold' is likely to appear. Waiting to solve...");
        moveMouseRandomly(page);
        // Wait 3s - 5s before starting to press
        yield new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));
        // Use tab to find the button
        page.keyboard.press("Tab");
        yield new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));
        page.keyboard.down("Enter");
        yield new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 5000) + 8000));
        page.keyboard.up("Enter");
    });
}
function handlePopup(page) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Checking for popup window...");
        try {
            yield page.waitForSelector('div.DialogBody-c11n-8-106-0__sc-1l4a94i-0', { timeout: 3000 });
            const skipButton = yield page.$('button.StyledTextButton-c11n-8-106-0__sc-1nwmfqo-0');
            if (skipButton) {
                console.log("Popup detected. Clicking 'Skip this question'...");
                yield skipButton.click();
            }
        }
        catch (err) {
            console.log("Popup did not appear, skipping selection.");
        }
    });
}
function autoScroll(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.evaluate(() => __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => {
                let lastHeight = 0;
                const interval = setInterval(() => {
                    window.scrollBy(0, window.innerHeight);
                    const newHeight = document.body.scrollHeight;
                    if (newHeight === lastHeight) {
                        clearInterval(interval);
                    }
                    else {
                        lastHeight = newHeight;
                    }
                }, 2000);
            });
        }));
    });
}
exports.autoScroll = autoScroll;
function searchCityOnListingSite(listingSite, city) {
    return __awaiter(this, void 0, void 0, function* () {
        const { browser, page } = yield startANewPage();
        try {
            yield slowNav(page, listingSite);
            if (yield detectBotProtection(page)) {
                yield solvePressNHoldWithTab(page);
            }
            // Wait for page to load
            yield new Promise(resolve => setTimeout(resolve, 2000));
            // simulate human movement
            yield moveMouseRandomly(page);
            yield page.keyboard.press("ArrowDown");
            yield new Promise(resolve => setTimeout(resolve, 2000));
            // Detect the Search Bar Dynamically
            console.log("Page loaded, checking for search bar...");
            yield page.evaluate(() => window.scrollBy(0, 300));
            yield new Promise(resolve => setTimeout(resolve, 2000));
            let searchInputHandle = yield page.waitForFunction(() => {
                return document.querySelector('input[placeholder="Enter an address, neighborhood, city, or ZIP code"], input[aria-label="Search"]');
            }, { timeout: 15000 });
            // If search bar is not found, it is likely to be a press & hold page
            // By pass it before searching again for the search bar
            if (!searchInputHandle || searchInputHandle == null) {
                yield solvePressNHoldWithTab(page);
                searchInputHandle = yield page.waitForFunction(() => {
                    return document.querySelector('input[placeholder="Enter an address, neighborhood, city, or ZIP code"], input[aria-label="Search"]');
                }, { timeout: 15000 });
            }
            // Convert JSHandle to ElementHandle
            const searchInput = searchInputHandle.asElement();
            // Enter city name & search
            if (searchInput && searchInput instanceof puppeteer_1.ElementHandle) {
                console.log("Typing city name in search bar...");
                yield new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 4000) + 2000));
                yield searchInput.type(city, { delay: Math.floor(Math.random() * 200) + 50 });
                yield new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 1000));
                yield searchInput.press("Enter");
                yield handlePopup(page);
                console.log("Waiting for search results page to load...");
                yield page.waitForFunction(() => location.href.includes('/homes/'), { timeout: 15000 });
            }
            else {
                console.error("Search bar element not found or not an input field!");
                yield browser.close();
                return null;
            }
            const citySearchResUrl = page.url();
            console.log(`Search results loaded with url: ${citySearchResUrl}`);
            yield browser.close();
            return citySearchResUrl;
        }
        catch (err) {
            console.error("Scraping failed before completion: ", err);
            yield browser.close();
            return null;
        }
    });
}
exports.searchCityOnListingSite = searchCityOnListingSite;
function scrapeListingFromSearchRes(searchResUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const { browser, page } = yield startANewPage();
        yield slowNav(page, searchResUrl);
        // if there is a press & hold challenge, do it
        if (yield detectBotProtection(page)) {
            yield solvePressNHoldWithTab(page);
        }
        const citySearchResUrl = page.url();
        // Check if the URL is correct
        if (citySearchResUrl.includes("captcha")) {
            console.warn("Redirected to captcha page. Solving...");
            yield solvePressNHoldWithTab(page);
        }
        else if (citySearchResUrl.includes("nlsQueryStatus=ERROR")) {
            console.log("Zillow returned an error in the search query. Retrying search...");
            yield page.reload({ waitUntil: "networkidle2" });
            yield new Promise(resolve => setTimeout(resolve, 3000));
            if (yield detectBotProtection(page)) {
                yield solvePressNHoldWithTab(page);
            }
            const retryUrl = page.url();
            console.log(`Retry search URL: ${retryUrl}`);
            if (retryUrl.includes("nlsQueryStatus=ERROR")) {
                console.error("Search failed again. Aborting.");
                yield browser.close();
                return [];
            }
        }
        // mimic human movement
        console.log("Moving mouse...");
        yield moveMouseRandomly(page);
        console.log("Extracting property details from search results page...");
        let allListings = [];
        let hasNextPage = true;
        let pageNum = 1;
        while (hasNextPage) {
            console.log(`Scraping page ${pageNum}...`);
            // ensure we scroll down to load all lazy-loaded listings
            yield autoScroll(page);
            yield new Promise(resolve => setTimeout(resolve, 3000));
            // Wait until listings are visible
            yield page.waitForSelector('[data-test="property-card"]', { timeout: 10000 })
                .catch(() => console.warn("Property cards did not load in 10s."));
            // Extract property details from the search result page
            const listings = yield page.$$eval('[data-test="property-card"]', propertyCards => {
                return propertyCards.map(card => {
                    var _a, _b, _c, _d;
                    const priceEl = card.querySelector('[data-test="property-card-price"]');
                    // Target the correct <ul> even if the class name changes
                    const detailsList = card.querySelector('*[class*="StyledPropertyCardHomeDetailsList"]');
                    const detailsEls = detailsList ? detailsList.querySelectorAll('li') : [];
                    // Extract property URL by finding the first <a> tag inside the card
                    const propertyLink = Array.from(card.querySelectorAll("a"))
                        .map(a => a.href)
                        .find(href => href.includes("://") && href.includes("zillow.com/homedetails/"));
                    return {
                        url: propertyLink,
                        price: priceEl ? (_a = priceEl.textContent) === null || _a === void 0 ? void 0 : _a.trim : "N/A",
                        beds: detailsEls.length > 0 ? ((_b = detailsEls[0].querySelector('b')) === null || _b === void 0 ? void 0 : _b.textContent) || "N/A" : "N/A",
                        baths: detailsEls.length > 1 ? ((_c = detailsEls[1].querySelector('b')) === null || _c === void 0 ? void 0 : _c.textContent) || "N/A" : "N/A",
                        sqft: detailsEls.length > 2 ? ((_d = detailsEls[2].querySelector('b')) === null || _d === void 0 ? void 0 : _d.textContent) || "N/A" : "N/A"
                    };
                });
            });
            console.log(`Extracted ${listings.length} listings from page ${pageNum}.`);
            const nextButton = yield page.$('ul[class*="PaginationList"] > li:last-child a');
            if (nextButton) {
                const isDisabled = yield page.evaluate(button => button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true", nextButton);
                if (!isDisabled) {
                    console.log("Clicking next button to load more listings...");
                    yield nextButton.click();
                    yield new Promise(resolve => setTimeout(resolve, 5000)); // Wait for new page to load
                    pageNum++;
                }
                else {
                    console.log("Next button is disabled. No more pages.");
                    hasNextPage = false;
                }
            }
            else {
                console.log("No next button found. Stopping pagination.");
                hasNextPage = false;
            }
        }
        yield browser.close();
        return allListings;
    });
}
exports.scrapeListingFromSearchRes = scrapeListingFromSearchRes;
