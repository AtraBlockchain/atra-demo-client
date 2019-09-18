let Web3 = require('web3');
const axios = require('axios');
const chalk = require('chalk');
const config = require('../config.js');
const abi = require('./abi.js');

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});
const ses = new AWS.SES({apiVersion: '2010-12-01'});

console.log();
console.log(chalk.gray('Config Loaded', JSON.stringify(config)));
console.log();

const GetOrderStateLogFromAtra = () => {
  return new Promise(async (resolve,reject)=>{
    try {
      const instance = axios.create({
        baseURL: 'https://api.atra.io/prod/v1/',
        headers: {'x-api-key': config.APIKey}
      });
      const res = await instance.get(`/dtables/records?tableId=${config.OrderStateLog_TableID}`);
      resolve(res.data.live);
    }catch(err){
      console.log(err);
    }
  })
}

const SettleOrder = (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      //Make call to Settlement Contract
      const _PublicKey = '0x[fill in]';
      const _PrivateKey = '0x[fill in]';
      var web3 = new Web3("https://ethereum.api.nodesmith.io/v1/rinkeby/jsonrpc?apiKey=[api key]");

      const account = web3.eth.accounts.privateKeyToAccount(_PrivateKey);
      web3.eth.accounts.wallet.add(account);
      web3.eth.defaultAccount = account.address;

      let settlementContract = new web3.eth.Contract(abi, config.Settlement_Contract_Address);

      let sendData = {
        from: _PublicKey,
        gasPrice: '3000000000'
      }

      console.log(chalk.yellow('Processing Order Settlement:', order.description, order.logRecordId));

      sendData = {
        ...sendData,
        // gas: 103277
        gas: await settlementContract.methods.CompleteOrder(
            order.logRecordId
          ).estimateGas(sendData)
      }

      // console.log(sendData);

      settlementContract.methods.CompleteOrder(
        order.logRecordId
      ).send(sendData)
      .on('transactionHash', (hash) => {
          //console.log('Hash', hash);
      }).on('confirmation', (confirmationNumber, receipt) => {
        if(confirmationNumber === 1){
          console.log(chalk.green('Confirmation', receipt.transactionHash));
          resolve();
        }
      }).on('receipt', (receipt) => {
        //console.log('Receipt', receipt);
      }).on('error', (err)=> {
        console.log(chalk.red('Error', err));
        reject();
      });
    }catch(err){
      console.log(chalk.red('Order Payment Was Not Sent, Sending Alert'));
      reject();
    }
  })
}

const InsertIntoOrderStateLog = (order, paid) => {
  return new Promise(async (resolve, reject)=>{
    try {
      const instance = axios.create({
        baseURL: 'https://api.atra.io/prod/v1/',
        headers: {'x-api-key': config.APIKey}
      });
      let body = {
        tableId: config.OrderStateLog_TableID
      }
      body.record = [
        paid ? 'Paid' : 'Non-Payment',
        order.condition,
        order.full,
        new Date().getTime(),
        order.orderRecordId
      ];
      console.log(body);
      // console.log(chalk[color](JSON.stringify(body)));
      const res = await instance.post(`/dtables/records`, body);
      resolve(res);
    }catch(err){
      reject(err);
    }
  })
}

const SendTX = async (orders, index = 0) => {
  return new Promise(async (resolve, reject)=>{
    try {

      const res = await SettleOrder(orders[index]);
      await InsertIntoOrderStateLog(orders[index], true);

    }catch(err){

      console.log(err);
      await InsertIntoOrderStateLog(orders[index], false);
      await SendAlertEmail('atra@atra.io', orders[index]);

    }finally{

      if(index + 1 < orders.length){
          SendTX(orders, ++index);
      }else{
        console.log(chalk.green('All Orders Settled'));
        resolve();
      }

    }
  })
}

GetOrderStateLogFromAtra().then(async (orderLog) =>{
  console.log(orderLog);
  const deliveredOrders = orderLog.filter( o => o.record.includes('Delivered')).map(log=>{
    return {
      logRecordId: log.recordId,
      description: log.R_Orders_Data[1],

      orderRecordId: log.record[4],
      state: log.record[0],
      condition: log.record[1],
      full: log.record[2],
      date: log.record[3]
    }
  });
  // console.log(deliveredOrders);
  const res = await SendTX(deliveredOrders);
});

function formatDate(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + " " + strTime;
}

function SendAlertEmail(emailAddress, order) {
  return new Promise((resolve, reject)=>{
    try{

      var date = new Date();
      var dateTimeString = formatDate(date);

      const params = {
        Destination: {
          ToAddresses: [ emailAddress ]
        },
        Message: {
          Body: {
            Html:{
              Data: `<div style="font-family: verdana; font-size: 0.9em; max-width: 600px;min-width:300px; margin: 0 auto;">
                <div style="padding: 20px;max-width: 600px;min-width:300px; margin: 0 auto;">
                  <h2>Logistics Alert!</h2>
                  <p style="margin-top: 5px;">Order Payment Failed</p>
                  <h3 style="margin-bottom: 0px;padding-bottom: 0;">${order.description}</h3><br />
                </div>
                <br />
                <div style="max-width: 600px;min-width:300px; margin: 0 auto; background-color: white; border: 1px solid black;">
                  <a style=" display: block; text-decoration: none; color: black; margin: 0 auto; text-align: center; padding: 20px;" href='${config.LiteUIURL}'>
                    View Order
                  </a>
                </div>
                <div style="padding: 20px;max-width: 600px;min-width:300px; margin: 0 auto;">
                  <p style="margin-top: 5px;">${dateTimeString} GMT</p>
                </div>
              </div>`
            }
          },
          Subject: {
            Data: 'Atra Order Alert!'
          }
        },
        Source: 'Atra <noreply@atra.io>'
      }
      ses.sendEmail(params, (err,data)=>{
        if(err){
          console.log(err);
          reject(err);
        }else{
          console.log(chalk.green('Alert Email Sent'));
          resolve(data);
        }
      })
    }catch(err){
      console.log(err);
      reject(err);
    }
  });
}
