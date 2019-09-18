const axios = require('axios');
const chalk = require('chalk');
const config = require('../config.js');

console.log();
console.log(chalk.gray('Config Loaded', JSON.stringify(config)));
console.log();

const GetOrdersFromAtra = () => {
  return new Promise(async (resolve,reject)=>{
    try {
      const instance = axios.create({
        baseURL: 'https://api.atra.io/prod/v1/',
        headers: {'x-api-key': config.APIKey}
      });
      const res = await instance.get(`/dtables/records?tableId=${config.Orders_TableID}`);
      resolve(res.data.live);
    }catch(err){
      console.log(err);
    }
  })
}

const InsertIntoOrderStateLog = (order, state, color) => {
  return new Promise(async (resolve, reject)=>{
    try {
      const instance = axios.create({
        baseURL: 'https://api.atra.io/prod/v1/',
        headers: {'x-api-key': config.APIKey}
      });
      const body = {
        tableId: config.OrderStateLog_TableID,
        record: [
          state,
          'Good',
          'Full',
          new Date().getTime(),
          order.recordId
        ]
      }
      console.log(chalk[color](JSON.stringify(body)));
      const res = await instance.post(`/dtables/records`, body);
      resolve(res);
    }catch(err){
      reject(err);
    }
  })
}

GetOrdersFromAtra().then(orders=>{
  console.log(orders);
  orders.forEach(order=> {
    InsertIntoOrderStateLog(order, 'Processing', 'yellow');
  })
  setTimeout(()=>{
    orders.forEach(order=> {
      InsertIntoOrderStateLog(order, 'Packaged', 'green');
    })
  },20000);
})
