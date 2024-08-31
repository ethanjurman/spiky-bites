idbKeyval.get('logs').then((foodItem) => {
  console.log(foodItem)
})

function addFoodLogItem(item, amount) {
  idbKeyval.update("logs", (logs) => (logs || []).concat({ item, amount }));
  // updateFoodLog();
}
