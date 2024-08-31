idbKeyval.get(`logs-${moment().format('MMDDYYYY')}`).then((foodItems) => {
  console.log(foodItems)
})

function addFoodLogItem(item) {
  const timeLogEntry = moment(item.time).format('MMDDYYYY');
  idbKeyval.update(`logs-${timeLogEntry}`, (logs) => [item].concat(logs || []));
}

async function loadFoodLogs(dayStart = 0, dayEnd = -7) {
  const logWrapperElement = document.getElementById('food-log-wrapper');
  logWrapperElement.innerHTML = '';

  for (let day = dayStart; day > dayEnd; day--) {
    const date = moment().subtract(day, 'days');
    const foodItems = await loadFoodLogForDate(date);

    if (!foodItems || foodItems.length === 0) {
      return;
    }

    const logSection = document.createElement('div');
    logSection.onclick = () => { /* reveal more log items, then remove onclick */ }
    const dateLabel = document.createElement('button');
    dateLabel.classList.add('date-label');
    dateLabel.onclick = () => {
      const itemsWrapper = document.getElementById(`items-${moment(date).format('MMDDYYYY')}`);
      if (itemsWrapper.classList.contains('flex-items')) {
        itemsWrapper.classList.remove('flex-items')
        itemsWrapper.classList.add('grid-items')
      } else {
        itemsWrapper.classList.remove('grid-items')
        itemsWrapper.classList.add('flex-items')
      }
    }
    dateLabel.innerText = moment(date).format('MMM Do');
    const logItemsWrapper = document.createElement('div');
    logItemsWrapper.setAttribute('id', `items-${moment(date).format('MMDDYYYY')}`)
    logItemsWrapper.classList.add('food-log-items-wrapper')
    logItemsWrapper.classList.add('flex-items')
    foodItems.forEach(foodItem => {
      const item = {
        description: foodItem.name,
        foodNutrients: foodItem.nutrients.map(n => ({ nutrientName: n.name, value: n.value }))
      }
      const itemElement = document.createElement('button');
      itemElement.classList.add('food-button');
      itemElement.innerHTML = `<div><b>${foodItem.name}</b></div>`
      itemElement.onclick = () => { loadFood(item, item.amount, item.time); showPage('food-edit'); }
      logItemsWrapper.appendChild(itemElement);
    });

    const nutritionSummary = document.createElement('div');
    const goals = await idbKeyval.get('goals');
    goals.forEach(goal => {
      const nutritionSum = foodItems.reduce((sum, item) => sum + Number(item.nutrients.find(n => n.name === goal.type).value) || 0, 0)
      nutritionSummary.innerHTML = nutritionSummary.innerHTML + `<div>${goal.type}: ${nutritionSum.toFixed(2)}</div>`
    })

    logSection.appendChild(dateLabel);
    logSection.appendChild(logItemsWrapper);
    logSection.appendChild(nutritionSummary);
    logWrapperElement.appendChild(logSection);
  }
}

function loadFoodLogForDate(date = new Date()) {
  const dateString = moment(date).format('MMDDYYYY');

  return idbKeyval.get(`logs-${dateString}`)
}