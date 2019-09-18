const axios = require('axios');
const chalk = require('chalk');
const config = require('../config.js');

console.log();
console.log(chalk.gray('Config Loaded', JSON.stringify(config)));
console.log();

const day = 24 * 3600000;
const oneEtherInWei = '1000000000000000'; //.001 ETH
const state = 'Processing'

class Order {
  constructor(id, desc, expectedDeliveryDate, price, buyer, status) {
    this.id = id;
    this.desc = desc;
    this.expectedDeliveryDate = expectedDeliveryDate;
    this.price = price;
    this.buyer = buyer;
    this.status = status;
    this.date = new Date().getTime();
  }
}

const orders = [
  new Order('ORDER-1111', 'Lemons - On Time', new Date().getTime() + day * 5 , oneEtherInWei, config.Buyers_Address, state),
  new Order('ORDER-2222', 'Lemons - 12 Hours Late', new Date().getTime() + day * 5 , oneEtherInWei, config.Buyers_Address, state),
  new Order('ORDER-3333', 'Lemons - 2 Days Late', new Date().getTime() + day * 5 , oneEtherInWei, config.Buyers_Address, state),
  new Order('ORDER-4444', 'Lemons - Partial', new Date().getTime() + day * 5 , oneEtherInWei, config.Buyers_Address, state),
  new Order('ORDER-5555', 'Lemons - Damaged', new Date().getTime() + day * 5 , oneEtherInWei, config.Buyers_Address, state)
]

const ProcessOrders = async (orders, index = 0) => {
  try{
    const seconds = 0;
    const milliseconds = seconds * 1000;
    if(index < orders.length){
      const order = orders[index];
      console.log();
      console.log(chalk.green(index, 'Processing New Order: ', JSON.stringify(order)));
      await InsertNewOrderIntoAtra(order);
      setTimeout(()=>{
        ProcessOrders(orders, ++index);
      }, milliseconds);
    }else{
      console.log();
      console.log(chalk.red('All Orders Processed!'));
    }
  }catch(err){
    console.log(err);
  }
}

const InsertNewOrderIntoAtra = (order) => {
  return new Promise(async (resolve, reject)=>{
    try {
      const instance = axios.create({
        baseURL: 'https://api.atra.io/prod/v1/',
        headers: {'x-api-key': config.APIKey}
      });
      const body = {
        tableId: config.Orders_TableID,
        record: [
          order.id,
          order.desc,
          order.expectedDeliveryDate,
          order.price,
          order.buyer,
          // order.status,
          new Date().getTime()
        ]
      }
      console.log(body);
      const res = await instance.post(`/dtables/records`, body);
      resolve(res);
      resolve();
    }catch(err){
      reject(err);
    }
  })
}

ProcessOrders(orders);
