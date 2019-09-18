const axios = require('axios');

const StartOracle = () => {
  try{
    const seconds = 60;
    const milliseconds = seconds * 1000;
    FetchPriceOnInterval(0, milliseconds);
  }catch(err){

  }
}

const FetchPriceOnInterval = async (lastPrice, intervalInMilliseconds) => {
  try {
    console.log('fetching price data');
    const price = await GetETHPriceFromCoinbase();
    console.log('price', price);
    if(price != lastPrice){
      const res = await InsertPriceIntoAtra(price);
    }
    setTimeout(()=>{
      FetchPriceOnInterval(price, intervalInMilliseconds);
    }, intervalInMilliseconds);
  }catch(err){
    console.log(err);
  }
}

const GetETHPriceFromCoinbase = async () => {
  return new Promise(async (resolve, reject)=>{
    try {
      // use coinbase API to get price
      const res = await axios.get(`https://api.coinbase.com/v2/prices/ETH-USD/spot`, {
        responseType: 'json'
      });
      resolve(res.data.data.amount);
    }catch(err){
      reject(err);
    }
  })
}

const InsertPriceIntoAtra = (price) => {
  return new Promise(async (resolve, reject)=>{
    try {
      const instance = axios.create({
        baseURL: 'https://api.atra.io/prod/v1/',
        headers: {'x-api-key': '[your API Key]'}
      });
      const body = {
        tableId: '[table id with columns price and date]',
        record: [price, new Date().getTime()]
      }
      console.log(body);
      const res = await instance.post(`/dtables/records`, body);
      resolve(res);
    }catch(err){
      reject(err);
    }
  })
}

StartOracle();
