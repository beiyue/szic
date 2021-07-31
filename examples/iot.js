//gets MQTT client
function initClient() {
    const clientId= Math.random().toString(36).substring(7);
    const _client = new Paho.MQTT.Client(getEndpoint(),clientId);
    //  publish  method  added  to  simplify  messaging
    _client.publish = function(topic,payload)  {
        let  payloadText = JSON.stringify(payload);
        let  message = new Paho.MQTT.Message(payloadText);
        message.destinationName = topic;
        message.qos = 0;

        console.log(topic)
        console.log(payload)
        console.log(message.qos)

        _client.send(message);
    }
    return  _client;
}

function  getEndpoint()  {
//  sensitive  credential  information  in  code.
//  Consider  setting  the  following  AWS  values
//  from  a  secure  source.
//  example:  us-east-1
    const REGION = "<REGION>";
    const IOT_ENDPOINT = "<IOT_ENDPOINT>";
    //  your  AWS  access  key  ID
    const KEY_ID = "<KEY_ID>";
    //  your  AWS  secret  access  key
    const SECRET_KEY = "<SECRET_KEY>";
    //  date  &  time
    const dt = (new Date()).toISOString().replace(/[^0-9]/g, "");
    const ymd = dt.slice(0,8);
    const fdt = `${ymd}T${dt.slice(8,14)}Z`

    const scope = `${ymd}/${REGION}/iotdevicegateway/aws4_request`;
    const ks = encodeURIComponent(`${KEY_ID}/${scope}`);
    let qs = `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${ks}&X-Amz-Date=${fdt}&X-Amz-SignedHeaders=host`;
    const req = `GET\n/mqtt\n${qs}\nhost:${IOT_ENDPOINT}\n\nhost\n${p4.sha256('')}`;
    qs += '&X-Amz-Signature=' + p4.sign(
      p4.getSignatureKey( SECRET_KEY, ymd, REGION, 'iotdevicegateway'),
      `AWS4-HMAC-SHA256\n${fdt}\n${scope}\n${p4.sha256(req)}`
    );
  return `wss://${IOT_ENDPOINT}/mqtt?${qs}`;
}

function p4(){}
p4.sign = function(key,msg)  {
    const hash = CryptoJS.HmacSHA256(msg,  key);
    return hash.toString(CryptoJS.enc.Hex);
};

p4.sha256 = function(msg)  {
    const hash = CryptoJS.SHA256(msg);
    return hash.toString(CryptoJS.enc.Hex);
};

p4.getSignatureKey = function(key,  dateStamp,  regionName,  serviceName)  {
    const kDate = CryptoJS.HmacSHA256(dateStamp,  'AWS4'  +  key);
    const kRegion = CryptoJS.HmacSHA256(regionName,  kDate);
    const kService = CryptoJS.HmacSHA256(serviceName,  kRegion);
    const kSigning = CryptoJS.HmacSHA256('aws4_request',  kService);
    return kSigning;
};

let client = {};

function getClient(success) {
   if (!success) success = ()=> {
        console.log("connected");
    }
    const _client = initClient();
    const connectOptions = {
    useSSL: true,
    timeout: 5,
    mqttVersion: 4,
    onSuccess: success
  };
  _client.connect(connectOptions);
  return _client;
}

function processMessage(message)  {
    console.log(message.payloadString);
}

function processLiveMsg(ak,sk,sessionToken) {
      const msgId= Math.random().toString(36);
      const publishData = {
        "clientId": "server",
        "version": "2",
        "messageId": "<MESSAGE_ID>",
        "payload": {
          "callType": 0,
          "provider": "KVS_WEBRTC",
          "param": [
            {
              "channel": "<CHANNEL_NAME>",
              "channelArn": "<CHANNEL_ARN>",
              "region": "<REGION>",
              "credential": {
                "accessKey": ak,
                "secretKey": sk,
                "sessionToken": sessionToken,
                "expiration": 3600000
              },
              "useDataChannel": true,
              "useTurn": true,
              "trickleIce": true,
              "videoCodec": "h.264/90000",
              "audioCodec": "pcmu"
            }
          ]
        }
      }
      //console.log('Signaling Channel request  = ' , publishData);
      return publishData;
}

function processPTZMsg(topic,message) {
  client.publish(topic, message);
}

function connectIOT() {
    try{
        client = getClient();
        client.onMessageArrived = processMessage;

    } catch (e) {
        console.error(e);
        return;
    }

}

connectIOT();
