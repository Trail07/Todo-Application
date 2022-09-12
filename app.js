const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const isMatch = require("date-fns/isMatch");
const format = require("date-fns/format");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//GET todo Status,priority,category= API 1

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchQProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const todoDbConvert = (objectItem) => {
  return {
    id: objectItem.id,
    todo: objectItem.todo,
    priority: objectItem.priority,
    status: objectItem.status,
    category: objectItem.category,
    dueDate: objectItem.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let todosQuery = "";
  const { search_q = " ", status, priority, category } = request.query;

  switch (true) {
    //has status
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        todosQuery = `select * from todo where status='${status}';`;
        const todoStatus = await db.all(todosQuery);
        response.send(todoStatus.map((eachTodo) => todoDbConvert(eachTodo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //has priority
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        todosQuery = `select * from todo where priority='${priority}';`;
        const todoPriority = await db.all(todosQuery);
        response.send(todoPriority.map((eachTodo) => todoDbConvert(eachTodo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // has priority and status

    case hasStatusAndPriorityProperties(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (
          priority === "HIGH" ||
          priority === "LOW" ||
          priority === "MEDIUM"
        ) {
          todosQuery = `select * from todo where status='${status}' AND priority='${priority}';`;
          const priorityAndStatus = await db.all(todosQuery);
          response.send(priority.map((eachTodo) => todoDbConvert(eachTodo)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // has search Item by name

    case hasSearchQProperty(request.query):
      todosQuery = `select * from todo where todo like '%${search_q}%';`;
      const searchItem = await db.all(todosQuery);
      response.send(searchItem.map((eachTodo) => todoDbConvert(eachTodo)));

      break;

    // has category and status

    case hasCategoryAndStatusProperties(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          todosQuery = `select * from todo where status='${status}' AND category='${category}';`;
          const categoryAndStatus = await db.all(todosQuery);
          response.send(
            categoryAndStatus.map((eachTodo) => todoDbConvert(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //has category

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        todosQuery = `select * from todo where category='${category}';`;
        const categoryResponse = await db.all(todosQuery);
        response.send(
          categoryResponse.map((eachTodo) => todoDbConvert(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //has category and priority

    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "LOW" ||
          priority === "MEDIUM"
        ) {
          todosQuery = `select * from todo where category='${category}' AND priority='${priority}';`;
          const categoryAndPriority = await db.all(todosQuery);
          response.send(
            categoryAndPriority.map((eachTodo) => todoDbConvert(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      todosQuery = `select * from todo`;
      const todosData = await db.all(todosQuery);
      response.send(todosData.map((eachTodo) => todoDbConvert(eachTodo)));
      break;
  }
});

//Get Todo Based on id

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id=${todoId};`;
  const todoResponse = await db.get(getTodoQuery);
  response.send(todoDbConvert(todoResponse));
});

//Get dueDate match list

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    //console.log(newDate);
    const getDueDateQuery = `select * from todo where due_date='${newDate}';`;
    const dueDateResponse = await db.all(getDueDateQuery);
    // console.log(dueDateResponse);
    response.send(dueDateResponse.map((eachTodo) => todoDbConvert(eachTodo)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//Create a Todo

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");

          const createTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
 VALUES(${id},'${todo}','${priority}','${status}','${category}','${newDate}');`;
          const getTodoResponse = await db.run(createTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

//UPDATE TODO

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let todoUpdateQuery = " ";

  const requestBody = request.body;
  const getTodoQuery = `select * from todo where id=${todoId};`;
  const todoResponse = await db.get(getTodoQuery);
  const {
    todo = todoResponse.todo,
    priority = todoResponse.priority,
    status = todoResponse.status,
    category = todoResponse.category,
    dueDate = todoResponse.due_date,
  } = requestBody;

  switch (true) {
    //status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        todoUpdateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' where id=${todoId};`;
        await db.run(todoUpdateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    // Priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        todoUpdateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'  where id=${todoId};`;
        await db.run(todoUpdateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    //todo Update

    case requestBody.todo !== undefined:
      todoUpdateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'  where id=${todoId};`;
      await db.run(todoUpdateQuery);
      response.send("Todo Updated");
      break;
    // category Updated
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        todoUpdateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}';`;
        await db.run(todoUpdateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    //DUE DATE UPDATE
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-mm-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-mm-dd");
        todoUpdateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}';`;
        await db.run(todoUpdateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
});

//DELETE todo

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE from todo where id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
