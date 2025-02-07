import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

// Did not use this in server.ts because this cannot bypass the bot detection of Google
// May need to use playwright instead of puppeteer or use Google search API such as 
// serpapi to resolve this.
export async function getFirstListingSite(searchQuery: string): Promise<string | null>{
    const proxyServer = "http://72.10.160.94:17103";

    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox", `--proxy-server=${proxyServer}`] // Fix permission issues
    });
    const page = await browser.newPage();

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36"
    );

    // Go to google
    await page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });

    // Bypassing consent page
    const consentButton = await page.$('button[aria-label="Accept all"]');
    if(consentButton) {
        await consentButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Mimic human behavior to bypass bot detection
    await page.mouse.move(Math.floor(Math.random() * 500), Math.floor(Math.random() * 500));
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));

    // Enter the search query
    await page.type('input[name="q"]', searchQuery);
    await page.keyboard.press("Enter");

    // Wait for results to load
    await page.waitForSelector("h3");

    // Get the first search result link
    const firstRes = await page.$("h3");
    if(firstRes) {
        await firstRes.click();
        await page.waitForNavigation();
        const url = page.url();
        console.log(`The first (chosen) site is ${url}`);
        await browser.close();
        return url;
    }

    await browser.close();
    return null;
}