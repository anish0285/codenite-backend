const app = require("express")();
const fileupload = require("express-fileupload");
const bodyparser = require("body-parser");
const {
  getQuestion,
  getRandomQuestion,
  addQuestion,
  runQuestion,
  deleteQuestion,
} = require("./routes/questions");

const PORT = 5000;
app.use(fileupload());
app.use(bodyparser.json());

// question routes
app.get("/question/get/:id", getQuestion);
app.get("/question/random", getRandomQuestion);
app.post("/question/run/:id", runQuestion);
app.post("/question", addQuestion);
app.delete("/question/:id", deleteQuestion);

app.listen(PORT, () => console.log("app listening at port " + PORT));
