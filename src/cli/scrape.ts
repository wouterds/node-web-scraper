import colors from 'colors';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { formatDistanceToNowStrict } from 'date-fns';
import fs from 'fs';
import { sleep } from 'radash';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import Browser from '../services/browser';

type Args = {
  domain?: string;
  url?: string;
  cookies?: string;
};

const {
  domain: domainArg,
  url: urlArg,
  cookies: cookiesArg,
} = yargs(hideBin(process.argv)).argv as Args;

if (!domainArg && !urlArg) {
  console.log(
    colors.red(
      'Please provide at least a domain or a url using the --domain or --url flags',
    ),
  );
  process.exit(1);
}

if (urlArg && domainArg) {
  console.log(colors.red('Please provide either a domain or a url, not both'));
  process.exit(1);
}

if (domainArg && domainArg.includes('://')) {
  console.log(
    colors.red('Please provide a valid domain (without the protocol)'),
  );
  process.exit(1);
}

if (urlArg && !urlArg.includes('://')) {
  console.log(colors.red('Please provide a valid url (with the protocol)'));
  process.exit(1);
}

if (cookiesArg && !cookiesArg.includes('.csv')) {
  console.log(colors.red('Please provide a valid cookies file (.csv)'));
  process.exit(1);
}

if (cookiesArg && !fs.existsSync(cookiesArg)) {
  console.log(colors.red('Could not load cookies csv'));
  process.exit(1);
}

const domain = domainArg || new URL(urlArg as string).hostname;

console.log(colors.white(`${colors.bold('Domain:')} ${domain}`));

const url = urlArg || `http://${domain}`;

const recursively = !urlArg;

const existingCsvFound = fs.existsSync(`./data/${domain}.csv`);

const csvWriter = createObjectCsvWriter({
  path: `./data/${domain}.csv`,
  alwaysQuote: true,
  header: [
    { id: 'url', title: 'url' },
    { id: 'title', title: 'title' },
    { id: 'content', title: 'content' },
  ],
  append: true,
});

const slugify = (input: string) => {
  let slug = input.toLowerCase();

  slug = slug.replace(/[\s\W-]+/g, '-');

  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
};

const links: string[] = [];
const scrapeUrlRecuversively = async (url: string) => {
  if (links.includes(url)) {
    return;
  }

  links.push(url);

  await Browser.browseUrl(url);

  const title = await Browser.getTitle();
  const content = await Browser.getContent();
  const size = Math.max(Math.ceil(content.length / 1024), 1);

  await csvWriter.writeRecords([{ url, title, content }]);

  const html = await Browser.getHTML();
  if (!fs.existsSync(`./data/${domain}`)) {
    fs.mkdirSync(`./data/${domain}`);
  }

  fs.writeFileSync(
    `./data/${domain}/${slugify(new URL(url).pathname) || 'index'}.html`,
    html,
  );

  console.log(`Scraped ${colors.magenta(url)} (${colors.blue(`${size}kb`)})`);

  if (!recursively) {
    return;
  }

  for (const link of await Browser.getLinks()) {
    if (links.includes(link)) {
      continue;
    }

    await scrapeUrlRecuversively(link);
  }
};

(async () => {
  const cookies: Array<{ name: string; domain: string; value: string }> = [];
  if (cookiesArg) {
    await new Promise(resolve =>
      fs
        .createReadStream(cookiesArg)
        .pipe(csvParser())
        .on('data', row => {
          cookies.push(row);
        })
        .on('end', resolve),
    );
  }

  console.log(
    colors.white(
      `${colors.bold('Cookies:')} ${
        cookies.length ? cookies.length : 'no cookies loaded'
      }`,
    ),
  );

  if (existingCsvFound) {
    if (fs.existsSync(`./data/${domain}.csv`)) {
      console.log(
        colors.yellow(
          `${colors.bold(
            'Warning:',
          )} existing csv file found, it will be extended`,
        ),
      );
    }

    await sleep(1000);
  }

  const start = new Date();

  await Browser.init();

  for (const cookie of cookies) {
    Browser.setCookie(cookie.name, cookie.value, cookie.domain);
  }

  await scrapeUrlRecuversively(url);

  await Browser.close();

  const fileSize = fs.statSync(`./data/${domain}.csv`).size;

  console.log(
    colors.green(
      `Scraped ${links.length.toString()} pages in ${formatDistanceToNowStrict(
        start,
      )}, data stored in ${colors.underline(
        `./data/${domain}.csv`,
      )} (${Math.max(Math.ceil(fileSize / 1024), 1)}kb)`,
    ),
  );
})();
