import puppeteer, { Browser as PuppeteerBrowser, Page } from 'puppeteer';
import { unique } from 'radash';
import sanitizeHtml from 'sanitize-html';

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

  public static async getHTML() {
    if (!this.instance._page) {
      throw new Error('Page is not ready');
    }

    return this.instance._page.content();
  }

  public static async getContent() {
    if (!this.instance._page) {
      throw new Error('Page is not ready');
    }

    const html = await Browser.getHTML();

    return sanitizeHtml(html.replace(/><\//g, '> </'), { allowedTags: [] })
      .replace(/\n+/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public static async getDomain() {
    if (!this.instance._page) {
      throw new Error('Page is not ready');
    }

    return new URL(this.instance._page.url()).hostname.replace('www.', '');
  }

  public static async getTitle() {
    if (!this.instance._page) {
      throw new Error('Page is not ready');
    }

    return this.instance._page.title();
  }

  public static async getLinks() {
    if (!this.instance._page) {
      throw new Error('Page is not ready');
    }

    const domain = await this.getDomain();

    const links = (
      await this.instance._page.$$eval('a', anchors =>
        anchors.map(({ href }) => href),
      )
    )
      .map(link => {
        if (!link) {
          return null;
        }

        const url = new URL(link);
        if (!url.hostname.includes(domain)) {
          return null;
        }

        if (!link.includes('http')) {
          return null;
        }

        return link.split('#')[0].replace(/\/$/, '');
      })
      .filter(Boolean);

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
