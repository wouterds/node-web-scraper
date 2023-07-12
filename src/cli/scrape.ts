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

(async () => {
  const start = new Date();
  await Browser.init();
  await Browser.browseUrl(website);
  const links = await Browser.getLinks();

  console.log(
    colors.green(
      `Found ${links.length} links in ${formatDistanceToNowStrict(start)}`,
    ),
  );

  await Browser.close();
})();
