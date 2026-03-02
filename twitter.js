const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const dbpath = path.join(__dirname, 'twitterClone.db')
let db = null
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const initalConnectionServerToDB = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(`Server is starting .....3000`)
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
  }
}
initalConnectionServerToDB()

const authenticateToken = (request, response, next) => {
  const authHeader = request.headers['authorization']
  let jwtToken
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'My_keerthana', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username

        next()
      }
    })
  }
}

app.post(`/register/`, async (request, response) => {
  const {username, password, name, gender} = request.body
  const hashedpassword = await bcrypt.hash(password, 10)
  const selectQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(selectQuery)
  if (dbUser !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else {
    const passwordLen = password.length
    if (passwordLen < 6) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const creator = `INSERT INTO user(username,password,name,gender) VALUES('${username}','${hashedpassword}','${name}','${gender}');`
      await db.run(creator)
      response.status(200)
      response.send('User created successfully')
    }
  }
})

app.post(`/login/`, async (request, response) => {
  const {username, password} = request.body
  const selectQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(selectQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const ispasswordMatch = await bcrypt.compare(password, dbUser.password)
    if (ispasswordMatch === true) {
      const payload = {username: username}
      const jwtToken = jwt.sign(payload, 'My_keerthana')
      response.send({jwtToken: jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.get(`/user/tweets/feed/`, authenticateToken, async (request, response) => {
  const {username} = request
  const userpay = `SELECT * FROM user WHERE username='${username}'`
  const res = await db.get(userpay)
  const geta = `SELECT username,tweet,date_time as dateTime FROM tweet JOIN user ON tweet.user_id=user.user_id WHERE tweet.user_id IN (SELECT following_user_id FROM follower WHERE follower_user_id=${res.user_id}) ORDER BY tweet.date_time DESC LIMIT 4;`
  const f = await db.all(geta)
  response.send(f)
})

app.get(`/user/following/`, authenticateToken, async (request, response) => {
  const {username} = request
  const userpay = `SELECT * FROM user WHERE username='${username}'`
  const res = await db.get(userpay)
  const userfollowing = `SELECT name FROM user WHERE user_id IN (SELECT following_user_id FROM follower WHERE follower_user_id=${res.user_id});`
  const dbres = await db.all(userfollowing)
  response.send(dbres)
})

app.get(`/user/followers/`, authenticateToken, async (request, response) => {
  const {username} = request
  const userpay = `SELECT * FROM user WHERE username='${username}'`
  const res = await db.get(userpay)
  const userfollowing = `SELECT name FROM user WHERE user_id IN (SELECT follower_user_id FROM follower WHERE following_user_id=${res.user_id});`
  const dbres = await db.all(userfollowing)
  response.send(dbres)
})
const check = async (user_id, tweet_id) => {
  const followequery = `SELECT tweet.tweet_id FROM tweet JOIN follower ON tweet.user_id = follower.following_user_id WHERE follower.follower_user_id = ${user_id} AND tweet.tweet_id = ${tweet_id}`
  const isFollowing = await db.get(followequery)
  return isFollowing !== undefined
}
app.get(`/tweets/:tweetId/`, authenticateToken, async (request, response) => {
  const {username} = request
  const {tweetId} = request.params
  const userpay = `SELECT * FROM user WHERE username='${username}'`
  const res = await db.get(userpay)
  const access = await check(res.user_id, tweetId)
  if (!access) {
    return response.status(401).send('Invalid Request')
  }
  const tweetquery = `SELECT tweet,(SELECT COUNT(*) FROM like WHERE like.tweet_id=${tweetId}) AS likes,(SELECT COUNT(*) FROM reply WHERE reply.tweet_id=${tweetId}) as replies,date_time as dateTime FROM tweet WHERE tweet_id=${tweetId};`
  const final = await db.get(tweetquery)
  response.send(final)
})

app.get(
  `/tweets/:tweetId/likes/`,
  authenticateToken,
  async (request, response) => {
    const {username} = request
    const {tweetId} = request.params
    const userpay = `SELECT * FROM user WHERE username='${username}'`
    const res = await db.get(userpay)
    const access = await check(res.user_id, tweetId)
    if (!access) {
      return response.status(401).send('Invalid Request')
    }
    const tweetquery = `SELECT user.username FROM user JOIN like ON user.user_id=like.user_id WHERE like.tweet_id=${tweetId};`
    const final = await db.all(tweetquery)
    response.send({likes: final.map(each => each.username)})
  },
)

app.get(
  `/tweets/:tweetId/replies/`,
  authenticateToken,
  async (request, response) => {
    const {username} = request
    const {tweetId} = request.params
    const userpay = `SELECT * FROM user WHERE username='${username}'`
    const res = await db.get(userpay)
    const access = await check(res.user_id, tweetId)
    if (!access) {
      return response.status(401).send('Invalid Request')
    }
    const tweetquerys = `SELECT name, reply FROM user JOIN reply ON user.user_id=reply.user_id WHERE reply.tweet_id=${tweetId};`
    const final = await db.all(tweetquerys)
    response.send({replies: final.map(each => each)})
  },
)

app.get(`/user/tweets/`, authenticateToken, async (request, response) => {
  const {username} = request
  const userpay = `SELECT * FROM user WHERE username='${username}'`
  const res = await db.get(userpay)
  const tweetquery = `SELECT tweet.tweet,COUNT(DISTINCT like.like_id) AS likes,COUNT(DISTINCT reply.reply_id) AS replies,tweet.date_time AS dateTime FROM tweet LEFT JOIN like  ON like.tweet_id = tweet.tweet_id LEFT JOIN reply ON reply.tweet_id = tweet.tweet_id WHERE tweet.user_id =${res.user_id} GROUP BY tweet.tweet_id ORDER BY tweet.date_time DESC;`
  const final = await db.all(tweetquery)
  response.send(final)
})

app.post(`/user/tweets/`, authenticateToken, async (request, response) => {
  const {tweet} = request.body
  const {username} = request
  const userpay = `SELECT * FROM user WHERE username='${username}'`
  const res = await db.get(userpay)
  const createQuery = `INSERT INTO tweet(tweet,user_id) VALUES('${tweet}',${res.user_id})`
  const dbuser = await db.run(createQuery)
  response.send('Created a Tweet')
})

app.delete(
  `/tweets/:tweetId/`,
  authenticateToken,
  async (request, response) => {
    const {username} = request
    const {tweetId} = request.params
    const userpay = `SELECT * FROM user WHERE username='${username}'`
    const res = await db.get(userpay)
    const tweet = await db.get(
      `SELECT * FROM tweet WHERE tweet_id = ${tweetId}`,
    )

    if (!tweet || tweet.user_id !== res.user_id) {
      return response.status(401).send('Invalid Request')
    }
    const deleteQuery = `DELETE FROM tweet WHERE tweet_id=${tweetId}`
    await db.run(deleteQuery)
    response.send('Tweet Removed')
  },
)
module.exports = app
