var csv = require('fast-csv');
var fs = require('fs');
const axios = require('axios');

const Start = async () => {
  try{
    const fetch = new Promise((resolve, reject)=>{
      let products = [];
      fs.createReadStream('products_aug.csv')
        .pipe(csv.parse({ headers: true, trim: true }))
        .on('data', row => {
           products.push(row);
        })
        .on('end', rowCount => {
          resolve(products);
        });
    })
    fetch.then(async products=>{
      //console.log(products);
      await Insert(products);
    })
  }catch(err){
    console.log(err);
  }
}

const Insert = async (products) =>{
  try {
    for(const product of products){
      await HandleProductEvent(product);
    }
  }catch(err){
    console.log(err);
  }
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
        record: [product.item, product.description, product.coolcode, product.upc || ' ', product.vendor]
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
