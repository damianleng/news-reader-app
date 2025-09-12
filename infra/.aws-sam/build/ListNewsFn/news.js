const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const table = process.env.ARTICLES_TABLE;
const CACHE_TTL_SECONDS = 300;
const nowEpoch = () => Math.floor(Date.now() / 1000);

// Common headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,PUT,DELETE",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

// function to query documents from dynamodb
exports.listHandler = async (event) => {
  const qs = event.queryStringParameters || {};
  const category = (qs.category || "technology").toLowerCase();

  // read cache
  const cached = await ddb.send(
    new GetCommand({
      TableName: table,
      Key: { category, "publishedAt#": "cache" },
    })
  );

  // pROblems here
  if (cached.Item && nowEpoch() - cached.Item.cachedAt < CACHE_TTL_SECONDS) {
    console.log("Serving from cache");
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ items: cached.Item.items }),
    };
  }

  // fetch news from API
  const url = `https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${process.env.NEWS_API_KEY}&pageSize=10&language=en`;
  const res = await fetch(url);

  if (!res.ok) {
    return { statusCode: 502, body: "News API failed" };
  }

  // prepare data for pushing
  const data = await res.json();
  const items = (data.articles || []).map((a, i) => ({
    id: `art-${Date.now()}-${i}`,
    title: a.title,
    summary: a.description || "",
    url: a.url,
    imageUrl: a.urlToImage,
    source: a.source?.name || "Unknown",
    publishedAt: Math.floor(
      new Date(a.publishedAt || Date.now()).getTime() / 1000
    ),
  }));

  // store news in ddb
  await ddb.send(
    new PutCommand({
      TableName: table,
      Item: {
        category,
        "publishedAt#": "cache",
        items,
        cachedAt: nowEpoch(),
        ttl: nowEpoch() + CACHE_TTL_SECONDS,
      },
    })
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ items }),
  };
};
