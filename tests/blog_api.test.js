const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('../utils/blog_api_test_helper')
const bcrypt = require('bcrypt')

const Blog = require('../models/blog')
const User = require('../models/user')



beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  const hash1 = await bcrypt.hash('sekret', 10)
  const hash2 = await bcrypt.hash('topsekret', 10)
  const user1 = new User({ username: 'userWithBlogs', passwordHash: hash1 })
  const user2 = new User({ username: 'userWithoutBlogs', passwordHash: hash2 })

  await user2.save()

  const blogObjects = helper.initialBlogs
    .map(blog => new Blog({
      title: blog.title,
      url: blog.url,
      likes: blog.likes,
      date: new Date(),
      author: blog.author,
      creator: user1.username,
      user: user1._id
    },))

  const promiseArray = blogObjects.map(blog => blog.save())
  const savedBlogObjects = await Promise.all(promiseArray)
  savedBlogObjects.map(blog => user1.blogs = user1.blogs.concat(blog._id))

  await user1.save()
})

describe('when there are initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('unique identifier property is named id', async () => {
    const response = await api.get('/api/blogs')
    const firstblog = response.body[0]
    expect(firstblog.id).toBeDefined()
  })
})

describe('addition of a blog', () => {
  test('a valid blog can be added', async () => {
    const newBlog = {
      title: 'App-inventor',
      author: 'Maria Eckarts',
      url: 'www.myownapp.de',
      likes: 75
    }

    const user = await User.findOne({ username: 'userWithBlogs' })
    const token = helper.token(user)

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', 'Bearer ' + token)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogs = await Blog.find({})
    const blogsAtEnd = blogs.map(blog => blog.toJSON())
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(n => n.title)
    expect(titles).toContain(
      'App-inventor'
    )
  })

  test('if likes property is missing, it defaults to 0', async () => {
    const newBlog = {
      title: 'Informatic News',
      author: 'Jochen Schweitzer',
      url: 'www.brandnews.de',
    }

    const user = await User.findOne({ username: 'userWithBlogs' })
    const token = helper.token(user)

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', 'Bearer ' + token)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blog = await Blog.find({ title: 'Informatic News' })
    expect(blog[0].likes).toEqual(0)
  })

  test('if title or url is missing, responds with 400 Bad Request', async () => {
    const newBlog = {
      author: 'Maria Eckarts',
      url: 'www.myownapp.de',
      likes: 75
    }

    const user = await User.findOne({ username: 'userWithBlogs' })
    const token = helper.token(user)

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', 'Bearer ' + token)
      .expect(400)
      .expect('Content-Type', /application\/json/)
  })

  test('if token is not provided, adding a blog fails with 401 Unauthorized ', async () => {
    const newBlog = {
      title: 'App-inventor',
      author: 'Maria Eckarts',
      url: 'www.myownapp.de',
      likes: 75
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    const blogs = await Blog.find({})
    const blogsAtEnd = blogs.map(blog => blog.toJSON())
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

    const titles = blogsAtEnd.map(n => n.title)
    expect(titles).not.toContain(
      'App-inventor'
    )
  })
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const BlogsAtStart = await Blog.find({})
    const blogToDelete = BlogsAtStart[0]

    let user = await User.findOne({ username: 'userWithBlogs' })
    const userBlogsAtStart = user.blogs
    const token = helper.token(user)

    await api
      .delete(`/api/blogs/${blogToDelete._id}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(204)

    const blogsAtEnd = await Blog.find({})
    user = await User.findOne({ username: 'userWithBlogs' })
    const userBlogsAtEnd = user.blogs

    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length - 1
    )

    expect(userBlogsAtEnd).toHaveLength(
      userBlogsAtStart.length - 1
    )

    const titles = blogsAtEnd.map(r => r.title)
    const userTitles = userBlogsAtEnd.map(r => r.title)

    expect(titles).not.toContain(blogToDelete.title)
    expect(userTitles).not.toContain(blogToDelete.title)
  })
  test('if user is not the creator, responds with 401', async () => {
    let blogs = await Blog.find({})
    const blogsAtStart = blogs.map(blog => blog.toJSON())
    const blogToDelete = blogsAtStart[0]

    const user = await User.findOne({ username: 'userWithoutBlogs' })
    const token = helper.token(user)

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(401)

    blogs = await Blog.find({})
    const blogsAtEnd = blogs.map(blog => blog.toJSON())

    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length
    )

    const titles = blogsAtEnd.map(r => r.title)

    expect(titles).toContain(blogToDelete.title)
  })
})

describe('update of a blog', () => {
  test('likes and title can be updated', async () => {
    const blogs1 = await Blog.find({})
    const blogsAtStart = blogs1.map(blog => blog.toJSON())
    const blogToUpdate = blogsAtStart[0]

    const update = {
      title: 'updated Title',
      likes: blogToUpdate.likes + 1
    }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(update)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const updatedBlog = await Blog.find({ _id: blogToUpdate.id })

    expect(updatedBlog[0].likes).toEqual(
      blogToUpdate.likes + 1
    )
    expect(updatedBlog[0].title).toEqual(
      'updated Title'
    )
  })
})

afterAll(() => {
  mongoose.connection.close()
})