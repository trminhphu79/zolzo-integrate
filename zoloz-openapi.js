const moment = require('moment');
const crypto = require('crypto');
const axios = require('axios');

const aes_encrypt = (plain_text, aes_key) => {
    const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(aes_key), null);
    const encrypted = Buffer.concat([cipher.update(plain_text), cipher.final()]);

    return encrypted.toString('base64');
}

const aes_decrypt = (cipher_text, aes_key) => {
    const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(aes_key), null);
    const decrpyted = Buffer.concat([decipher.update(cipher_text, 'base64'), decipher.final()]);
    return decrpyted.toString();
}

const rsa_encrypt = (plain_text, rsa_pub_key) => {
    return crypto.publicEncrypt(
        {
            key: rsa_pub_key,
            padding: crypto.constants.RSA_PKCS1_PADDING
        },
        Buffer.from(plain_text)
    ).toString('base64');
}

/**
 * 
 * @param {string} api - Api name, e.g. v1.zoloz.realid.initialize
 * @param {string} payload - JSON String of request data
 * @param {function} callback - 
 */
const post = (api, payload, callback) => {

    let request_time = moment().format('yyyy-MM-DDTHH:mm:ssZ');
    if (request_time.charAt(request_time.length - 3) == ":") {
        request_time = request_time.replace(/:([^:]*)$/, '$1');
    }

    let aes_key = crypto.randomBytes(16);
   // console.log(aes_key);
    let encrypted_aes_key = rsa_encrypt(aes_key, zoloz_public_key);
    let encrypted_payload = aes_encrypt(payload, aes_key);

    let message = 'POST /api/' + api.replace(/\./g, '/') + '\n' + client_id + '.' + request_time + '.' + encrypted_payload;
    let signature = crypto.sign('sha256WithRSAEncryption', Buffer.from(message), merchant_private_key).toString('base64');

    axios({
        method: 'post',
        url: host + '/api/' + api.replace(/\./g, '/'),
        data: encrypted_payload,
        timeout: 2000,
        responseType: 'text',
        headers: {
            'Content-Type': 'text/plain; charset=UTF-8',
            'Client-Id': client_id,
            'Request-Time': request_time,
            'Signature': 'algorithm=RSA256, signature=' + encodeURIComponent(signature) + ', keyVersion=',
            'Encrypt': 'algorithm=RSA_AES, symmetricKey=' + encodeURIComponent(encrypted_aes_key) + ', keyVersion='
        }
    })
        .then(res => {
            let response_signature = res.headers['signature'].replace(/ /g, '').split("signature=")[1];
            let data_message = "POST /api/" +  api.replace(/\./g, '/') + "\n" + client_id + "." + res.headers['response-time'] + "." + res.data;
            let valid = crypto.verify('sha256WithRSAEncryption', Buffer.from(data_message), zoloz_public_key, Buffer.from(decodeURIComponent(response_signature), 'base64'));
            
            if (valid) {
                callback(aes_decrypt(res.data, aes_key));
            } else {
                callback("response signature is invalid");
            }
        })
        .catch(error => {
            console.error(error)
            callback("failed to call zoloz openapi")
        })
}

// open api parameters
const host = "https://id-production-api.zoloz.com";               //     Select the corresponding API based on the environment of the clientId in the Zoloz Portal. For details, please refer to the documentation: https://docs.zoloz.com/zoloz/saas/integration/gkxbrc

//const client_id="2188**********";
const client_id="2188*********************";                     //To configure the clientId, log in to the Zoloz Portal to view it.



const merchant_private_key = "-----BEGIN PRIVATE KEY-----\n"
    + "**************The merchant private  key content should have its header and footer removed, as well as any line breaks, and then be pasted here.*****************"
    + "\n-----END PRIVATE KEY-----";
const zoloz_public_key = "-----BEGIN PUBLIC KEY-----\n"
    + "**************The zoloz pubic key content should have its header and footer removed, as well as any line breaks, and then be pasted here.*****************"
    + "\n-----END PUBLIC KEY-----";
module.exports = post;


/*
let req = {
    operationMode: "STANDARD",
   metaInfo: "MOB_H5",
    pages: "1",
    h5ModeConfig: {
     completeCallbackUrl: "https://www.72111.com/callback.html",
     interruptCallbackUrl: "https://wwww.72111.com/callback.html"
     },
     sceneCode: "openAccount",
     docType: "00000001003",
     bizId: "2d6585b49fccc79d5f36763754bc482d",
     serviceLevel: "REALID0001",
     userId: "c4ca4238a0b923820dcc509a6f75849b",
     flowType: "H5_REALIDLITE_KYC"
};
*/


/*Below is the construction of the request body.
*/
let req = {

    bizId: "2d6585b49fccc79d5f36763754bc482d",
    metaInfo: "MOB_H5",
    userId: "c4ca4238a0b923820dcc509a6f75849b",
   
    h5ModeConfig: {
     completeCallbackUrl: "https://www.*****.com/callback.html",
     interruptCallbackUrl: "https://wwww.*****.com/callback.html"
     },
    
   
};
post("v1.zoloz.facecapture.initialize", JSON.stringify(req), res => {
    console.log(res);
});


//let req = {




   // "bizId": "2017839040588699",
    //"userId": "t-abhishek.jha@aventistechnology.com",
   // "metaInfo": "{\"deviceType\":\"android\",\"appVersion\":\"0.2.1\",\"buildVersion\":\"1.3.7.240326103427\",\"keyHash\":\"\",\"osVersion\":\"12\",\"appName\":\"ph.dft.app.stg\",\"bioMetaInfo\":\"3.61.0:,;JJJBICRJIICRKQCAJA==;1.3.7.240326103427\",\"apdidToken\":\"ZLZ1FF23634B4E041628F4AE0C58404B1A4\",\"deviceModel\":\"HD1901\"}",
   // "docType": "00630000032",
   // "productConfig": {
   //   "cropFaceImageFromDoc": "Y",
   //   "enableOCR": "Y",
     // "spoofMode": "STANDARD"
   // },
    //"serviceLevel": "IDRECOGNITION0003"
    
    //"operationMode": "CLOSED",
    //"metaInfo": "MOB_H5",
    //"pageConfig": {"urlFaceGuide":"https://*********************"},
    //"h5ModeConfig": {"completeCallbackUrl":"http://********/result.html","interruptCallbackUrl":"http://********/result.html"},
    //"docType": "00860000001",
    //"bizId": "dummy_bizid_1694689341111",
    //"serviceLevel": "REALID0002",
    //"userId": "dummy_userid_1694689342737",
    //"flowType": "H5_REALIDLITE_KYC"
    //"bizId": "testtest000000001",
    //"transactionId": "G000000004FFC20230914000000062531122310",
    //"docType": "*********************",
    //"frontPageImage":"*********************"

//"bizId": "testtest000000001",
//"transactionId": "G000000004FRL202412040000000*********69",
//"isReturnImage": "Y",
///};
//post("v1.zoloz.idrecognition.initialize", JSON.stringify(req), res => {
//    console.log(res);
//});
