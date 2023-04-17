var express = require("express");
var router = express.Router();

const AdultRecipe = require("../models/adultRecipes");
const BabyRecipe = require("../models/babyRecipes");
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
      .then((household) => {
        if (household) {
          // comparaison de la derniere génération des recettes.

          let timepast = Date.now() - household.createdAt;
          //Si >7 jours (604800000 ms) regeneration et on renvoie les recettes de weeklyRecipes
          if (timepast < 604800000) {
            //On va chercher toutes les recettes bébés
            BabyRecipe.find({ usage: "repas" }).then((babyRecipes) => {
              let babyIDList = babyRecipes.map((recipe) => recipe._id);
              console.log(babyIDList);
              let randomizedWeeklyBabyRecipes =
                generateRandomRecipes(babyIDList);
              console.log(randomizedWeeklyBabyRecipes);
              // le reste de votre code pour générer et mettre à jour les recettes hebdomadaires

              //On va chercher toutes les recettes parents
              AdultRecipe.find().then((adultRecipes) => {
                let adultIDList = adultRecipes.map((recipe) => recipe._id);
                console.log("adult", adultIDList);
                // on en prend 14 avec des nombres aléatoires via la fonction generateRandomRecipes
                let randomizedWeeklyAdultRecipes =
                  generateRandomRecipes(adultIDList);
                console.log(
                  "randomizedAdultRecipes",
                  randomizedWeeklyAdultRecipes
                );

                let randomizedWeeklyRecipes = [];
                for (i = 0; i < 14; i++) {
                  randomizedWeeklyRecipes.push({
                    baby: randomizedWeeklyBabyRecipes[i],
                    adult: randomizedWeeklyAdultRecipes[i],
                  });
                }

                // on update la collection household et on y pousse les 14 recettes
                console.log("randomizedcouples", randomizedWeeklyRecipes);

                Household.updateOne(
                  { _id: household._id },
                  { weeklyRecipes: randomizedWeeklyRecipes }
                ).then((data) => {
                  if (data.modifiedCount > 0) {
                    // reset du createdAt.

                    Household.updateOne(
                      { _id: household._id },
                      { createdAt: Date.now() }
                    ).then((data) => {
                      if (data.modifiedCount > 0) {
                        Household.findOne({ id: data._id })
                          .populate({
                            path: "weeklyRecipes",
                            populate: [{ path: "adult" }, { path: "baby" }],
                          })
                          .then((data) => {
                            res.json({
                              result: true,
                              recipes: data.weeklyRecipes,
                            });
                          });
                      }
                    });
                  } else {
                    res.json({
                      result: false,
                      error: "Recipes were not updated",
                    });
                  }
                });
              });
            });
          }
          //Sinon on prend les recettes de Weekly recipes.
          else {
            Household.findOne({ _id: household._id })
              .populate({
                path: "weeklyRecipes",
                populate: [{ path: "adult" }, { path: "baby" }],
              })
              .then((data) => {
                console.log(data);
                if (data) {
                  res.json({
                    result: true,
                    recipes: data.weeklyRecipes,
                  });
                } else {
                  res.json({
                    result: false,
                    error: "No recipe was found",
                  });
                }
              });
          }
        } else {
          res.json({
            result: false,
            error: "User is not linked to any household",
          });
        }
      });
  });
});

router.get("/babyTest", (req, res) => {
  BabyRecipe.findOne({ title: "Ma première purée de carotte" }).then(
    (recipe) => {
      res.json({ recipe });
    }
  );
});

router.get("/adultTest", (req, res) => {
  AdultRecipe.findOne({ title: "Patate douce sautée" }).then((recipe) => {
    res.json({ recipe });
  });
});

//search for a baby recipe by keyword contained in the title
router.post("/searchKeyWord", (req, res) => {
  const searchRequest = req.body.request; // Get the search body from the request

  //Split the search body into individuals keywords
  const keywords = searchRequest.split(" ");

  // Use Mongoose to search for items matching the keywords
  BabyRecipe.find({
    $and: keywords.map((keyword) => ({
      title: { $regex: keyword, $options: "i" }, // Search by recipe title
    })),
  }).then((data) => {
    if (data.length > 0) {
      res.json({ result: "true", recipes: data });
    } else {
      res.json({ result: "false", error: "Pas de recette correspondante" });
    }
  });
});

router.post("/addLikedRecipe", (req, res) => {
  // Récupérer l'id de l'user via le token
  User.findOne({ token: req.body.token }).then((user) => {
    console.log("user", user);
    if (user === null) {
      res.json({ result: false, error: "User not found" });
      return;
    }
    // Avec cet id aller chercher l'household correspondant
    Household.findOne({ users: user._id }).then((household) => {
      if (household) {
        // Corriger la mise à jour de l'objet en utilisant le bon champ pour stocker l'ID de la recette
        Household.updateOne(
          { _id: household._id },
          { $push: { likedRecipes: req.body.recipedID } }
        ).then((data) => {
          if (data.nModified > 0) {
            // Corriger la recherche de l'objet Household mis à jour en utilisant le bon champ pour stocker l'ID
            Household.findOne({ _id: household._id })
              .populate({
                path: "likedRecipes",
                populate: [{ path: "adult" }, { path: "baby" }],
              })
              .then((data) => {
                res.json({
                  result: true,
                  recipes: data.likedRecipes,
                });
              });
          } else {
            res.json({
              result: false,
              error: "Liked recipe was not added",
            });
          }
        });
      } else {
        res.json({
          result: false,
          error: "Household not found",
        });
      }
    });
  });
});

module.exports = router;
