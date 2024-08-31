async function searchFoods() {
  const searchTerm = document.getElementById("search").value;
  const apiKey = document.getElementById("api-key-input").value;
  // clear items and add search spinner
  const itemWrapper = document.getElementById('grid-food-items-wrapper');
  itemWrapper.innerHTML = "";
  itemWrapper.style.display = 'none';
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
    console.error(err);
  }
}

function showPage(page) {
  [...document.querySelectorAll('.content-wrapper')].forEach(entry => {
    entry.style.display = 'none';
  });
  document.getElementById(`${page}-screen`).style.display = '';
}

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
  const PAGE_SIZE = (Math.floor(itemWrapper.clientHeight / (110)) * 3) - 1;
  itemWrapper.innerHTML = "";
  const hasMore = foodItems.length > start + PAGE_SIZE;
  const end = (hasMore ? start + (PAGE_SIZE - 1) : start + PAGE_SIZE) + (start === 0 ? 1 : 0);
  console.log({ start, end })
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

let currentFoodItem = null;

function loadFood(foodItem, amount = 100) {
  currentFoodItem = foodItem;
  document.getElementById('food-edit-name').value = foodItem.description;
  const nutritionSection = document.getElementById('nutrition-edit');
  nutritionSection.innerHTML = '';
  foodItem.foodNutrients.forEach(nutrient => {
    const nutrientItem = document.createElement('div');
    const nutrientTypeInput = document.createElement('input');
    nutrientTypeInput.setAttribute('list', 'nutrients');
    nutrientTypeInput.setAttribute('placeholder', 'type');
    nutrientTypeInput.setAttribute('value', nutrient.nutrientName);

    const nutrientAmountInput = document.createElement('input');
    nutrientAmountInput.setAttribute('type', 'number');
    nutrientAmountInput.setAttribute('placeholder', 'amount');
    nutrientAmountInput.setAttribute('value', (nutrient.value * (amount / 100)).toFixed(2));

    nutrientItem.appendChild(nutrientTypeInput);
    nutrientItem.appendChild(nutrientAmountInput);
    nutritionSection.appendChild(nutrientItem);
  })

  const nutrientAddButton = document.createElement('button');
  nutrientAddButton.innerText = "Add Nutrient";
  nutrientAddButton.onclick = () => {
    const nutrientItem = document.createElement('div');
    const nutrientTypeInput = document.createElement('input');
    nutrientTypeInput.setAttribute('list', 'nutrients');
    nutrientTypeInput.setAttribute('placeholder', 'type');

    const nutrientAmountInput = document.createElement('input');
    nutrientAmountInput.setAttribute('type', 'number');
    nutrientAmountInput.setAttribute('placeholder', 'amount');

    nutrientItem.appendChild(nutrientTypeInput);
    nutrientItem.appendChild(nutrientAmountInput);
    nutritionSection.appendChild(nutrientItem);
  }
  nutritionSection.appendChild(nutrientAddButton);
}

function updateFoodValuesFromAmount() {
  const newAmount = document.getElementById('food-edit-amount').value
  loadFood(currentFoodItem, newAmount);
}

function removeFoodItem() {
  currentFoodItem = null;
  showPage('food-add');
}

function saveDuplicateFoodItem() {
  currentFoodItem = null;
  showPage('food-add');
}

function cancelFoodItem() {
  currentFoodItem = null;
  showPage('food-add');
}

function saveCurrentFoodItem() {
  const foodItemName = document.getElementById('food-edit-name').value
  const foodItemAmount = document.getElementById('food-edit-amount').value
  const nutrients = [...document.getElementById('nutrition-edit').children]
    .filter(element => element.children.length === 2 && element.children[0].value)
    .map(element => { return { name: element.children[0].value, value: element.children[1].value } })
  addFoodLogItem({ name: foodItemName, amount: foodItemAmount, nutrients, time: new Date() })
  currentFoodItem = null;
  showPage('food-add');
}

updateGoalTracker();