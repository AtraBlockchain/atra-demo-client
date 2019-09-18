const axios = require('axios');
const chalk = require('chalk');
const config = require('../config.js');

console.log();
console.log(chalk.gray('Config Loaded', JSON.stringify(config)));
console.log();

const day = 24 * 3600000;

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
      let body = {
        tableId: config.OrderStateLog_TableID
      }
      console.log(order);
      switch(order.record[1]){
        case 'Lemons - On Time':
          body.record = [
            state,
            'Good',
            'Full',
            new Date().getTime(),
            order.recordId
          ];
        break;
        case 'Lemons - 12 Hours Late':
          body.record = [
            state,
            'Good',
            'Full',
            parseInt(order.record[2]) + (day / 2),
            order.recordId
          ];
        break;
        case 'Lemons - 2 Days Late':
          body.record = [
            state,
            'Good',
            'Full',
            parseInt(order.record[2]) + (day * 2),
            order.recordId
          ];
        break;
        case 'Lemons - Partial':
          body.record = [
            state,
            'Good',
            'Partial',
            new Date().getTime(),
            order.recordId
          ];
        break;
        case 'Lemons - Damaged':
          body.record = [
            state,
            'Damaged',
            'Full',
            new Date().getTime(),
            order.recordId
          ];
        break;
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
    InsertIntoOrderStateLog(order, 'Shipped', 'yellow');
  })
  setTimeout(()=>{
    orders.forEach(order=> {
      InsertIntoOrderStateLog(order, 'Delivered', 'green');
    })
  },20000);
})
