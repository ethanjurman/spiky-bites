idbKeyval.get('logs').then((foodItem) => {
  console.log(foodItem)
})

function addFoodLogItem(item) {
  idbKeyval.update("logs", (logs) => (logs || []).concat(item));
  // updateFoodLog();
}
