
document.documentElement.className = 'theme';

let currentFoodItem = {};
let amountValue = 100;
let isNewItem = false;
let totalHits = 0;
let foodItemListStyle = '1fr 1fr 1fr'

const unitConversion = {
  "mg": 0.001,
  "g": 1,
  "kg": 1000,
  "oz": 28.35,
  "lb": 453.59,
  "tsp": 4.76,
  "tbsp": 14.3,
  "fl_oz": 29.57,
  "ml": 1,
  "c": 240,
  "pt": 473.18,
  "qt": 946.35,
  "L": 1000,
  "gal": 3785.41,
  "dash": 0.6,
  "pinch": 0.3,
  "slice": 30,
  "piece": 75,
  "clove": 5,
  "stick": 113.4,
  "pkg": 1,
  "bottle": 1,
  "serving": 1,
  "can": 400,
  "bowls": 1,
}

function clearCurrentFoodItem() {
  currentFoodItem = {};
  amountValue = 100;
  document.getElementById('food-edit-amount-unit').value = 'g';
  document.getElementById('food-edit-amount').value = amountValue;
  loadFood({ description: "", foodNutrients: [] }, 0, true);
}

document.getElementById('save-date').value = moment().format('YYYY-MM-DDTHH:mm');

if (window.location.href.split('#')[1] === 'food-edit') {
  clearCurrentFoodItem();
}

if (window.location.href.split('#')[1]) {
  pageTransition(window.location.href.split('#')[1])
}

async function searchFoods(pageNumber = 1) {
  const searchElement = document.getElementById("search");
  const searchTerm = searchElement.value;
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
  const noResultsElement = document.getElementById('no-results');
  noResultsElement.style.display = 'none';
  const spinner = document.getElementById('grid-food-items-spinner');
  spinner.style.display = '';
  try {
    searchElement.blur();
    // const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${searchTerm}&pageNumber=${pageNumber}`);
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: searchTerm,
        dataTypes: [
          "Branded",
          "Experimental",
          "Foundation",
          "SR Legacy",
          "Survey (FNDDS)",
        ],
        requireAllWords: true,
        pageNumber,
      })
    })
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.foods.length > 0) {
      totalHits = json.totalHits;
      itemWrapper.style.display = '';
      spinner.style.display = 'none';
      updateFoodItemListingStyle('1fr 1fr 1fr');
      updateSelectableFoodItems(json.foods, pageNumber);
    } else {
      spinner.style.display = 'none';
      noResultsElement.style.display = '';
    }
  } catch (err) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const spinner = document.getElementById('grid-food-items-spinner');
    spinner.style.display = 'none';
    networkFailedElement.style.display = '';
    console.error(err);
  }
}

function adjustSearchFontSize() {
  const searchElement = document.getElementById("search")
  searchElement.style.fontSize = Math.max(Math.min(searchElement.clientWidth / searchElement.value.length, '24'), '12');
}

function updateFoodItemListingStyle(style) {
  foodItemListStyle = style;
  if (style) {
    document.getElementById("grid-food-items-wrapper").style.gridTemplateColumns = style;
  }
  document.getElementById("search-view-grid").style.display = 'none';
  document.getElementById("search-view-list").style.display = 'none';
  if (style === '1fr 1fr 1fr') {
    document.querySelector(".grid-search-wrapper").style.gridTemplateColumns = 'auto 1fr auto auto auto';
    document.getElementById("search-view-list").style.display = '';
  }
  if (style === '1fr') {
    document.querySelector(".grid-search-wrapper").style.gridTemplateColumns = 'auto 1fr auto auto auto';
    document.getElementById("search-view-grid").style.display = '';
  }
  // set more button to correct span
  [
    ...document.querySelectorAll('.span-3'),
    ...document.querySelectorAll('.span-2'),
    ...document.querySelectorAll('.span-1')
  ].forEach(e => {
    e.classList.remove('span-1');
    e.classList.remove('span-2');
    e.classList.remove('span-3');
    e.classList.add('span-temp');
  })

  if (style === '1fr') {
    [...document.querySelectorAll('.span-temp')].forEach(e => e.classList.add('span-1'));
  }
  if (style === '1fr 1fr 1fr') {
    const foodButtonCount = document.querySelectorAll('.food-button').length - 1;
    [...document.querySelectorAll('.span-temp')].forEach(e => { e.classList.add(`span${(foodButtonCount % 3) - 3}`) });
  }
  [...document.querySelectorAll('.span-temp')].forEach(e => e.classList.remove('span-temp'))
}

function showPage(page) {
  history.pushState({}, "", `#${page}`);
  pageTransition(page);
}

function pageTransition(page = "food-add") {
  if (page === 'food-create') {
    clearCurrentFoodItem();
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
    clearCurrentFoodItem();
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

function updateSelectableFoodItems(foodItems, pageNumber = 1) {
  const itemWrapper = document.getElementById('grid-food-items-wrapper');
  itemWrapper.scrollTop = 0;
  itemWrapper.innerHTML = "";
  // const hasMore = foodItems.length > start + PAGE_SIZE;
  // const end = (hasMore ? start + (PAGE_SIZE - 1) : start + PAGE_SIZE) + (start === 0 ? 1 : 0);
  let countFoodButtons = 0;
  if (pageNumber > 1) {
    // add food item that is a back button
    const backElement = document.createElement('button');
    backElement.classList.add('food-button');
    backElement.innerHTML = `
      <img src="images/arrow_back_icon.svg" alt="previous items" style="filter: brightness(0);" />
    `
    backElement.onclick = () => searchFoods(pageNumber - 1);
    itemWrapper.appendChild(backElement);
    countFoodButtons += 1;
  }
  foodItems.forEach(item => {
    const itemElement = document.createElement('button');
    itemElement.classList.add('food-button');
    itemElement.innerHTML = `<div><b>${item.description}</b></div><div>${item.brandName ? item.brandName + ' ' : ''}${item.brandOwner ? item.brandOwner : ''}</div>`
    itemElement.onclick = () => { loadFood(item); showPage('food-edit'); }
    itemWrapper.appendChild(itemElement);
    countFoodButtons += 1;
  })
  if (totalHits > 50 * pageNumber) {
    const loadMoreElement = document.createElement('button');
    loadMoreElement.classList.add('food-button');
    if (foodItemListStyle === '1fr 1fr 1fr') {
      loadMoreElement.classList.add(`span${(countFoodButtons % 3) - 3}`);
    } else {
      loadMoreElement.classList.add('span-1');
    }
    loadMoreElement.innerHTML = `
      <img src="images/more_icon.svg" alt="more items" style="filter: brightness(0);" />
    `
    loadMoreElement.onclick = () => searchFoods(pageNumber + 1);
    itemWrapper.appendChild(loadMoreElement);
  }
}

function loadFood(foodItem, editItem = 0, createNewItem = false) {
  const isEditingExistingFoodItem = editItem !== 0;
  currentFoodItem = foodItem;
  isNewItem = createNewItem;
  if (isEditingExistingFoodItem) {
    document.getElementById('food-item-edit-button-row').style.display = '';
    document.getElementById('food-item-save-button-row').style.display = 'none';
    document.getElementById('food-edit-screen').querySelector('.page-button').onclick = () => showPage('food-log')
  } else {
    document.getElementById('food-item-save-button-row').style.display = '';
    document.getElementById('food-item-edit-button-row').style.display = 'none';
    document.getElementById('food-edit-screen').querySelector('.page-button').onclick = () => showPage('food-add')
  }
  if (foodItem.amount) {
    amountValue = foodItem.amount;
    document.getElementById('food-edit-amount').value = amountValue.toFixed(2);
  }
  document.getElementById('food-edit-amount-unit').value = foodItem.unitMeasure || 'g';
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
    nutrientTypeInput.setAttribute('placeholder', 'Nutrient');
    nutrientTypeInput.setAttribute('value', nutrient.nutrientName);
    nutrientTypeInput.onchange = (e) => {
      if (e.target.value === '') {
        nutrientItem.parentElement.removeChild(nutrientItem);
      }
      const closerString = getClosestOption(e.target.value, nutrientsStrings);
      if (closerString !== e.target.value) {
        e.target.value = closerString;
      }
    }

    const nutrientAmountInput = document.createElement('input');
    nutrientAmountInput.setAttribute('type', 'number');
    nutrientAmountInput.setAttribute('placeholder', 'Amount');
    const unitMeasureRatio = unitConversion[currentFoodItem.unitMeasure] || 1;
    nutrientAmountInput.setAttribute('value', isEditingExistingFoodItem
      ? ((nutrient.value / (currentFoodItem.amount / amountValue)) * (unitMeasureRatio / (unitConversion[currentFoodItem.unitMeasure] || 1))).toFixed(2) // update the amount based on existing item
      : ((nutrient.value * (amountValue / 100)) * unitMeasureRatio).toFixed(2) // update the amount based on 100 default amount
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
    nutrientTypeInput.setAttribute('placeholder', 'Nutrient');
    nutrientTypeInput.onchange = (e) => {
      if (e.target.value === '') {
        nutrientItem.parentElement.removeChild(nutrientItem);
      }
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
    nutrientAmountInput.setAttribute('placeholder', 'Amount');

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
        amountValue = measure.gramWeight / unitConversion[currentFoodItem.unitMeasure || 'g']
        document.getElementById('food-edit-amount').value = amountValue.toFixed(2);
        updateFoodValuesFromAmount();
      };

      foodAmountOptionsElement.appendChild(amountOptionButton);
    });
  }
  if (currentFoodItem.servingSize) {
    const amountOptionButton = document.createElement('button');
    const servingSize = currentFoodItem.servingSize.toFixed(2);
    amountOptionButton.innerText = currentFoodItem.householdServingFullText && currentFoodItem.householdServingFullText !== 'None'
      ? currentFoodItem.householdServingFullText
      : `${servingSize} (${currentFoodItem.servingSizeUnit})`
    amountOptionButton.onclick = () => {
      amountValue = parseInt(servingSize);
      document.getElementById('food-edit-amount').value = amountValue.toFixed(2);
      currentFoodItem.unitMeasure = 'g';
      document.getElementById('food-edit-amount-unit').value = 'g';
      updateFoodValuesFromAmount();
    };

    foodAmountOptionsElement.appendChild(amountOptionButton);
  }
  if (!hasFoodMeasureItems && !currentFoodItem.servingSize) {
    document.getElementById('serving-size-wrapper').style.display = 'none'
  } else {
    document.getElementById('serving-size-wrapper').style.display = ''
  }
}

function updateMeasure() {
  oldUnitMeasure = unitConversion[currentFoodItem.unitMeasure || 'g'];
  currentFoodItem.unitMeasure = document.getElementById('food-edit-amount-unit').value;
  const foodAmountElement = document.getElementById('food-edit-amount');
  const currentAmount = amountValue;
  amountValue = (currentAmount * oldUnitMeasure) / unitConversion[currentFoodItem.unitMeasure]
  foodAmountElement.value = amountValue.toFixed(2);
}

function updateFoodValuesFromAmount() {
  amountValue = parseFloat(document.getElementById('food-edit-amount').value);
  if (!isNewItem) {
    loadFood(currentFoodItem, currentFoodItem.time);
  }
}

function removeFoodItem() {
  removeFoodLogItem(currentFoodItem);
  showPage('food-log');
}

function saveDuplicateFoodItem() {
  saveCurrentFoodItem(true);
  showPage('food-log');
}

function saveCurrentFoodItem(isNew = true) {
  const foodItemName = document.getElementById('food-edit-name').value;
  const foodItemAmount = amountValue;
  const nutrients = [...document.getElementById('nutrition-edit').children]
    .filter(element => element.children.length === 2 && element.children[0].value)
    .map(element => { return { name: element.children[0].value, value: element.children[1].value } });

  if (isNew) {
    addFoodLogItem({
      name: foodItemName,
      amount: foodItemAmount,
      nutrients,
      time: new Date(document.getElementById('save-date').value).getTime() + new Date().getMilliseconds(),
      unitMeasure: currentFoodItem.unitMeasure ? currentFoodItem.unitMeasure : 'g'
    });
    clearCurrentFoodItem();
    showPage('food-add');
  } else {
    updateFoodLogItem({
      name: foodItemName,
      amount: foodItemAmount,
      nutrients,
      time: currentFoodItem.time,
      unitMeasure: currentFoodItem.unitMeasure ? currentFoodItem.unitMeasure : 'g'
    });
    clearCurrentFoodItem();
    showPage('food-log');
  }
  updateMeasure({ target: { value: 'g' } })
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

