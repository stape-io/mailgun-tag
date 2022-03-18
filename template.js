const sendHttpRequest = require('sendHttpRequest');
const toBase64 = require('toBase64');
const JSON = require('JSON');
const makeTableMap = require('makeTableMap');
const getRequestHeader = require('getRequestHeader');
const logToConsole = require('logToConsole');
const getContainerVersion = require('getContainerVersion');
const encodeUriComponent = require('encodeUriComponent');
const containerVersion = getContainerVersion();
const isDebug = containerVersion.debugMode;
const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');

let apiUrl, method, eventName, requestBody;

if (data.action === 'email') {
    apiUrl = '/v3/'+enc(data.emailDomain)+'/messages';
    eventName = 'Email';
    method = 'POST';

    requestBody = 'from='+enc(data.emailFrom)+'&to='+enc(data.emailTo)+'&subject='+enc(data.emailSubject)+'&html='+enc(data.emailText);
} else {
    apiUrl = '/v3/lists/'+enc(data.contactListAddress)+'/members';
    eventName = 'Contact';
    method = 'POST';

    requestBody = 'address='+enc(data.contactEmail)+'&name='+enc(data.contactName)+'&upsert=yes&subscribed='+(data.contactSubscribed ? 'yes' : 'no');

    if (data.contactVars && data.contactVars.length) {
        requestBody = requestBody + '&vars='+enc(JSON.stringify(makeTableMap(data.contactVars, 'name', 'value')));
    }
}


const requestUrl = (data.domainZone === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net') + apiUrl;

if (isLoggingEnabled) {
    logToConsole(JSON.stringify({
        'Name': 'Mailgun',
        'Type': 'Request',
        'TraceId': traceId,
        'EventName': eventName,
        'RequestMethod': method,
        'RequestUrl': requestUrl,
        'RequestBody': requestBody,
    }));
}

sendHttpRequest(requestUrl, (statusCode, headers, body) => {
    if (isLoggingEnabled) {
        logToConsole(JSON.stringify({
            'Name': 'Mailgun',
            'Type': 'Response',
            'TraceId': traceId,
            'EventName': eventName,
            'ResponseStatusCode': statusCode,
            'ResponseHeaders': headers,
            'ResponseBody': body,
        }));
    }

    if (statusCode >= 200 && statusCode < 300) {
        data.gtmOnSuccess();
    } else {
        data.gtmOnFailure();
    }
}, {
    method: method,
    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'Authorization': 'Basic '+toBase64('api:'+data.apiKey)}
}, requestBody);

function determinateIsLoggingEnabled() {
    if (!data.logType) {
        return isDebug;
    }

    if (data.logType === 'no') {
        return false;
    }

    if (data.logType === 'debug') {
        return isDebug;
    }

    return data.logType === 'always';
}

function enc(value) {
    value = value || '';
    return encodeUriComponent(value);
}
