const app = require("express")();
const fileupload = require("express-fileupload");
const {
  getQuestion,
  getRandomQuestion,
  addQuestion,
  runQuestion,
} = require("./routes/questions");

const PORT = 5000;
app.use(fileupload());

// question routes
app.get("/question/:id", getQuestion);
app.get("/question/random", getRandomQuestion);
app.post("/question/run/:id", runQuestion);
app.post("/question", addQuestion);

app.listen(PORT, () => console.log("app listening at port " + PORT));
