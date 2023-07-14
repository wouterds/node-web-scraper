# @wouterds/node-web-scraper

[![code-review](https://github.com/wouterds/node-web-scraper/workflows/code-review/badge.svg)](https://github.com/wouterds/node-web-scraper/actions/workflows/code-review.yml)

## Setup

```bash
# install dependencies
yarn
```

## Usage

```bash
# run the scraper recursively for entire domain
yarn scrape --domain example.com

# run the scraper for a single url
yarn scrape --url https://example.com/blog/hello-world

# data can be found in the data folder
| data
|---| example.com.csv
```

### Cookies

It is possible to provide some additional cookies using a `cookies.csv`. It expects the CSV to contain a header with `name`, `value` & `domain` column which will be used to set the cookies correctly in the browser. The cookies can be specified to the scrape command using the `--cookies` flag.

```bash
# load cookies from ./path/to/your/cookies.csv
yarn scrape --domain example.com --cookies ./path/to/your/cookies.csv
```
