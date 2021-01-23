const axios = require("axios");
const cheerio = require("cheerio");

function getPage(slug) {
  return axios(`https://www.sudanakhbar.com/${slug}`);
}

async function extractPricesFromPage(page) {
  const $ = cheerio.load(page);
  // const rows = $("form#views-exposed-form-exchange-rates-page tr");
  const type_nodes = $(
    "form#views-exposed-form-exchange-rates-page tr td:first-child strong"
  );

  const price_nodes = $(
    "form#views-exposed-form-exchange-rates-page tr td:last-child"
  );

  const result = [];

  for (let i = 1; i < type_nodes.length; i++) {
    const tnc = type_nodes[i].children; // tnc = type nodes children
    const pnc = price_nodes[i].children; // pnc = type nodes children

    const type = tnc[0].data || tnc[1].data;
    let price =
      pnc.length === 1
        ? pnc[0].children[0].data
        : pnc[0].children[0].data + pnc[1].children[0].data;

    const price_regexp = /\d+.?\d+/;

    price = price_regexp.exec(price)[0];

    result.push({
      type,
      price
    });
  }

  return result;
}

(async () => {
  const { data: page } = await axios(
    "https://www.sudanakhbar.com/latestnews/currency-prices"
  );
  const $ = cheerio.load(page);

  const article_links = $(
    ".vce-loop-wrap article .entry-header .entry-title a"
  );

  const price_article_slugs = [];

  for (let link in article_links) {
    link = article_links[link];

    if (link.name !== "a") continue;

    if (link.attribs.title.includes("الدولار")) {
      price_article_slugs.push(link.attribs.href.split("/").reverse()[0]);
    }
  }

  const { data: latest_page } = await getPage(price_article_slugs[0]);

  const prices = await extractPricesFromPage(latest_page);

  const { price } = prices.find(p => p.type.includes("الامريكي"));

  const output = `1 USD => ${price} SDG`;

  console.log(output);
})();
