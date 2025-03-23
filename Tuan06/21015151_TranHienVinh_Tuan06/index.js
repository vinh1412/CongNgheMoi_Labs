const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./views"));
app.set("view engine", "ejs");
app.set("views", "./views");
require("dotenv").config();

// config aws dynamodb
const AWS = require("aws-sdk");
const config = new AWS.Config({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-southeast-1",
});
AWS.config = config;

const docClient = new AWS.DynamoDB.DocumentClient();

const tableName = "SanPham";

const multer = require("multer");

const upload = multer();

app.get("/", (request, response) => {
  const params = {
    TableName: tableName,
  };
  docClient.scan(params, (err, data) => {
    if (err) {
      response.send("Internal Server Error");
    } else {
      response.render("index", {
        sanPhams: data.Items,
      });
    }
  });
});

app.post("/", upload.fields([]), (request, response) => {
  const { ma_sp, ten_sp, so_luong } = request.body;
  const params = {
    TableName: tableName,
    Item: {
      ma_sp: Number(ma_sp),
      ten_sp: ten_sp,
      so_luong: Number(so_luong),
    },
  };
  docClient.put(params, (err, data) => {
    if (err) {
      response.send("Internal Server Error");
    } else {
      response.redirect("/");
    }
  });
});

app.post("/delete", upload.fields([]), (request, response) => {
  const listItems = Object.keys(request.body);
  if (listItems.length === 0) {
    return response.redirect("/");
  }

  function onDeleteItem(index) {
    const params = {
      TableName: tableName,
      Key: {
        ma_sp: Number(listItems[index]),
      },
    };

    docClient.delete(params, (err, data) => {
      if (err) {
        response.send("Internal Server Error");
      } else {
        if (index > 0) {
          onDeleteItem(index - 1);
        } else {
          return response.redirect("/");
        }
      }
    });
  }
  onDeleteItem(listItems.length - 1);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000!");
});
