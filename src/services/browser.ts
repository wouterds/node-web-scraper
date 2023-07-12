import puppeteer, { Browser as PuppeteerBrowser, Page } from 'puppeteer';
import { unique } from 'radash';

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

  public static getContent() {
    if (!this.instance._page) {
      throw new Error('Page is not ready');
    }

    return this.instance._page.content();
  }

  public static async getLinks() {
    if (!this.instance._page) {
      throw new Error('Page is not ready');
    }

    const domain = new URL(this.instance._page.url()).origin
      .replace('www.', '')
      .replace('http://', '')
      .replace('https://', '');

    const links = await this.instance._page.$$eval(
      'a',
      (anchors, domain) => {
        return anchors
          .map(({ href }) => {
            if (!href) {
              return null;
            }

            if (!href.includes(domain)) {
              return null;
            }

            if (!href.includes('http')) {
              return null;
            }

            return href.split('#')[0].split('?')[0].replace(/\/$/, '');
          })
          .filter(Boolean);
      },
      domain,
    );

    return unique(links) as string[];
  }

  public static async close() {
    if (!this.instance._browser) {
      throw new Error('Browser is not ready');
    }

    await this.instance._browser.close();
  }
}

export default Browser;
