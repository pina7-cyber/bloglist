const jwt = require('jsonwebtoken')

const initialBlogs = [
  {
    title: 'Bitcoin',
    author: 'Blockchain-Freak',
    url: 'www.blockchain.de',
    likes: 78,
  },
  {
    title: 'Fullstack',
    author: 'Frontend-Backend',
    url: 'www.fullstack.de',
    likes: 987,
  },
]

const token = (user) => {
  const userForToken = {
    username: user.username,
    id: user._id,
  }
  return jwt.sign(userForToken, process.env.SECRET)
}

module.exports = {
  initialBlogs,
  token
}