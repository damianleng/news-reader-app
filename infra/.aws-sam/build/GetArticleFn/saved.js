const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const table = process.env.SAVED_TABLE;

// mock user ID
const FAKE_USER = "user-123";

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;

    // extract userId from Cognito authorizer
    const claims = event.requestContext?.authorizer?.claims;
    const userId = claims?.sub;
    if (!userId) return bad(401, "Unauthorized");

    // GET /saved → list saved items
    if (method === "GET") {
      const res = await ddb.send(
        new QueryCommand({
          TableName: table,
          KeyConditionExpression: "userId = :u",
          ExpressionAttributeValues: { ":u": userId },
          Limit: 50,
        })
      );
      return ok(res.Items || []);
    }

    if (method === "PUT") {
      const body = JSON.parse(event.body || "{}");
      if (!body.articleId || !body.title || !body.url) {
        return bad(400, "Missing required fields: articleId, title, url");
      }
      await ddb.send(
        new PutCommand({
          TableName: table,
          Item: {
            userId,
            articleId: body.articleId,
            title: body.title,
            url: body.url,
            category: body.category || "general",
            savedAt: Date.now(),
          },
        })
      );
      return ok({ saved: true });
    }

    if (method === "DELETE") {
      const qs = event.queryStringParameters || {};
      if (!qs) return bad(400, "Missing articleId");
      await ddb.send(
        new DeleteCommand({
          TableName: table,
          Key: { userId: userId, articleId: qs.articleId },
        })
      );
      return ok({ deleted: true });
    }

    return bad(405, "Method not allowed");
  } catch (e) {
    console.error("Error in /saved:", err);
    return bad(500, "Internal server error");
  }
};

// Helpers
function ok(body) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function bad(code, msg) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: msg }),
  };
}
