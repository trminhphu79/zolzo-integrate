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
const host = "https://hk-production-api.zoloz.net";
const client_id = "2188427610990597";
//const merchant_private_key = "-----BEGIN PRIVATE KEY-----\n"
   // + "MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC0uij3CInq/5gciho1okGC+qHJpW7tjT2hDQ1o2AHmEE+GDAKjn9tDBy+E25JD3ylTJeFIjYH+LOK6Q45lLol4btf/emAMKMo9wQuxZDbsV13G3Z/HZnQknCKf19CKgrDBe5BqZiVlH//BmbjIgbPjsHX0sXNlomTdjAA8fjeKl1CU6YHAm53OlljyV9BwliZ0KGtCFbUq6TBtKTRekJiqXYUJpvTT8dOZwq5mRMOlZBuQLTZENcurWw8jbuFvdPhfRO8sCo/W+YOPizCo8CWiXuEet96WPXfHaSn14RZ4bxmNUZSz/iLIuLxGHTA0YNwc9YzRXdel88WBgzL2WktzAgMBAAECggEBAKltKEBGyfz7tp9yvJVxUlc3HXtL0w1ybsdP1DVo44bJ3bN+CO9aSpSw5NR5f8qPKE+h4GxC9Q3TCI60DIdAtHGqAGaqU+aySr7P/mVD3NV+JhTr6gFmRBWaJj+RdBiV4pzQeRe2QPJnqD3YHcojBgC7iilmPheWwVaNDB+p9+m80RW6ual+f6vUdZx4ygNX97d2hEuwj+31z0GBHQxaoK9rEtbhyu6AW+1uEJ8uIXNBUHjzvVlsaSWXhSv5QuBqq+L6YlfHw4RrlwT4tnVM0sU8y8BhLHZD/SDbBGb7DQSKNJo4Az0lhtvffaAWNLOTWUfxv+eMJKJHZx9cOnpFWKkCgYEA8ia5cGz9IUYGvn8zJUDf/GoZb/yPUK4/PWz3+Js9TF4NMkh4CVowJCuzHMPsoPrtqwDRCf16XrPFW2xVegNzKyLgzZ/pICHjIEQK4sgrRr8xMlbhy+131bP7Q7SIJDz19WtX6j3Hwq0lsxo5ZfJA29vo853esqI1b9Omwf6Db4UCgYEAvxAkJSBEgD+xSy+vsaX/NgM/xVUUecB2PknFaahZ7mrOkwF/lIs2x/5jYNyL14rOBoyAM5JSZYVq6jBmP15RKPnyf6o2yAMgMt3miIMiDAAZ/8bre3NoIUQgFJbgSTKsEP4+MbnOX6slZPuoCSsnUYETO4X9TeFUjVfyG+XitJcCgYBkDqxBUEeoIA9ZV6YClrP20MCCDZIKfHWVJBmymDLUA2jghiFTe/i4eXYhRLPaMNVT+5pkzmBqEU5TYIhRSmukP100mgbySA5ZnsQAwUVgjk/9xPi4Ev+ZRi1k5Iv8rVPUfO5u0+hfALy7LPLatScnsc6oG2uR1ITQGFynfEtDIQKBgQCkk77OzBC1eCe74AOzPo2rdPkFfdf5WDOCTAFklcOBfzcZofzHc3NoqlPoJ5G9xK7bLUNxKOUY1efWeoJYq2G1rjeYiIJPn4Goz0O461v0glHi5PIKkMptfUU09xGTe7aDnLzuEGMYPVAkwDFqVGW16z0p1Kzw3Nv8NHk0Vr0FWQKBgQDX6Ocg16EEuy9G30MR08xSOAopcMtDuVvVjdzg8+5t5ey3n3FiPDaAQ3D9HNmNuDIjnneV6C9CDiUItY9wW/WmnQXr91Mshlbs9kXkYDkYQMxHcxJzeYx9Y4v461wL5E1Fwtrx59sUXZaz7cfxXYjo81Kn+LVZRG0Jz8gkD1wbEg=="
   // + "\n-----END PRIVATE KEY-----";
//const zoloz_public_key = "-----BEGIN PUBLIC KEY-----\n"
   // + "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAueBiCUYQ5KBm+kbq2CyQ9EDE1uiNGWQFS0N1jdR5lY6/0h5J19Cz0TODFueO9BiRX5cZ0bnJBod7JtQb374pD+OlPIK0/vUZoyrqTB5GMrV7mBFKOscLcbescItBIhmi09F4tbzVtStBpc/k/oRMq5H7friFLDup/NMtxO4ienkfUd2tzWMLpI8MBy7J5heJVzKyfpIjHIH/Uc3vzWhrCZvkU0C7lNVGrTrsdA1F1uyIZQBv52vNEAfGhMUqJlZkwXthbJ0tzY5emWIzDCUVRvDj24+eJ7BVC/vkQVJdQlHQLhKKF3WL2bnjIOl3BJSI4q+gdGawmX1LUsmQZYibtwIDAQAB"
   // + "\n-----END PUBLIC KEY-----";


const merchant_private_key = "-----BEGIN PRIVATE KEY-----\n"
    + "MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCLNhW+Z0RcaQiQ4ahjUno5kne7JHbsAWtxecda00I8+6jWK69bMXY2zB1sNgulP08OAC7osJ3vUvM7/TXHrN8EVlGyr2SNHOatUPWfvjvb86QC4TdkyjxytF9sk+WfM7+DI12QkolvcWlgAGWgp48jO1jLBj/CudajqtWrlkCV2lS04bZKwRHdU60pKglUUUfiAia7j5iQ0VbdkktYYoqLJenhnp8O1djEnQ4o1Cr+rKU3FaiFem+/szyTYd2DmqNzhSG/Y2VYSVZZbTtYv25WTzeRqGL2/fROdFme5hKBZYR1pUxmyq1hRepmXVz04+6tjXn0mu+7kR42O5VtIlIdAgMBAAECggEAUEbAAyxJn4ByEBoQoDXPhaOQp7o/WZj3/FfdPeLVL5VvpxFJ7ax4HuFVljEURhZb4Bb69fPjHz8WRGGfwaVOdZHRStkZgsZHv2oQOi3ZFt1IluCIsPZuJTceT955a3TL2zNpoRTfbARaX6Ha+OmnAQoYCftwiTnhLEA3NttOIxsKFeTxbgPE5j6/h3V72Mr6qGuaZHV0mSNhIztzrTBRzMUBq9ghvgc2BzvcMiz5KaqsFoJiRdKo1r9v51vdiUGLMhpvGWq3gxuvV8J1mSq9pYF3H+9DBVjW+a+cRlTmeygx6AdEOrwONDIKfqmWhI/NDnFnk/IS7Sj64tXKDuuVgQKBgQDEpPaTPr/NBVDcKHCJJQo7CKMSYU40+HbYE5+q6uVydXXPTAtGJpqzzEX61gOalLpKbMzcBAduYiSus8hFlEtPxw7iG67mcJuxsd8QvyQL/YRU9TDic8928Wmu7kRnj0GsHd+AT3Gtk+sLCaY44bWQUO3yTbNnCeClX96byhRbywKBgQC1Oyt3dP4bKDCDytMOgLwwRGk/mMsVBvVN+MrNrFLU6Dq8ZNhnR8OSHzybW2xXd8swg03VVmNMhPO9FQ+yj/B2ORrD8t3IgvgV5CEK+12rEeqOR6sSeQWLwuB3KvzW1ylkeu9VSkkdY5JfkvzLwWrxjrTXKyyitg1o7vYkF0+ctwKBgQCXnmXsRE6Yosek6J1UcTXBLLinfFVTrFvd4MuUekbtiLmMWyK6NRvFE/TFIexnbNNyfQ87ePPN3WhRN5dsZpnm6iGEnzmsvhid2vqWK/p8MD2vT9ogUJEfMaZ91YLyoldNgT8J7LdG0a1Btm/uncFjg7Ljx5tTEB+hAxld32LxHwKBgQCNNs/FwxmFG6nB57bRJCp/Ca9g6LPFbKiT2vpbjJz2XQX3ajTdNSQEpeZZv8EJ3sQqxwVM6IVzSF2Lxe93WYUq+ZALgyChbrvUgu/kWL1B4TH9L4bzW+2gW3cAJDTjSsBsFQaMVNfn2IBjjGsCcXHdSy9KQdAD8Qs96oVM1gUovQKBgQC4uGtjEMV1RlyY3h8/si6u5MFZk8YBoWm/9Q0Lhf2C9sSDfl977wPSkoEQ2Q/IY1NrY9cCYlgv1LHBZ8GizAXCBajThzyFwhYZNXBESMJmjIoOave8OyvXuZGTDA/B7nEAFYF7SDUQiXdsXhutyVBJ3mvqwNSzF8GUSMVPaF7jug=="
    + "\n-----END PRIVATE KEY-----";
const zoloz_public_key = "-----BEGIN PUBLIC KEY-----\n"
    + "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3XihukhNmSiYENikFePeyQuP/nZzyehdsUuYliPSeepQF3MEBkuA+a9RohakXbw60S5p3A2ngD5A0Js6C2oqb3NRfe2cTG01GRI+90dErASizLddzu5uMG8uGffzupl8vn4YjeN6ucHY4mMqAVDABpKBUONE1OglrOsU33NC9rv1FF0aIqOEjfzElqX/K7HSvl/npS117GEdahNwP+iGqynCdw4fDWOt02Xd8WeM6mXQghqOJ8ZoN2nm/ADYq7tKkSTiCd6KxTghXONBhwA/wQJNaFxqN73MOiW3EqcFE7ae6HUFOvzobdX9v/6BlMRmzIzYdSi4z50mehpQFgxh5QIDAQAB"
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
