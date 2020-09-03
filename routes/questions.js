const mongo = require("mongodb");
const fs = require("fs");
const FormData = require("form-data");
const uuid = require("uuid");
const axios = require("axios");
const e = require("express");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;
const supportedlangs = ["js", "java", "py", "cs", "cpp", "ts"];
axios.defaults.baseurl = "";

exports.getQuestion = (req, res) => {
  let reqId = req.params.id;
  mongo.connect(databaseUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) return err;
    let db = client.db("codenite");
    let collection = db.collection("questions");
    collection.findOne({ _id: mongo.ObjectId(reqId) }, (err, doc) => {
      if (err) return err;
      return res.json(doc).status(201);
    });
  });
};

exports.getRandomQuestion = (req, res) => {
  avoidids = req.body.avoidids;
  mongo.connect(databaseUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) return err;
    let db = client.db("codenite");
    let collection = db.collection("questions");
    collection.countDocuments({}, (err, doc) => {
      if (err) return err;
      if (avoidids.length === doc) {
        avoidids = [];
      }
      collection.find({}, { projection: { _id: 1 } }).toArray((err, result) => {
        if (err) return err;
        questionsids = [];
        result.forEach((obj) => {
          questionsids.push(obj._id.toHexString());
        });
        questionids = questionsids.filter((id) => !avoidids.includes(id));
        var randques =
          questionids[Math.floor(Math.random() * questionids.length)];
        collection.findOne({ _id: mongo.ObjectId(randques) }, (err, doc) => {
          if (err) return err;
          return res.json(doc).status(201);
        });
      });
    });
  });
};

exports.addQuestion = (req, res) => {
  console.log(req.files);
  let data = {};
  try {
    data.question = mongo.Binary(req.files.question.data);
    data.info = mongo.Binary(req.files.info.data);
    inouts = JSON.parse(req.files.inouts.data);
    data.inputs = inouts.inputs;
    data.expected = inouts.expected;
    data.title = inouts.title;
    supportedlangs.forEach((lang) => {
      data[lang] = mongo.Binary(req.files[lang].data);
    });
  } catch (err) {
    return res.json({ error: err }).status(500);
  }
  mongo.connect(databaseUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) return err;
    let db = client.db("codenite");
    let collection = db.collection("questions");
    collection.insertOne(data, (err, doc) => {
      return res.json({ questionId: doc.insertedId }).status(201);
    });
  });
};

exports.runQuestion = (req, res) => {
  let reqId = req.params.id;
  let unid = uuid.v4();
  mongo.connect(databaseUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) return err;
    let db = client.db("codenite");
    let collection = db.collection("questions");
    let retdata = {};
    collection.findOne({ _id: mongo.ObjectId(reqId) }, (err, doc) => {
      if (err) return err;
      retdata.inputs = doc.inputs;
      retdata.expected = doc.expected;
      // outputs
      info = doc.info.buffer;
      runfile = req.files.runfile.data;
      extension = req.files.runfile.name.split(".").pop();
      fs.writeFileSync(`./filemanager/${unid}.json`, info);
      fs.writeFileSync(`./filemanager/${unid}.${extension}`, runfile);
      var form = new FormData();
      form.append("inputs", fs.createReadStream(`./filemanager/${unid}.json`));
      form.append(
        "functions",
        fs.createReadStream(`./filemanager/${unid}.${extension}`)
      );
      axios
        .post("http://127.0.0.1:5001/compile", form, {
          headers: form.getHeaders(),
        })
        .then((response) => {
          fs.unlink(`./filemanager/${unid}.json`, () => {});
          fs.unlink(`./filemanager/${unid}.${extension}`, () => {});
          data = response.data;
          if (data.stdout) retdata.stdout = data.stdout;
          else if (data.stderr) retdata.stderr = data.stderr;
          console.log(response.data.stdout);
          return response.data.stdout;
        })
        .then((output) => {
          correctArr = [];
          if (retdata.stdout) {
            retdata.expected.forEach((expected, index) => {
              correctArr.push(expected === retdata.stdout[index]);
            });
          } else if (retdata.stderr) {
            retdata.expected.forEach(() => {
              correctArr.push(false);
            });
          }
          retdata.correct = correctArr;
        })
        .then(() => {
          return res.json(retdata).status(201);
        });
    });
  });
};

exports.deleteQuestion = (req, res) => {
  let reqId = req.params.id;
  mongo.connect(databaseUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) return err;
    let db = client.db("codenite");
    let collection = db.collection("questions");
    collection.deleteOne({ _id: mongo.ObjectId(reqId) }, (err, doc) => {
      if (err) return err;
      return res.json({ message: "question deleted successfully" }).status(201);
    });
  });
};
