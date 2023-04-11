var express = require("express");
var router = express.Router();

const AdultRecipe = require("../models/adultrecipes");
const BabyRecipe = require("../models/babyrecipes");
const Household = require("../models/households");
const User = require("../models/users");

function generateRandomRecipes(arr) {
  let recipeList = [];
  let mid = [];
  let arr2 = [...arr];
  for (let i = 0; i < 14; i++) {
    let randomNumber = Math.floor(Math.random() * arr2.length);
    mid.push(arr2[randomNumber]);
    arr2.splice(randomNumber, 1);
  }

  for (let i = 0; i < 14; i++) {
    recipeList.push(mid[i]);
  }

  return recipeList;
}

//weekly/POST (save dans la BD les 14 couples de recettes 1 baby + 1 adult,
//  match via in$ dans MongoDB, envoyer dans le front la recette avec les portions en fonction du HH,
//  1 fetch pour chaque jour de la semaine)

router.post("/weekly", (req, res) => {
  //recuperer l'id de l'user via le token
  User.findOne({ token: req.body.token }).then((user) => {
    console.log("user", user);
    if (user === null) {
      res.json({ result: false, error: "User not found" });
      return;
    }
    // avec cet id aller chercher l'household correspondant
    Household.findOne({ users: user._id })
      .populate("users")
      .then((data) => {
        if (!data) {
          res.json({
            result: false,
            error: "User is not linked to any household",
          });
        }
        // comparaison de la derniere génération des recettes.
        let timepast = Date.now() - data.createdAt;
        //Si >7 jours (604800000 ms) regeneration et on renvoie les recettes de weeklyRecipes
        if (timepast < 604800000) {
          //On va chercher toutes les recettes bébés
          BabyRecipe.find().then((data) => {
            babyIDList = data.map((data) => {
              return data._id;
            });
            console.log(babyIDList);
            // on en prend 14 avec des nombres aléatoires via la fonction generateRandomRecipes
            randomizedWeeklyBabyRecipes = generateRandomRecipes(babyIDList);
            console.log(randomizedWeeklyBabyRecipes);
            // ATTENTION A METTRE APRES PARENTS ET POUSSER LE COUPLE
            // on update la collection household et on y pousse les 14 recettes
            Household.updateOne(
              { id: data._id },
              { weeklyRecipes: randomizedWeeklyBabyRecipes }
            ).then((data) => {
              console.log(data);
            });
          });
        }
        //
        // LA IL FAUT COPIER LE CODE DES BABYS ET LE FAIRE POUR ADULT PUIS POUSSER LE COUPLE
        //

        //Sinon on prend les recettes de Weekly recipes.
        else {
        }
      });
  });
});

module.exports = router;
