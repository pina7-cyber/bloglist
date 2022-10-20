const dummy = (blogs) => {
  blogs = 1
  return blogs
}

const totalLikes = (array) => {
  const reducer = (sum, blog) => {

    return sum + blog.likes
  }

  return array.reduce(reducer, 0)
}

const favoriteBlog = (array) => {
  const reducer = (likes, blog) => {
    if (blog.likes > likes)
      return blog.likes
    else return likes
  }
  const mostLikes = array.reduce(reducer, 0)
  const favoriteBlog = array.find(blog => blog.likes === mostLikes)
  if(favoriteBlog)
    return ({ title: favoriteBlog.title, author: favoriteBlog.author, likes: favoriteBlog.likes } )
  else return undefined
}

const mostBlogs = (array) => {
  const reducer1 = (authorsInfo, blog) => {
    if (authorsInfo.find(item => item.author === blog.author))
    {   const author = authorsInfo.find(item => item.author === blog.author)
      author.blogs = author.blogs + 1
      return authorsInfo}
    else {authorsInfo.push({ author: blog.author, blogs: 1 })
      return authorsInfo}
  }
  const authorList = array.reduce(reducer1, [])

  const reducer2 = (blogs, author) => {
    if (author.blogs > blogs)
      return author.blogs
    else return blogs
  }
  const mostBlogs = authorList.reduce(reducer2, 0)

  return authorList.find(item => item.blogs === mostBlogs)
}

const mostLikes = (array) => {
  const reducer1 = (authorsInfo, blog) => {
    if (authorsInfo.find(item => item.author === blog.author))
    {   const author = authorsInfo.find(item => item.author === blog.author)
      author.likes = author.likes + blog.likes
      return authorsInfo}
    else {authorsInfo.push({ author: blog.author, likes: blog.likes })
      return authorsInfo}
  }
  const authorList = array.reduce(reducer1, [])

  const reducer2 = (likes, author) => {
    if (author.likes > likes)
      return author.likes
    else return likes
  }
  const mostLikes = authorList.reduce(reducer2, 0)

  return authorList.find(item => item.likes === mostLikes)
}

module.exports = {
  dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes
}