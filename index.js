
document.documentElement.className = 'theme';

let currentFoodItem = {};
let isNewItem = false;

if (window.location.href.split('#')[1] === 'food-edit') {
  currentFoodItem = {};
  loadFood({ description: "", foodNutrients: [] }, 100, 0, true);
}

if (window.location.href.split('#')[1]) {
  pageTransition(window.location.href.split('#')[1])
}

async function searchFoods() {
  const searchTerm = document.getElementById("search").value;
  if (searchTerm === '') {
    return;
  }
  const apiKey = document.getElementById("api-key-input").value;
  // clear items and add search spinner
  const itemWrapper = document.getElementById('grid-food-items-wrapper');
  itemWrapper.innerHTML = "";
  itemWrapper.style.display = 'none';
  const networkFailedElement = document.getElementById('network-failed');
  networkFailedElement.style.display = 'none';
  const spinner = document.getElementById('grid-food-items-spinner');
  spinner.style.display = '';
  try {
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${searchTerm}`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    itemWrapper.style.display = '';
    const spinner = document.getElementById('grid-food-items-spinner');
    spinner.style.display = 'none';

    const json = await response.json();
    updateSelectableFoodItems(json.foods, 0);
  } catch (err) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const spinner = document.getElementById('grid-food-items-spinner');
    spinner.style.display = 'none';
    const networkFailedElement = document.getElementById('network-failed');
    networkFailedElement.style.display = '';
    console.error(err);
  }
}

function showPage(page) {
  history.pushState({}, "", `#${page}`);
  pageTransition(page);
}

function pageTransition(page = "food-add") {
  if (page === 'food-create') {
    currentFoodItem = {};
    loadFood({ description: "", foodNutrients: [] }, 100, 0, true);
    pageTransition('food-edit');
    return;
  }
  [...document.querySelectorAll('.content-wrapper')].forEach(entry => {
    entry.style.display = 'none';
  });
  document.getElementById(`${page}-screen`).style.display = '';
  if (page === 'food-log') {
    document.getElementById('food-log-date-input').value = moment().format('YYYY-MM-DD')
    loadFoodLogs();
  }
  if (page !== 'food-edit') {
    currentFoodItem = {};
  }
}

addEventListener("popstate", (event) => {
  pageTransition(event.target.window.location.href.split('#')[1]);
});

function updateGoalTracker() {
  const goalTracker = document.getElementById("goal-tracker");
  goalTracker.innerHTML = "";
  idbKeyval.get('goals').then((goals) => {
    (goals || []).forEach(goal => {
      const goalTrackerItem = document.createElement('div');
      goalTrackerItem.classList.add('goal-tracker-item');
      const goalTrackerFill = document.createElement('div');
      goalTrackerFill.classList.add('goal-tracker-fill');
      goalTrackerFill.setAttribute('style', `background-color: ${goal.color}; width: ${100}px;`);
      goalTrackerItem.appendChild(goalTrackerFill);
      if (goal.max) {
        const goalTrackerTarget = document.createElement('div');
        goalTrackerTarget.classList.add('goal-tracker-target');
        goalTrackerTarget.setAttribute('style', `background-color: #ffffff44; width: ${100}px; left: ${300}px`);
        goalTrackerItem.appendChild(goalTrackerTarget);
      }
      goalTracker.appendChild(goalTrackerItem);
    })
  });
}


function updateSelectableFoodItems(foodItems, start) {
  const itemWrapper = document.getElementById('grid-food-items-wrapper');
  const PAGE_SIZE = Math.min((Math.floor(itemWrapper.clientHeight / (110)) * 3) - 1, 20);
  itemWrapper.innerHTML = "";
  const hasMore = foodItems.length > start + PAGE_SIZE;
  const end = (hasMore ? start + (PAGE_SIZE - 1) : start + PAGE_SIZE) + (start === 0 ? 1 : 0);
  if (start > 0) {
    // add food item that is a back button
    const backElement = document.createElement('button');
    backElement.classList.add('food-button');
    backElement.innerHTML = `
      <img src="images/arrow_back_icon.svg" alt="previous items" style="filter: brightness(0);" />
    `
    backElement.onclick = () => updateSelectableFoodItems(foodItems, Math.max(start <= PAGE_SIZE ? 0 : start - (PAGE_SIZE - 1), 0));
    itemWrapper.appendChild(backElement);
  }
  foodItems.slice(start, end).forEach(item => {
    const itemElement = document.createElement('button');
    itemElement.classList.add('food-button');
    itemElement.innerHTML = `<div><b>${item.description}</b></div><div>${item.brandName ? item.brandName + ' ' : ''}${item.brandOwner ? item.brandOwner : ''}</div>`
    itemElement.onclick = () => { loadFood(item); showPage('food-edit'); }
    itemWrapper.appendChild(itemElement);
  })
  if (hasMore) {
    const loadMoreElement = document.createElement('button');
    loadMoreElement.classList.add('food-button');
    loadMoreElement.innerHTML = `
      <img src="images/more_icon.svg" alt="more items" style="filter: brightness(0);" />
    `
    loadMoreElement.onclick = () => updateSelectableFoodItems(foodItems, end);
    itemWrapper.appendChild(loadMoreElement);
  }
}

function loadFood(foodItem, amount = 100, editItem = 0, createNewItem = false) {
  isEditingFoodItem = editItem !== 0;
  currentFoodItem = foodItem;
  isNewItem = createNewItem;
  if (isEditingFoodItem) {
    document.getElementById('food-item-edit-button-row').style.display = '';
    document.getElementById('food-item-save-button-row').style.display = 'none';
    document.getElementById('food-edit-screen').querySelector('.page-button').onclick = () => showPage('food-log')
  } else {
    document.getElementById('food-item-save-button-row').style.display = '';
    document.getElementById('food-item-edit-button-row').style.display = 'none';
    document.getElementById('food-edit-screen').querySelector('.page-button').onclick = () => showPage('food-add')
  }
  document.getElementById('food-edit-amount').value = amount;
  document.getElementById('food-edit-name').value = currentFoodItem.description;
  document.getElementById('food-edit-name').onchange = (e) => currentFoodItem.description = e.target.value;
  const nutritionSection = document.getElementById('nutrition-edit');
  nutritionSection.innerHTML = '';
  currentFoodItem.foodNutrients.forEach(nutrient => {
    if (nutrientIdsIgnoreList.includes(nutrient.nutrientId)) {
      return; // skip nutrients that we don't support
    }
    const nutrientItem = document.createElement('div');
    const nutrientTypeInput = document.createElement('input');
    nutrientTypeInput.classList.add('nutirion-type-edit');
    nutrientTypeInput.setAttribute('list', 'nutrients');
    nutrientTypeInput.setAttribute('placeholder', 'type');
    nutrientTypeInput.setAttribute('value', nutrient.nutrientName);
    nutrientTypeInput.onchange = (e) => {
      const closerString = getClosestOption(e.target.value, nutrientsStrings);
      if (closerString !== e.target.value) {
        e.target.value = closerString;
      }
    }

    const nutrientAmountInput = document.createElement('input');
    nutrientAmountInput.setAttribute('type', 'number');
    nutrientAmountInput.setAttribute('placeholder', 'amount');
    nutrientAmountInput.setAttribute('value', isEditingFoodItem
      ? (nutrient.value / (currentFoodItem.amount / amount)).toFixed(2) // update the amount based on existing item
      : (nutrient.value * (amount / 100)).toFixed(2) // update the amount based on 100 default amount
    );

    nutrientItem.appendChild(nutrientTypeInput);
    nutrientItem.appendChild(nutrientAmountInput);
    nutritionSection.appendChild(nutrientItem);
  });

  const addNutritionField = () => {
    const nutrientItem = document.createElement('div');
    const nutrientTypeInput = document.createElement('input');
    nutrientTypeInput.classList.add('nutirion-type-edit');
    nutrientTypeInput.setAttribute('list', 'nutrients');
    nutrientTypeInput.setAttribute('placeholder', 'type');
    nutrientTypeInput.onchange = (e) => {
      const closerString = getClosestOption(e.target.value, nutrientsStrings);
      if (closerString !== e.target.value) {
        e.target.value = closerString;
      }
      const items = document.querySelectorAll('.nutirion-type-edit')
      if (items[items.length - 1].value) {
        addNutritionField();
      }
    }

    const nutrientAmountInput = document.createElement('input');
    nutrientAmountInput.setAttribute('type', 'number');
    nutrientAmountInput.setAttribute('placeholder', 'amount');

    nutrientItem.appendChild(nutrientTypeInput);
    nutrientItem.appendChild(nutrientAmountInput);
    nutritionSection.appendChild(nutrientItem);
  }
  addNutritionField();

  // edit food amount options
  const foodAmountOptionsElement = document.getElementById('food-edit-amount-options')
  foodAmountOptionsElement.innerHTML = '';
  const hasFoodMeasureItems = currentFoodItem.foodMeasures && currentFoodItem.foodMeasures.length > 0;
  if (hasFoodMeasureItems) {
    currentFoodItem.foodMeasures.forEach(measure => {
      const unknownOption = measure.disseminationText == 'Quantity not specified';
      if (unknownOption && currentFoodItem.foodMeasures.filter(m => m.gramWeight === measure.gramWeight).length > 1) {
        // this is basically a duplicate option, so we can ignore it
        return;
      }
      const amountOptionButton = document.createElement('button');
      amountOptionButton.innerText = measure.disseminationText === 'Quantity not specified' ? `${measure.gramWeight}g` : measure.disseminationText
      amountOptionButton.onclick = () => {
        document.getElementById('food-edit-amount').value = measure.gramWeight;
        updateFoodValuesFromAmount(measure.gramWeight);
      };

      foodAmountOptionsElement.appendChild(amountOptionButton);
    });
  }
  if (currentFoodItem.servingSize) {
    const amountOptionButton = document.createElement('button');
    const servingSize = currentFoodItem.servingSize.toFixed(2);
    amountOptionButton.innerText = currentFoodItem.householdServingFullText
      ? currentFoodItem.householdServingFullText
      : `${servingSize} (${currentFoodItem.servingSizeUnit})`
    amountOptionButton.onclick = () => {
      document.getElementById('food-edit-amount').value = servingSize;
      updateFoodValuesFromAmount(servingSize);
    };

    foodAmountOptionsElement.appendChild(amountOptionButton);
  }
  if (!hasFoodMeasureItems && !currentFoodItem.servingSize) {
    document.getElementById('serving-size-wrapper').style.display = 'none'
  } else {
    document.getElementById('serving-size-wrapper').style.display = ''
  }
}

function updateFoodValuesFromAmount() {
  const newAmount = parseFloat(document.getElementById('food-edit-amount').value);
  if (!isNewItem) {
    loadFood(currentFoodItem, newAmount, currentFoodItem.time);
  }
}

function removeFoodItem() {
  removeFoodLogItem(currentFoodItem);
  showPage('food-log');
}

function saveDuplicateFoodItem() {
  saveCurrentFoodItem(new Date());
  showPage('food-log');
}

function saveCurrentFoodItem(isNew = true) {
  const foodItemName = document.getElementById('food-edit-name').value;
  const foodItemAmount = document.getElementById('food-edit-amount').value;
  const nutrients = [...document.getElementById('nutrition-edit').children]
    .filter(element => element.children.length === 2 && element.children[0].value)
    .map(element => { return { name: element.children[0].value, value: element.children[1].value } });

  if (isNew) {
    addFoodLogItem({ name: foodItemName, amount: foodItemAmount, nutrients, time: new Date() });
    currentFoodItem = {};
    showPage('food-add');
  } else {
    updateFoodLogItem({ name: foodItemName, amount: foodItemAmount, nutrients, time: currentFoodItem.time });
    currentFoodItem = {};
    showPage('food-log');
  }
}

function showClearDataItem() {
  document.getElementById('clear-data-question').style.display = 'none';
  document.getElementById('clear-data-item').style.display = '';
}

function hideClearDataItem() {
  document.getElementById('clear-data-question').style.display = '';
  document.getElementById('clear-data-item').style.display = 'none';
}

function clearAllData() {
  idbKeyval.clear();
  location.reload();
}

updateGoalTracker();

