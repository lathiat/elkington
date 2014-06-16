var protocol = require('./protocol');

var parseMessage = function(msg) {
  
  var msgData = {};
  msgData.commandCode = msg.substring(2,4);
  msgData.raw = msg.replace('\r', '').replace('\n', '');
  
  var msgLen = parseInt(msg.substring(0,2), 16);
  if(msgLen > 0) msgData.length = msgLen;
  
  var command;
  
  if(protocol.commands[msgData.commandCode]) {
    command = protocol.commands[msgData.commandCode];
  }
  
  if(msgData.commandCode.length == 2) {
    if(msgData.commandCode.substring(0,1) == msgData.commandCode.substring(0,1).toUpperCase()) {
      msgData.direction = 'from';
    } else {
      msgData.direction = 'to';
    }
  }
  
  if(command) {
    msgData.message = command;
  } else {
    msgData.message = 'Unknown message';
  }
  
  msgData.dataRaw = msg.substring(4, msg.length - 2);
  msgData.data = {};

  switch(msgData.commandCode) {
    case 'AR':
      msgData = parseAlarmReporting(msgData);
      break;
    case 'AS':
      msgData = parseArmingStatusData(msgData);
      break;
    case 'IC':
      msgData = parseInvalidUserData(msgData);
      break;
    case 'KC':
      msgData = parseKeypadChangeData(msgData);
      break;
    case 'ZC':
      msgData = parseZoneChange(msgData);
      break;
  }
  return msgData;
}

var parseAlarmReporting = function(msgData) {
  msgData.data.accountNumber = parseInt(msgData.dataRaw.substring(0,6));
  msgData.data.alarmCode = parseInt(msgData.dataRaw.substring(6,10));
  if(protocol.events[msgData.data.alarmCode.toString()]) {
    msgData.data.alarmMessage = protocol.events[msgData.data.alarmCode.toString()];
  } else {
    msgData.data.alarmMessage = 'Unknown alarm code message';
  }
  msgData.data.area = parseInt(msgData.dataRaw.substring(10,12));
  msgData.data.zone = parseInt(msgData.dataRaw.substring(12,15));
  msgData.data.telIp = parseInt(msgData.dataRaw.substring(15,16));
  return msgData;
}

var parseArmingStatusData = function(msgData) {
  
  var armStatuses = msgData.dataRaw.substring(0,8).split('');
  var armUpStates = msgData.dataRaw.substring(8,16).split('');
  var alarmStates = msgData.dataRaw.substring(16,24).split('');
  
  for(var i=1; i<=8; i++) {
    msgData.data['area' + i] = {};

    msgData.data['area' + i].armStatus = protocol.armStatuses[armStatuses[i-1]];
    msgData.data['area' + i].armUpState = protocol.armUpStates[armUpStates[i-1]];
    msgData.data['area' + i].alarmState = protocol.alarmStates[alarmStates[i-1]];
    
  }
  
  return msgData;
}

var parseKeypadChangeData = function(msgData) {
  var kn = parseInt(msgData.dataRaw.substring(0,2));
  var kd = parseInt(msgData.dataRaw.substring(2,4));
  var kl = msgData.dataRaw.substring(4,10);
  var kc = msgData.dataRaw.substring(10,11);
  var kp = msgData.dataRaw.substring(11,19);
  msgData.data['keypad'] = kn;
  msgData.data['kd'] = protocol.keyTable[kd];
  for(var i=0; i<6; i++) {
    msgData.data['F' + i+1] = protocol.keyStatus[kl[i]];
  }
  msgData.data['bypassCodeRequired'] = kc;
  msgData.data['kp'] = kp;

  return msgData;
}

var parseInvalidUserData = function(msgData) {
  var kd = msgData.dataRaw.substring(0,12);
  var ku = msgData.dataRaw.substring(12,15);
  var kn = msgData.dataRaw.substring(15,17);

  msgData.data['invalidCode'] = kd;
  msgData.data['userCode'] = ku;
  msgData.data['keypad'] = kn;

  return msgData;
}

var parseZoneChange = function(msgData){
    
    var theState = msgData.dataRaw.substring(3,4);
    msgData.data.zone = msgData.dataRaw.substring(0,3);
    msgData.data.zoneStatus = protocol.zoneStates[msgData.dataRaw.substring(3,4)]; 
    return msgData;
}

module.exports.parseMessage = parseMessage;
