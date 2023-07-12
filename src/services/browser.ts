import puppeteer, { Browser as PuppeteerBrowser } from 'puppeteer';

class Browser {
  private static _instance: Browser;
  private _browser: PuppeteerBrowser | null = null;

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
}

export default Browser;
