var express = require("express");
var router = express.Router();

const AdultRecipe = require("../models/adultRecipes");
const BabyRecipe = require("../models/babyRecipes");
const Household = require("../models/households");
const User = require("../models/users");

//fonction générant des nombres aléatoires sur 14 itérations en fonction du tableau passé en parametre
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

//fonction qui s'appuie sur une recette de bébé pour selectionner une recette adulte correspondante
function getMatchPercentage(babyRecipe, adultRecipe) {
  let commonIngredientsCount = 0;
  let babyIngredientsCount = babyRecipe.ingredients.length;
  let adultIngredientsCount = adultRecipe.ingredients.length;

  // PERF Créez un index pour les ingrédients de la recette adulte
  const adultIngredientsIndex = new Set(
    adultRecipe.ingredients.map((ingredient) => ingredient.name.toString())
  );

  babyRecipe.ingredients.forEach((babyIngredient) => {
    if (adultIngredientsIndex.has(babyIngredient.name.toString())) {
      commonIngredientsCount++;
    }
  });

  let matchRate =
    ((commonIngredientsCount / adultIngredientsCount) * 100 +
      (commonIngredientsCount / babyIngredientsCount) * 100) /
    2;
  return matchRate;
}

//fonction qui va boucler sur les recettes bébés et adultes
function generateMatchedRecipes(babyRecipes, adultRecipes) {
  let matchedRecipes = [];

  // Générer les couples de recettes avec leur pourcentage de correspondance
  babyRecipes.forEach((babyRecipe) => {
    adultRecipes.forEach((adultRecipe) => {
      const matchPercentage = getMatchPercentage(babyRecipe, adultRecipe);
      if (matchPercentage >= 30) {
        matchedRecipes.push({
          baby: babyRecipe._id,
          adult: adultRecipe._id,
          matchPercentage,
        });
      }
    });
  });

  // Trier les couples de recettes par pertinence
  matchedRecipes.sort((a, b) => b.matchPercentage - a.matchPercentage);
  console.log(matchedRecipes.length);

  // Extraire tous les identifiants de recettes bébés distincts présents dans matchedRecipes
  const uniqueBabyRecipeIds = Array.from(
    new Set(matchedRecipes.map((recipePair) => recipePair.baby.toString()))
  );

  // Sélectionner 14 recettes bébé uniques aléatoirement depuis la liste precedemment settée
  let selectedBabyRecipes = new Set();
  while (selectedBabyRecipes.size < 14) {
    const randomIndex = Math.floor(Math.random() * uniqueBabyRecipeIds.length);
    selectedBabyRecipes.add(uniqueBabyRecipeIds[randomIndex]);
  }

  // Chercher 14 couples aléatoires basés sur les 14 recettes bébés
  let selectedMatchedRecipes = [];
  for (const babyRecipe of selectedBabyRecipes) {
    const matchedPair = matchedRecipes.find(
      (recipePair) => recipePair.baby.toString() === babyRecipe.toString()
    );
    if (matchedPair) {
      selectedMatchedRecipes.push({
        baby: matchedPair.baby,
        adult: matchedPair.adult,
      });
    } else {
      console.log(
        "No matching recipe pair found for baby recipe:",
        babyRecipe._id
      );
    }
  }

  return selectedMatchedRecipes;
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
      .populate({
        path: "weeklyRecipes",
        populate: [{ path: "adult" }, { path: "baby" }],
      })
      .then((household) => {
        if (household) {
          // comparaison de la derniere génération des recettes.

          let timepast = Date.now() - household.createdAt;
          //Si >7 jours (604800000 ms) regeneration et on renvoie les recettes de weeklyRecipes

          if (timepast < 604800000 || household.weeklyRecipes.length === 0) {
            //On va chercher toutes les recettes bébés
            BabyRecipe.find({ usage: "repas" }).then((babyRecipes) => {
              AdultRecipe.find().then((adultRecipes) => {
                let randomizedWeeklyRecipes = generateMatchedRecipes(
                  babyRecipes,
                  adultRecipes
                );
                console.log("randomizedcouples", randomizedWeeklyRecipes);                      

                // on update la collection household et on y pousse les 14 recettes
                Household.updateOne(
                  { _id: household._id },
                  {
                    weeklyRecipes: randomizedWeeklyRecipes,
                    createdAt: Date.now(),
                  }
                ).then((data) => {
                  if (data.modifiedCount > 0) {
                    Household.findOne({ _id: household._id })
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
                if (data.weeklyRecipes.length > 0) {
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

//search for a baby recipe by keyword contained in the title
router.post("/searchKeyWord", (req, res) => {
  const searchRequest = req.body.request; // Get the search body from the request

  //Split the search body into individuals keywords
  const keywords = searchRequest.split(" ");

  // Use Mongoose methods to search for items matching the keywords
  BabyRecipe.find({
    $and: keywords.map((keyword) => ({
      title: { $regex: keyword.replace(/[eé]/gi, "[eé]"), $options: "i" }, // Search by recipe title
    })),
  }).then((data) => {
    if (data.length > 0) {
      res.json({ result: "true", recipes: data });
    } else {
      res.json({ result: "false", error: "Pas de recette correspondante" });
    }
  });
});

// router.get("/allLikedRecipes"),
//   (req, res) => {
//     // Récupérer l'id de l'user via le token
//     User.findOne({ token: req.body.token }).then((user) => {
//       console.log("user", user);
//       if (user === null) {
//         res.json({ result: false, error: "User not found" });
//         return;
//       }
//       // Avec cet id aller chercher l'household correspondant
//       Household.findOne({ users: user._id })
//         .populate({
//           path: "likedRecipes",
//           populate: [{ path: "adult" }, { path: "baby" }],
//         })
//         .then((household) => {
//           if (household) {
//             res.json({
//               result: true,
//               recipes: data.likedRecipes,
//             });
//           } else {
//             res.json({
//               result: false,
//               error: "Liked recipe was not added",
//             });
//           }
//         });
//     });
//   };

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
          { $push: { likedRecipes: req.body.recipeID } }
        ).then((data) => {
          if (data.modifiedCount > 0) {
            console.log("ok");
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

router.post("/removeLikedRecipe", (req, res) => {
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
          { $pull: { likedRecipes: req.body.recipeID } }
        ).then((data) => {
          if (data.modifiedCount > 0) {
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
              error: "Liked recipe was not deleted",
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

//route panic mode
router.post("/panicMode", (req, res) => {
  const ingredientsRequested = req.body.request; // Get the search body from the request

  //Split the search body into individuals keywords
  const keywords = ingredientsRequested.split(" ");

  // Use Mongoose methods to search for ingredients matching the requested ingredients
  BabyRecipe.find({
    $and: keywords.map((keywords) => ({
      ingredients: {
        $elemMatch: {
          name: { $regex: keywords.replace(/[eé]/gi, "[eé]"), $options: "i" },
        },
      }, // Search by ingredients
    })),
  }).then((data) => {
    if (data.length > 0) {
      res.json({ result: "true", recipes: data });
    } else {
      res.json({ result: "false", error: "Pas de recette correspondante" });
    }
  });
});

module.exports = router;
