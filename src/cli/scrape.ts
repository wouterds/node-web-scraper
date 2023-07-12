import colors from 'colors';
import { createObjectCsvWriter } from 'csv-writer';
import { formatDistanceToNowStrict } from 'date-fns';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import Browser from '../services/browser';

type Args = {
  website?: string;
};

const { website } = yargs(hideBin(process.argv)).argv as Args;

if (!website) {
  console.log(colors.red('Please provide a website with the --website flag'));
  process.exit(1);
}

console.log(colors.yellow(`${colors.bold('website:')} ${website}`));

const data: Record<string, { content: string; title: string }> = {};
const scrapeLinkRecuversively = async (url: string) => {
  console.log(colors.magenta(`Scraping ${url}`));

  await Browser.browseUrl(url);

  data[url] = {
    title: await Browser.getTitle(),
    content: await Browser.getContent(),
  };

  for (const link of await Browser.getLinks()) {
    if (!data[link]) {
      data[link] = {
        title: await Browser.getTitle(),
        content: await Browser.getContent(),
      };

      await scrapeLinkRecuversively(link);
    }
  }
};

(async () => {
  const start = new Date();
  await Browser.init();

  await scrapeLinkRecuversively(website);

  console.log(
    colors.green(
      `Found ${Object.keys(data).length} links in ${formatDistanceToNowStrict(
        start,
      )}`,
    ),
  );

  const domain = await Browser.getDomain();

  const csvWriter = createObjectCsvWriter({
    path: `./data/${domain}.csv`,
    header: ['url', 'title', 'content'],
  });

  for (const [url, { title, content }] of Object.entries(data)) {
    const sizeInKb = Math.round(content.length / 1024);
    console.log(`${colors.blue(url)} - ${colors.white(`${sizeInKb}kb`)}`);

    await csvWriter.writeRecords([{ url, title, content }]);
  }

  await Browser.close();
})();
