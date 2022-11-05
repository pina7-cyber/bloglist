const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1, id: 1 })
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body
  const user = request.user
  if (!request.user) {
    return response.status(401).json({ error: 'Unauthorized ' })
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id,
    creator: user.username
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  const blogToRemove = await Blog.findById(request.params.id)
  if (!blogToRemove) {
    return response.status(404).json({ error: 'blog is already removed' })
  }

  const user = request.user
  if (!request.user) {
    return response.status(401).json({ error: 'Unauthorized ' })
  }

  if (blogToRemove.user.toString() === user._id.toString() ) {
    await Blog.deleteOne(blogToRemove)
    user.blogs = user.blogs.remove(blogToRemove._id)
    await user.save()
    return response.status(204).end()
  } else {
    return response.status(401).json({ error: 'must be creator of blog to delete it' })
  }
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  }

  const result = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.status(200).json(result)
})

module.exports = blogsRouter

