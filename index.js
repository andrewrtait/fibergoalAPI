import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

const NutritionixAppID =  process.env.NUTRITIONIX_APP_ID;
const NutritionixAppKey = process.env.NUTRITIONIX_APP_KEY;



const targetFiberValues = {
  female: {
    '1to3': 19,
    '4to8': 25,
    '9to18': 26,
    '19to50': 25,
    'above50': 21,
  }, 
  male: {
    '1to3': 19,
    '4to8': 25,
    '9to18': 31,
    '19to50': 38,
    'above50': 30,
  }
}
app.use(bodyParser.urlencoded({ extended: true} ));
app.use(express.static("public"));

app.get("/", (req, res) => {
   res.render("index.ejs", {content : "your results will load here"});  
});

app.post("/", async (req, res) => {

  const config = {
    headers: { "Content-Type": "application/json", "x-app-id":NutritionixAppID, "x-app-key":NutritionixAppKey },
  };

     const appleBy = req.body;
     let breakfast = appleBy.myBreakfast;
     let lunch = appleBy.myLunch;
     let dinner = appleBy.myDinner;
     let snacks = appleBy.mySnacks;
     var age = appleBy.myAge;
     const sex = appleBy.mySex;

     const allFood = breakfast + '; '+ lunch +'; '+ dinner + '; '+ snacks;
     const nutInput = JSON.stringify({"query" : allFood});
     console.log(nutInput);

     try {
        const result = await axios.post("https://trackapi.nutritionix.com/v2/natural/nutrients", nutInput, config);
        const jsonObject = result.data;
        const foodsArray = jsonObject.foods; // Access the "foods" array
        var fiberTotal = 0;
        
        foodsArray.forEach((foodItem, index) => {
            const foodName = foodItem.food_name;
            const dietaryFiber = foodItem.nf_dietary_fiber;
            const foodImageLink = foodItem.photo.thumb;

            console.log(`Item ${index + 1}:`);
            console.log("Food Name:", foodName);
            console.log("Dietary Fiber:", dietaryFiber);
            
            console.log("image item: ", foodImageLink);

            console.log("-------------------------");
            fiberTotal = fiberTotal + dietaryFiber;            
        
           
          });
          console.log("Total Fiber:", fiberTotal);
          foodsArray.myAge = age;
          const ageNumeric = parseInt(age)
          foodsArray.mySex = sex;  
          const sexKey = sex.toLowerCase();

          let targetFiber = null;

          if (targetFiberValues[sexKey]) {
            if (ageNumeric >=4 && ageNumeric <=8) {
              targetFiber = targetFiberValues[sexKey]['4to8'];
            }
            else if (ageNumeric >=9 && ageNumeric <=18) {
              targetFiber = targetFiberValues[sexKey]['9to18'];
            }
            else if (ageNumeric >=19 && ageNumeric <=50) {
              targetFiber = targetFiberValues[sexKey]['19to50'];
            }
            else if (ageNumeric >50) {
              targetFiber = targetFiberValues[sexKey]['above50'];
            }
          }
    console.log("Target Fiber:", targetFiber);
    foodsArray.targetFiber = targetFiber;

    let fiberStatus = null;

    if (targetFiber !== null && fiberTotal !== null) {
      if (fiberTotal >= targetFiber) {
        fiberStatus = "You've met or exceeded the target fiber intake!";
      } else {
        fiberStatus = "You're below the target fiber intake.";
      }
    }
    foodsArray.fiberStatus = fiberStatus;
    const percentageFiberGoal = Math.floor((fiberTotal/targetFiber)*100);
    foodsArray.percentageFiberGoal = percentageFiberGoal;

console.log(foodsArray);

  if (foodsArray && Array.isArray(foodsArray)) {
    res.render('index.ejs', { foods: foodsArray});      // Pass the data to the EJS template
   } else {
    res.render('index.ejs', { foods: null, error_msg: "Error: 'foods' array is missing or not an array." }); // Pass an error message
  }
} catch (error) {
  console.error("Failed to make request:", error.message, "Did you forget to enter your food items?");
  var nullDataset = ` ${error.message}, Did you forget to enter your food items? `;
  res.render("index.ejs", { foods: null, error_msg: nullDataset }); // Pass the error message
}

    });


app.listen(port, () =>{
    console.log(`Server is running on port ${port}`);
});