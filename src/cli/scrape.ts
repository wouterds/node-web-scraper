import colors from 'colors';
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

const data: Record<string, string> = {};
const scrapeLinkRecuversively = async (url: string) => {
  console.log(colors.magenta(`Scraping ${url}`));

  await Browser.browseUrl(url);

  for (const link of await Browser.getLinks()) {
    if (!data[link]) {
      data[link] = await Browser.getContent();
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

  for (const [link, content] of Object.entries(data)) {
    console.log(`${colors.blue(link)} - ${colors.white(`${content.length}`)}`);
  }

  await Browser.close();
})();
