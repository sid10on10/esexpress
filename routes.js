'use strict'

var {url,mongodClient} = require("./config")
const { ObjectId } = require("mongodb");


module.exports = function (app, opts) {
  // Setup routes, middleware, and handlers
  app.get('/', (req, res) => {
    res.locals.name = 'esnode'
    res.render('index')
  })

  const axios = require('axios')

  function randomInteger(min, max) {
    // random integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function addViews(arr){
    // process data with most views
    let mapped = arr.map((item)=>{
      item['views'] = randomInteger(1000, 10000)
      return item
    })
    mapped.sort((a,b)=>{return b.views - a.views})
    return mapped.slice(0, 1)
  }



  app.get('/data', async (req, res) => {

    // get cache
    let client = await mongodClient.connect(url)
    let db = client.db("cache")
    let cacheData = await db.collection("cache").findOne({_id: new ObjectId('6469d09cfa44df6aa2570283')})
    let cache = cacheData.cache
    // look inside cache
    if(cache.length > 0){
      let lastItem = cache.slice(-1)
      let lastTime = new Date(String(lastItem[0].date))
      let now = new Date()
      if((((now - lastTime)/1000)/3600) < 10){
        // less than 10 hours
        // return data from cache
        return res.json({
          'articles': lastItem[0].articles,
          'error': false,
          'message': 'Success'
        })
      }
    }
    
    // more than 10 hours process data
    let outData = []

    // get all 12 sports data
    let UFCData = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=18182')
    let F1Data = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=718')
    let BoxingData = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=2192')
    let NBAdata = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=19209')
    let NASCARdata = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=10386')
    let WWEdata = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=18245')
    let NFLdata = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=14551')
    let TENNISdata = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=507')
    let GOLFdata = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=2803')
    let SWIMdata = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=2207')
    let OLYMPICSdata = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=2161')
    let BASEBALLdata = await axios.get('https://www.essentiallysports.com/api/category-post-search/?page=1&perPage=20&category=10500')

    // parse all 12 sports data
    let UFCarr = addViews([...UFCData.data.articles])
    let F1arr = addViews([...F1Data.data.articles])
    let Boxingarr = addViews([...BoxingData.data.articles])
    let NBAarr = addViews([...NBAdata.data.articles])
    let NASCARarr = addViews([...NASCARdata.data.articles])
    let WWEarr = addViews([...WWEdata.data.articles])
    let NFLarr = addViews([...NFLdata.data.articles])
    let TENNISarr = addViews([...TENNISdata.data.articles])
    let GOLFarr = addViews([...GOLFdata.data.articles])
    let SWIMarr = addViews([...SWIMdata.data.articles])
    let OLYMPICSarr = addViews([...OLYMPICSdata.data.articles])
    let BASEBALLarr = addViews([...BASEBALLdata.data.articles])

    // push data to out arr
    outData.push(...UFCarr)
    outData.push(...F1arr)
    outData.push(...Boxingarr)
    outData.push(...NBAarr)
    outData.push(...NASCARarr)
    outData.push(...WWEarr)
    outData.push(...NFLarr)
    outData.push(...TENNISarr)
    outData.push(...GOLFarr)
    outData.push(...SWIMarr)
    outData.push(...OLYMPICSarr)
    outData.push(...BASEBALLarr)

    outData.sort((a,b)=>{return b.views - a.views})
    let outarr = outData.slice(0, 5)
    
    // update cache
    let now = new Date()
    cache.push({
      'date': now.toISOString(),
      'articles': outarr
    })
    let insertCache = cache
    let insertedData = await db.collection("cache").updateOne({_id:new ObjectId('6469d09cfa44df6aa2570283')},{$set:{cache:insertCache}})

    // return processed data
    return res.json({
      'articles': outarr,
      'error': false,
      'message': 'Success'
    })
  })

}
