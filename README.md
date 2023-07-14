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
