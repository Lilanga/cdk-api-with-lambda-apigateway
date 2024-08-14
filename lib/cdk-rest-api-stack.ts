import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class CdkRestApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const weatherDataFunction = new lambda.Function(this, 'WeatherDataFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('weather_lambda'),
      handler: 'weather_data.handler',
      environment: {
        DEVICE_ID: 'DHT-22-01',
        TABLE_NAME: 'DHT22Data',
      }
    });

    // Reference the existing DynamoDB table
    const existingTable = dynamodb.Table.fromTableArn(this, 'DHT22Data', 
      'arn:aws:dynamodb:ap-southeast-2:014498620920:table/DHT22Data'
    );
    
    // Grant the Lambda function permission to query the DynamoDB table
    existingTable.grantReadData(weatherDataFunction);

    weatherDataFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:Query'],
      resources: ['arn:aws:dynamodb:ap-southeast-2:014498620920:table/DHT22Data'],
    }));

    // API Gateway resources
    const api = new apigateway.LambdaRestApi(this, 'weatherAPI', {
      handler: weatherDataFunction,
      proxy: false
    });

    // Define the API Gateway methods
    const weatherResource = api.root.addResource('weather');
    weatherResource.addMethod('GET');
  }
}
