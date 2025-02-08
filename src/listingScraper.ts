import puppeteer from "puppeteer-extra";
import { Page, ElementHandle } from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AnonymizeUAPlugin from "puppeteer-extra-plugin-anonymize-ua";

const stealth = StealthPlugin();

stealth.enabledEvasions.delete("chrome.runtime");
stealth.enabledEvasions.delete("navigator.webdriver");

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());

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

export async function startANewPage() {
    const browser = await puppeteer.launch({
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

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const blockedResources = ['analytics', 'tracking', 'ads', 'perimeterx', 'captcha', 'px.gif', 'px.js', 'px.captcha', 'px.init.js'];
        if (blockedResources.some(resource => req.url().includes(resource))) {
            //console.log(`Blocking PerimeterX request: ${req.url()}`);
            req.abort();
        } else {
            req.continue();
        }
    });
    
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
        Object.defineProperty(navigator, "platform", { get: () => "Win32" });
        Object.defineProperty((navigator as any).connection, "rtt", { get: () => 50 });
        Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
        Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 });
    });

    await page.deleteCookie(...await page.cookies());

    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    ];
    
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
    
    await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "Upgrade-Insecure-Requests": "1",
        "X-Requested-With": "XMLHttpRequest",
        "Accept-Encoding": "gzip, deflate, br"
    });

    return { browser, page };
}

async function slowNav(page: Page, url: string) {
    console.log(`Navigating to ${url} slowly...`);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });

    // Add random scroll & delays
    for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 3000)); 
    }

    console.log("Navigation complete.");
}

async function detectBotProtection(page: Page): Promise<boolean> {
    console.log("Checking for Zillow's bot detection...");

    const isCaptchaPage = await page.evaluate(() => {
        return !!document.body.innerText.includes("Press & Hold") || 
               !!document.querySelector("iframe") ||
               !!document.querySelector('script[src*="perimeterx"]') ||
               !!document.querySelector('script[src*="captcha"]');
    });

    if (isCaptchaPage) {
        console.warn("Zillow is applying PerimeterX bot protection!");
        return true;
    } else {
        console.log("No PerimeterX bot protection detected.");
        return false;
    }
}

const moveMouseRandomly = async (page: Page) => {
    for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * 500) + 50;
        const y = Math.floor(Math.random() * 500) + 50;
        await page.mouse.move(x, y, { steps: 20 });
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 500) + 300));
    }
};

async function solvePressNHoldWithTab(page: Page) {
    console.log("'Press & Hold' is likely to appear. Waiting to solve...");

    moveMouseRandomly(page);

    // Wait 3s - 5s before starting to press
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));

    // Use tab to find the button
    page.keyboard.press("Tab");

    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));

    page.keyboard.down("Enter");

    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 5000) + 8000));

    page.keyboard.up("Enter");
}

async function handlePopup(page: Page) {
    console.log("Checking for popup window...");
    try{
        await page.waitForSelector('div.DialogBody-c11n-8-106-0__sc-1l4a94i-0', { timeout: 3000 });

        const skipButton = await page.$('button.StyledTextButton-c11n-8-106-0__sc-1nwmfqo-0');

        if(skipButton) {
            console.log("Popup detected. Clicking 'Skip this question'...");
            await skipButton.click();
        }
    }catch(err) {
        console.log("Popup did not appear, skipping selection.");
    }
}

export async function autoScroll(page: Page) {
    console.log("Start controlled scrolling...");

    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            let distance = window.innerHeight / 5; // Scroll in smaller increments
            let scrollAttempts = 0;
            let maxAttempts = 10; // Prevent infinite scrolling

            const interval = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;

                let newHeight = document.body.scrollHeight;

                // Stop scrolling if no new content loads after several attempts
                if(totalHeight >= newHeight || scrollAttempts >= maxAttempts) {
                    clearInterval(interval);
                    resolve();
                }else {
                    scrollAttempts++;
                }
            }, 1500); // small delays to simulate human scrolling
        });
    });

    // Extra wait to ensure everything loads
    await new Promise(resolve => setTimeout(resolve, 2000));
}

export async function searchCityOnListingSite(listingSite: string, city: string) {
    const { browser, page } = await startANewPage();

    try{
        await slowNav(page, listingSite);

        if(await detectBotProtection(page)) {
            await solvePressNHoldWithTab(page);
        }

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // simulate human movement
        await moveMouseRandomly(page);
        await page.keyboard.press("ArrowDown");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Detect the Search Bar Dynamically
        console.log("Page loaded, checking for search bar...");

        await page.evaluate(() => window.scrollBy(0, 300));
        await new Promise(resolve => setTimeout(resolve, 2000));

        let searchInputHandle = await page.waitForFunction(() => {
            return document.querySelector('input[placeholder="Enter an address, neighborhood, city, or ZIP code"], input[aria-label="Search"]');
        }, { timeout: 15000 });

        // If search bar is not found, it is likely to be a press & hold page
        // By pass it before searching again for the search bar
        if(!searchInputHandle || searchInputHandle == null) {
            await solvePressNHoldWithTab(page);
            searchInputHandle = await page.waitForFunction(() => {
                return document.querySelector('input[placeholder="Enter an address, neighborhood, city, or ZIP code"], input[aria-label="Search"]');
            }, { timeout: 15000 });
        }

        // Convert JSHandle to ElementHandle
        const searchInput = searchInputHandle.asElement();
    
        // Enter city name & search
        if(searchInput && searchInput instanceof ElementHandle) {
            console.log("Typing city name in search bar...");
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 4000) + 2000));
            await searchInput.type(city, { delay: Math.floor(Math.random() * 200) + 50 });
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 1000));
            await searchInput.press("Enter");

            await handlePopup(page);

            console.log("Waiting for search results page to load...");
            await page.waitForFunction(() => location.href.includes('/homes/'), { timeout: 15000 });
        }else {
            console.error("Search bar element not found or not an input field!");
            await browser.close();
            return null;
        }

        const citySearchResUrl = page.url();
        console.log(`Search results loaded with url: ${citySearchResUrl}`);

        await browser.close();
        return citySearchResUrl;
    }catch(err) {
        console.error("Scraping failed before completion: ", err);
        await browser.close();
        return null;
    }
}

export async function scrapeListingFromSearchRes(searchResUrl: string): Promise<any[]> {
    const { browser, page } = await startANewPage();
    await slowNav(page, searchResUrl);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // if there is a press & hold challenge, do it
    if(await detectBotProtection(page)) {
        await solvePressNHoldWithTab(page);
        await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }).catch(() => console.log("No forced navigation detected."));
    }

    const citySearchResUrl = page.url();

    // Check if the URL is correct
    if (citySearchResUrl.includes("captcha")) {
        console.warn("Redirected to captcha page. Solving...");
        await solvePressNHoldWithTab(page);
    } else if (citySearchResUrl.includes("nlsQueryStatus=ERROR")) {
        console.log("Zillow returned an error in the search query. Retrying search...");

        await page.reload({ waitUntil: "networkidle2" });
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (await detectBotProtection(page)) {
            await solvePressNHoldWithTab(page);
        }
    
        const retryUrl = page.url();
        console.log(`Retry search URL: ${retryUrl}`);

        if (retryUrl.includes("nlsQueryStatus=ERROR")) {
            console.error("Search failed again. Aborting.");
            await browser.close();
            return [];
        }
    }

    // mimic human movement
    console.log("Moving mouse...");
    await moveMouseRandomly(page);

    console.log("Extracting property details from search results page...");

    let allListings: any[] = [];
    let hasNextPage = true;
    let pageNum = 1;

    while(hasNextPage) {
        console.log(`Scraping page ${pageNum}...`);

        // Wait until listings are visible
        await page.waitForSelector('[data-test="property-card"]', { visible: true, timeout: 20000 })
            .catch(() => console.warn("Property cards did not load in time."));

        console.log("Extracting current listing before scrolling...");
        
        // Extract property details from the search result page
        const currentListings = await page.$$eval('[data-test="property-card"]', propertyCards => {
            return propertyCards.map(card => {
                const priceEl = card.querySelector('[data-test="property-card-price"]');
                const price = priceEl?.textContent?.trim() || "N/A";

                // Target the correct <ul> even if the class name changes
                const detailsList = card.querySelector('*[class*="StyledPropertyCardHomeDetailsList"]');
                const detailsEls = detailsList ? detailsList.querySelectorAll('li'): [];

                // Extract property URL by finding the first <a> tag inside the card
                const propertyLink = Array.from(card.querySelectorAll("a"))
                    .map(a => a.href)
                    .find(href => href.includes("://") && href.includes("zillow.com/homedetails/"));

                return {
                    url: propertyLink || "N/A",
                    price: price,
                    beds: detailsEls.length > 0 ? detailsEls[0].querySelector('b')?.textContent || "N/A" : "N/A",
                    baths: detailsEls.length > 1 ? detailsEls[1].querySelector('b')?.textContent || "N/A" : "N/A",
                    sqft: detailsEls.length > 2 ? detailsEls[2].querySelector('b')?.textContent || "N/A" : "N/A"
                }
            });
        });

        console.log(`Extracted ${currentListings.length} listings from page ${pageNum}.`);

        allListings.push(...currentListings);

        const nextButton = await page.$('ul[class*="PaginationList"] > li:last-child a');
        if(nextButton) {
            const isDisabled = await page.evaluate(button =>
                button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true",
                nextButton
            );

            if(!isDisabled) {
                console.log("Clicking next button to load more listings...");
                await nextButton.click();
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for new page to load
                await autoScroll(page); // Scroll again after new page loads
                pageNum++;
            }else {
                console.log("Next button is disabled. No more pages.");
                hasNextPage = false;
            }
        }else {
            console.log("No next button found. Stopping pagination.");
            hasNextPage = false;
        }
    }

    await browser.close();
    return allListings;
}