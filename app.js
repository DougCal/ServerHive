const redis = require('redis');

const port = 6379;
const host = '127.0.0.1';
const client = redis.createClient(port, host);

client.on('connect', () => {
  console.log('connected');
});

client.set('Darrick', 'isTired', (err, reply) => {
  console.log(reply);
});

//reply will be empty if key does not exist
client.get('Darrick', (err, reply) => {
  console.log(reply);
})

//from tutorial: Many times storing simple values won’t solve your problem. 
//You will need to store hashes (objects) in Redis. For that you can use hmset()
client.hmset('frameworks', 'javascript', 'AngularJS', 'css', 'Bootstrap', 'node', 'Express');

//ALTERNATIVE SYNTAX for HMSET
// client.hmset('frameworks', {
//     'javascript': 'AngularJS',
//     'css': 'Bootstrap',
//     'node': 'Express'
// });

//hgetall() is used to retrieve the value of the key. 
//If the key is found, the second argument to the callback will contain the value which is an object.
client.hgetall('frameworks', (err, object) => {
  console.log(object);
})

//list of items
client.rpush(['frameworks', 'angularjs', 'backbone'], (err, reply) => {
  console.log(reply); //prints number of elements of list
});

//retrieves elements in list 
client.lrange('frameworks', 0, -1, function (err, reply) {
  console.log(reply); // ['angularjs', 'backbone']

  //Just note that you get all the elements of the list by passing -1 as the third argument to lrange(). 
  //If you want a subset of the list, you should pass the end index here.
});

//Sets are similar to lists, but the difference is that they don’t allow duplicates. 
//So, if you don’t want any duplicate elements in your list you can use a set.
client.sadd(['tags', 'angularjs', 'backbonejs', 'emberjs'], function (err, reply) {
  console.log(reply); // 3
});

//retrieves members of set
client.smembers('tags', (err, reply) => {
  console.log(reply);
});

//checking for existence of keys
client.exists('key', (err, reply) => {
  if (reply === 1) {
    console.log('exists');
  } else {
    console.log('doesn\'t exist');
  }
});

//At times you will need to clear some keys and reinitialize them. 
//To clear the keys, you can use del command
client.del('frameworks', (err, reply) => {
  console.log(reply);
});

//give an expiration time to an existing key
client.set('key1', 'val1');
client.expire('key1', 30);


client.set('key1', 10, () => {

  //The incr() function increments a key value by 1. 
  //If you need to increment by a different amount, you can use incrby() function. 
  //Similarly, to decrement a key you can use the functions like decr() and decrby().

  client.incr('key1', (err, reply) => {
    console.log(reply); // 11
  });

  client.quit();
});