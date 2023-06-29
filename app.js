//jshint esversion:8

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Arijit_30:25xiB5KEwdAdDP7d@cluster0.o51te9w.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({})
    .then(function(foundItems){
      if(foundItems.length === 0){
        Item.insertMany(defaultItems)
          .then(function(){
            console.log("Successfully saved default items to DB.");
          })
          .catch(function(err){
            console.log(err);
          });
        res.redirect("/");
      }else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
              
    })
    .catch(function(err){
      console.log(err);
    });

});

app.get("/:customListName", async function(req, res){
  const customListName = lodash.capitalize(req.params.customListName);

  try{
    const data = await List.findOne({name: customListName});
    if(!data){
      //Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
    
      list.save();
      res.redirect("/" + customListName);
    }else{
      //Show an existing list
      res.render("list", {listTitle: data.name, newListItems: data.items});
    }
  }catch(err){
    console.log(err);
  } 
});

app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    try{
      const foundList = await List.findOne({name: listName});
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    }catch(err){
      console.log(err);
    }
  } 
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
      .then(function(){
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      })
      .catch(function(err){
        console.log(err);
      });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemId}}})
      .then(function(){
        res.redirect("/" + listName);
      })
      .catch(function(err){
        console.log(err);
      });
  }

  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
