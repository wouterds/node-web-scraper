import colors from 'colors';
import { createObjectCsvWriter } from 'csv-writer';
import { formatDistanceToNowStrict } from 'date-fns';
import fs from 'fs';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import Browser from '../services/browser';

type Args = {
  domain?: string;
  url?: string;
};

const { domain: domainArg, url: urlArg } = yargs(hideBin(process.argv))
  .argv as Args;

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

const domain = domainArg || new URL(urlArg as string).hostname;

console.log(colors.white(`${colors.bold('Domain:')} ${domain}`));

const url = urlArg || `http://${domain}`;

const recursively = !urlArg;

if (fs.existsSync(`./data/${domain}.csv`)) {
  console.log(
    colors.yellow(
      `${colors.bold('Warning:')} existing csv file found, it will be extended`,
    ),
  );
}

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
  const start = new Date();

  await Browser.init();
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
