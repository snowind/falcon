'use strict';

const AWS = require( 'aws-sdk' );
const credentials = require('../../../../aws.json');

/**
 * The following function will create an AWS Athena Client
 * @param {object} connection 
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 */
export function createAthenaClient( connection ){
    /*let connectionParams = {
        accessKeyId: connection.accessKey,
        secretAccessKey: connection.secretAccessKey,
        region: connection.region,
        maxRetries: 5
    }*/

    let connectionParams = {
        apiVersion: '2017-05-18',
        accessKeyId: credentials.accessKey,
        secretAccessKey: credentials.secretAccessKey,
        region: credentials.region,
        maxRetries: 5
    }
    let athenaClient = new AWS.Athena( connectionParams );

    return athenaClient;
}

/**
 * The following method will execute the sql statement to query the 
 * athena database
 * @param {object} athenaClient  - Object created using create athena client
 * @param {object} params
 * @param {string} params.dbName - Database name to connect to 
 * @param {string} params.sqlStatement - SQL statement to execute
 * @param {string} params.s3Outputlocation - Location will Athena will output resutls of query
 * @return {string} requestId 
 */
export function startQuery( athenaClient, params ){
    let client = athenaClient;

    let queryParams = {
        QueryString: params.sqlStatement,
        ResultConfiguration: { 
          OutputLocation: params.s3Outputlocation, 
          EncryptionConfiguration: {
            EncryptionOption: 'SSE_S3'
          }
        },
        QueryExecutionContext: {
          Database: params.dbName
        }
    };
    return new Promise(function(resolve, reject) {

        client.startQueryExecution( queryParams, (err, data) =>{
            if (err) {
                reject( err );
            }else{
                let queryId = data.QueryExecutionId;
                resolve( queryId );
            }
          });
    });
}

/**
 * The following method will check to see if the query results 
 * have completed.  It will return -1 if the query errored, 0 
 * if it is still executing or 1 if it has completed
 * @param {object} athenaClient  - Object created using create athena client
 * @param {string} queryExecutionId 
 * @param {int} -1 : Error, 0 : Still running, 1 : Completed
 */
export function queryResultsCompleted( athenaClient, queryExecutionId  ){
    let client = athenaClient;

    let queryParams = {
        QueryExecutionId: queryExecutionId
    };

    return new Promise(function(resolve, reject) {

        client.getQueryExecution( queryParams, (err, data) =>{
            if (err) {
                reject( -1 );
            }else{

                let state = data.QueryExecution.Status.State;
                let queryState = 0;
                switch (state) {
                    case 'QUEUED':
                        queryState = 0;
                        break;
                    case 'RUNNING':
                        queryState = 0;
                        break;
                    case 'SUCCEEDED':
                        queryState = 1;
                        break;
                    case 'FAILED':
                        queryState = -1;
                        break;
                    case 'CANCELLED':
                        queryState = -1;
                        break;
                    default:
                        queryState = -1;
                        break;
                }
                resolve( queryState );
            }
        });
    });
}

/**
 * The following method will stop the query execution based on the query id
 * @param {object} athenaClient  - Object created using create athena client
 * @param {string} queryExecutionId 
 */
export function stopQuery( athenaClient, queryExecutionId ){
    let client = athenaClient;

    let queryParams = {
        QueryExecutionId: queryExecutionId
    };

    return new Promise(function(resolve, reject) {

        client.stopQueryExecution( queryParams, (err, data) =>{
            if (err) {
                reject( err );
            }else{
                resolve( data);
            }
        });
    });
}

export function getQueryResults(){

}