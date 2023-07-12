import colors from 'colors';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

type Args = {
  website?: string;
};

const { website } = yargs(hideBin(process.argv)).argv as Args;

if (!website) {
  console.log(colors.red('Please provide a website with the --website flag'));
  process.exit(1);
}

console.log(colors.yellow(`${colors.bold('website:')} ${website}`));
