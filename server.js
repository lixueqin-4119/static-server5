var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url 
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/
  const session=JSON.parse(fs.readFileSync('./session.json').toString())

  console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
  if(path === "sign_in" && method === "post"){
    const userArray=JSON.parse(fs.readFileSync('./db/users.json'))
    const array=[]
    request.on('data',(chunk)=>{
      array.push(chunk)
    })
    request.on('end',()=>{
      const string=Buffer.concat(array).toString()
     const obj=JSON.parse(string)//name password
     const user=userArray.find((user)=>user.name === obj.name && user.password === ogj.password)
      if(user === undefined){//无票禁入
        response.statusCode=400
        response.setHeader('Content-Type','text/json;charset=utf-8')//告诉浏览器返回的是json
        response.end(`{"errorCode":4001}`)//每个公司文档都有errorCode编码，自己定义的
      }else{//入园凭证->发票
        response.statusCode=200
        const random=Math.random()
        const session=JSON.parse(fs.readFileSync('./session.json').toString())//把session读出来并把它变成对象
        session[random]={user_id:user.id}//session里random的值等于
        fs.writeFileSync('./session.json',JSON.stringify(session))//把session存一下
        response.setHeader('Set-Cookie',`sameSite=none; secure=true; session_id=${random}; HttpOnly`) //把id给浏览器//true已登陆//HttpOnly只能后端操作cookie
      }
      response.end()
    });
  }else if(path==='/home.html'){//检票，读取cookie
      const cookie=request.headers['cookie'];
      let sessionId;
      try{
        sessionId=cookie.split(';').filter(s=>s.indexOf('session_id=')>=0)[0].split('=')[1]//user_id=2 ->'user_id' '2'->2
      }catch(error){}
      if(sessionId && session[sessionId]){
        const userId=session[sessionId].user_id
        const userArray=JSON.parse(fs.readFileSync("./db/users.json"));
        const user=userArray.find(user=>user.id===userId)
        const homeHtml=fs.readFileSync('./public/home.html').toString();//返回值可能是String也可能是Buffer类型，默认不是string
        //.toString()能确保是String类型，后面的JSON.parse才能正常处理
        let string=''
        if(user){
          const string=homeHtml.replace('{{loginStatus}}','已登陆')//替换成已登陆
          .replace('{{user.name}}',user.name)
        }
        response.write(string);
      }else{
        const homeHtml=fs.readFileSync('./public/home.html').toString();//默认不是string所以要toString下
        const string=homeHtml.replace('{{loginStatus}}','未登陆')//替换成已登陆
        .replace('{{user.name}}','')
        
        response.write(string);
      }
      response.end("home")
  }else if(path==='/register' && method==='post'){
    response.setHeader('Content-Type','text/html;charset=utf-8')
    const userArray=JSON.parse(fs.readFileSync('./db/users.json'))
    const array=[]
    request.on('data',(chunk)=>{
      array.push(chunk)
    })
    request.on('end',()=>{
      const string=Buffer.concat(array).toString()
     const obj=JSON.parse(string)
      //console.log(obj.name)
      //console.log(obj.password)
      const lastUser=userArray[userArray.length-1]
      const newUser={
        //id为最后一个用户的id +1
        id:lastUser ? lastUser.id+1 : 1,
        name:obj.name,
        password:obj.password
      };
      userArray.push(newUser)
      fs.writeFileSync('./db/users.json',JSON.stringify(userArray))
      response.end()
    })
  }else{
    response.statusCode = 200
    const filePath = path === '/' ? '/index.html' : path //默认首页，很多浏览器都会默认加这句话
    const index=filePath.lastIndexOf('.')//从/开始数,最后一个是.;/index.html，6
    const suffix=filePath.substring(index)//suffix后缀 //获取下标
    //console.log(suffix)
    const fileTypes={
     '.html':'text/html',
     '.css':'text/css',
     '.js':'text/javascript',
     '.png':'image/png',
     '.jpg':'image/jpeg'
   }
   response.setHeader('Content-Type', `${fileTypes[suffix] || 'text/html'};charset=utf-8`)//如果取不到时'text/html'保底
    let content
    try{
        content=fs.readFileSync(`./public${filePath}`)
    }catch(error){
        content='文件不存在' 
        response.statusCode = 404
    }
    response.write(content)
    response.end()
  }
  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)
