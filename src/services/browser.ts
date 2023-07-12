import puppeteer, { Browser as PuppeteerBrowser, Page } from 'puppeteer';

class Browser {
  private static _instance: Browser;
  private _browser: PuppeteerBrowser | null = null;
  private _page: Page | null = null;

  protected constructor() {
    puppeteer.launch({ headless: 'new' }).then(browser => {
      this._browser = browser;
    });
  }

  private static get instance() {
    if (!this._instance) {
      this._instance = new Browser();
    }

    return this._instance;
  }

  public static async init() {
    while (!this.instance._browser) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return true;
  }

  public static async browseUrl(url: string) {
    if (!this.instance._browser) {
      throw new Error('Browser is not ready');
    }

    this.instance._page = await this.instance._browser.newPage();
    await this.instance._page.goto(url);

    return true;
  }

  public static async close() {
    if (!this.instance._browser) {
      throw new Error('Browser is not ready');
    }

    await this.instance._browser.close();
  }
}

export default Browser;
