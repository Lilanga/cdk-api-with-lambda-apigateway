const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const params = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: "device_id = :deviceId",
    ExpressionAttributeValues: {
      ":deviceId": process.env.DEVICE_ID,
    },
    ScanIndexForward: false,
    Limit: 1,
  };

  try {
    const command = new QueryCommand(params);
    const data = await docClient.send(command);

    if (data.Items.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'No data found' }),
      };
    }

    const latestReading = data.Items[0];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: latestReading.device_id,
        timestamp: latestReading.timestamp,
        humidity: latestReading.humidity,
        pressure: latestReading.pressure,
        temperature: latestReading.temperature,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Failed to fetch data from DynamoDB' }),
    };
  }
};