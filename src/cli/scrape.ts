import colors from 'colors';
import { createObjectCsvWriter } from 'csv-writer';
import { formatDistanceToNowStrict } from 'date-fns';
import fs from 'fs';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import Browser from '../services/browser';

type Args = {
  domain?: string;
};

const { domain } = yargs(hideBin(process.argv)).argv as Args;
if (!domain) {
  console.log(colors.red('Please provide a domain with the --domain flag'));
  process.exit(1);
}
if (domain.includes('://')) {
  console.log(
    colors.red('Please provide a valid domain (without the protocol)'),
  );
  process.exit(1);
}

console.log(colors.yellow(`${colors.bold('domain:')} ${domain}`));

const url = `http://${domain}`;

if (fs.existsSync(`./data/${domain}.csv`)) {
  fs.unlinkSync(`./data/${domain}.csv`);
}

const csvWriter = createObjectCsvWriter({
  path: `./data/${domain}.csv`,
  alwaysQuote: true,
  header: [
    { id: 'url', title: 'url' },
    { id: 'title', title: 'title' },
    { id: 'content', title: 'content' },
  ],
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
      `Scraped ${colors.bold(
        links.length.toString(),
      )} pages in ${formatDistanceToNowStrict(
        start,
      )}, data stored in ${colors.underline(
        `./data/${domain}.csv`,
      )} (${Math.max(Math.ceil(fileSize / 1024), 1)}kb)`,
    ),
  );
})();
