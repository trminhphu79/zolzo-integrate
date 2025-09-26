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

            
            //let response_signature = res.headers['signature'].replace(/ /g, '').split("nature=")[1];
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
const host = "https://h-api.net";
const client_id = "zzz";
//const merchant_private_key = "-----BEGIN PRIVATE KEY-----\n"
   // + "\n-----END PRIVATE KEY-----";
//const zoloz_public_key = "-----BEGIN PUBLIC KEY-----\n"
   // + "\n-----END PUBLIC KEY-----";


const merchant_private_key = "-----BEGIN PRIVATE KEY-----\n"
    + "\n-----END PRIVATE KEY-----";
const zoloz_public_key = "-----BEGIN PUBLIC KEY-----\n"
    + "\n-----END PUBLIC KEY-----";
module.exports = post;

//module.exports = post;



let req = {
    
    "operationMode": "CLOSED",
    "metaInfo": "MOB_H5",
    "pageConfig": {"urlFaceGuide":"https://*********************"},
    "h5ModeConfig": {"completeCallbackUrl":"http://********/result.html","interruptCallbackUrl":"http://********/result.html"},
    "docType": "00860000001",
    "bizId": "dummy_bizid_1694689341111",
    "serviceLevel": "REALID0002",
    "userId": "dummy_userid_1694689342737",
    "flowType": "H5_REALIDLITE_KYC"
    
};
post("v1.zoloz.realid.initialize", JSON.stringify(req), res => {
    console.log(res);
});
