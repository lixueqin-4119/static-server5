const fs=require('fs')
//读数据库
const usersString=fs.readFileSync('./db/users.json').toString()
const usersArray=JSON.parse(usersString)//把字符串变成对应的数组对象或其它
//console.log(typeof usersString + typeof usersArray)

//写数据库
const user3={id:3,name:'fuck',password:'zzz'}
usersArray.push(user3)
const string=JSON.stringify(usersArray)//把js对象变成string
fs.writeFileSync('./db/users.json',string)