var express = require("express");
var router = express.Router();

/* GET users listing. */
let Manu = "Manu";
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
  console.log(Manu);
});


module.exports = router;
