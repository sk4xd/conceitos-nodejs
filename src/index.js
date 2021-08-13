const express = require('express');
const cors = require('cors');

const { v4: uuidv4, v4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers; 

  const user = users.find(user => user.username === username);

  if(!user) {
   return response.status(404).json({error: 'Usuário não encontrado.'});
  }

  request.user = user;

  return next();
}

function checksUserTodoExists(request, response, next) {
  const { username } = request.headers; 

  const todos = users.find(user => user.username === username).todos;

  if(todos.length === 0) {
   return response.status(404).send({ error: 'Todo não encontrado' });
  }

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  let userExists = null;

  if (users.length > 0) {
    userExists = users.find(user => user.username === username);
  }

  if (userExists) {
    return response.status(400).json({error: 'O usuário já existe.'})
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  return response.status(200).json(request.user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;

  const todo = { 
      id: uuidv4(),
      title,
      done: false, 
      deadline: new Date(deadline), 
      created_at: new Date()
    }

  request.user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checksUserTodoExists, (request, response) => {
  const { id } = request.params;
  const { title, deadline } = request.body;
  const todos = request.user.todos;
  const todo = todos.find(todo => todo.id === id);

  if(!todo) {
    return response.status(404).send({ error: 'Todo não encontrado' });
  }

  todo.title = title;
  todo.deadline = deadline;

  return response.status(200).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksUserTodoExists, (request, response) => {
  const { id } = request.params;

  const userId = request.user.id;
  
  const todo = users.find(user => user.id === userId).todos.find(todo => todo.id === id);

  todo.done = true;

  return response.status(200).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksUserTodoExists, (request, response) => {
  const { id } = request.params;
  const userIndex = users.findIndex(user => user.id === request.user.id);
  const todoIndex = users[userIndex].todos.findIndex(todo => todo.id === id);

  if (todoIndex < 0) {
    return response.status(404).send({error: 'Todo não encontrado.'})
  }
  users[userIndex].todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = app;