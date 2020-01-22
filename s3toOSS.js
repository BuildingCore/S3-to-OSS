const config = require('./config');
const crypto = require('crypto');

const forgeSDK = require('forge-apis');

//Initialize the 2-Legged OAuth2 client
//Bucket scope required --> {bucket: create} 
const oAuth2Leg = new forgeSDK.AuthClientTwoLegged(config.forgecredentials.client_id,
    config.forgecredentials.client_secret,config.scopes.internal, true);

//Import entire AWS SDK
var AWS = require('aws-sdk');

AWS.config.accessKeyId = config.awscredentials.accessKeyId;
AWS.config.secretAccessKey = config.awscredentials.secretAccessKey;
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

//File Size
const File_Size = 20;

//Need to add a function for creating a Forge OSS bucket
function createOSSBucket(){
    //return new Promise((resolve, reject) => {
        
    //});
}

//Send (1) file to Forge OSS
function transferOneFile(s3_file_name, f_header, f_stream){
    return new Promise((resolve, reject) => {
        const objectApi = new forgeSDK.ObjectsApi();

        //Need to have a existing Forge OSS bucket
				//I already have buckets now, so am I able to just upload to those now?
        objectApi.uploadObject(config.forge.forge_bucket, s3_file_name, f_header.ContentLength, f_stream, {}, oAuth2Leg, oAuth2Leg.getCredentials()). then(
            (res) => {
                resolved(res);
            }, 
            (err) => {
                reject(err);
            }
        )
    });
}

//Get Forge Token
function getForge2Token(){
    return new Promise((resolve, reject) => {
        oAuth2Leg.authenticate().then((res) => {
            resolve(res.access_token);
        }).catch((e) => {
            reject(e);
        });
    });
}

// ??? Need to figure out what this code means
//Do not install via npm install... 
//The crypto module provides cryptographic functionality that includes a set of wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign, and verify functions.
function sourceFileSha1(f_stream){
    var hash = crypto.createHash('sha1');
    hash.update(f_stream);

    return hash.digest('hex');
}

//Get File stream of AWS_S3
function getS3FileStream(key){
    return new Promise((resolve, reject) => {
        const params = {Bucket: config.aws.s3_bucket, Key: key};

        s3.getObject(params, function(err, data){
            if(err){
                reject(err);
            }else{
                if(data && data.Body)
                    resolve(data.Body);
                else
                    resolve(null);
            }
        });
    });
}

//Get AWS_S3 File Header - retrieves metadata from S3nObject only
function getS3FileHeader(key){
    return new Promise((resolve, reject) => {
        const params = {Bucket: config.aws.s3_bucket, Key: key};

        s3.headObject(params, function(err, data){
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        });
    });
}

//Get list of S3 Objects within a bucket
function getS3FileList(){
    return new Promise((resolve, reject) => {
        const params = {Bucket: config.aws.s3_bucket, Delimiter: '/'};

        s3.listObjectsV2(params, function(err, data){
            if(err){
                reject(err);
            }else{
                //Data.Contents is the array of objects within the Bucket
                if(data && data.Contents)
                    resolve(data.Contents);
                else
                    resolve([]);
            }
        });
    });
}

//Main Async function to S3 Object to Forge OSS
async function main(){
    try {
        const s3_files = await getS3FileList();

        //for...in to loop through all object in the S3 Bucket
        for(index in s3_files){
            const key = s3_files[index].Key;
            const f_header = await getS3FileHeader(key);

            if(f_header){
                const f_stream = await getS3FileStream(key);

                if(f_stream){
                    const source_sha1 = sourceFileSha1(f_stream);
                }
                //Decide resumable uploading for Large File or common uploading for small file
                if(f_header.ContentLength > File_Size * 1024 * 1024){
                    // check blog to merge resumable uploading
                    //https://forge.autodesk.com/blog/nailing-large-files-uploads-forge-resumable-api
                }else{
                    const forge_token = await getForge2Token();
                    const uploadRes = await transferOneFile(key, f_header, f_stream);

                    if(uploadRes){
                        console.log('Transfer one S3 file to Forge OSS Succeeded! ');

                        if(sourceFileSha1 == uploadRes.body.sha1)
                            console.log('File integrity is correct', key);
                        else  
                            console.log('file integrity is wrong!', key);
                    }
                    else
                        console.log('transfer one S3 file to Forge OSS failed!');   
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
}


// Launch the main function
module.exports = main();