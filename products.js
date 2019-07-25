const axios = require('axios');

const Start = () => {
  try{
    const products = [
      {
        name: 'Red Apples',
        origin: 'Washington',
        sku: '123000'
      },
      {
        name: 'Green Apples',
        origin: 'Washington',
        sku: '299000'
      },
      {
        name: 'Red Apples',
        origin: 'Oregon',
        sku: '033000'
      }
    ]
    Insert(products, 0);
  }catch(err){

  }
}

const Insert = (products, x) =>{
  setTimeout(async ()=>{
    console.log(x);
    await HandleProductEvent(products[x]);
    x++;
    if(x >= products.length){
      x = 0;
    }
    Insert(products, x);
  },3000);
}


const HandleProductEvent = (product) => {
  return new Promise(async (resolve, reject)=>{
    try {
      const instance = axios.create({
        baseURL: 'https://api.atra.io/prod/v1/',
        headers: {'x-api-key': ''}
      });
      const body = {
        tableId: '',
        record: [product.name, product.origin, product.sku, new Date().getTime()]
      }
      console.log(body);
      const res = await instance.post(`/dtables/records`, body);
      resolve(res);
    }catch(err){
      reject(err);
    }
  })
}

Start();
