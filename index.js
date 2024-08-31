let amount = 100;

async function searchFoods() {
  const searchTerm = document.getElementById("search").value;
  const apiKey = document.getElementById("api-key-input").value;
  try {
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${searchTerm}`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    document.getElementById('food-amount-input').style.display = '';
    updateSelectableFoodItems(json.foods, 0);
  } catch (err) {
    console.error(err);
  }
}

function showSettings() {
  const currentDisplay = document.getElementById("settings").style.display;
  if (currentDisplay === "none") {
    document.getElementById("settings").style.display = "";
  } else if (currentDisplay === "") {
    document.getElementById("settings").style.display = "none";
  }
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
  itemWrapper.innerHTML = "";
  const hasMore = foodItems.length > start + 8;
  const end = (hasMore ? start + 7 : start + 8) + (start === 0 ? 1 : 0);
  if (start > 1) {
    // add food item that is a back button
    const backElement = document.createElement('button');
    backElement.classList.add('food-button');
    backElement.innerHTML = `
      <img src="images/arrow_back_icon.svg" alt="previous items" style="filter: brightness(0);" />
    `
    backElement.onclick = () => updateSelectableFoodItems(foodItems, Math.max(start - 8, 0));
    itemWrapper.appendChild(backElement);
  }
  foodItems.slice(start, end).forEach(item => {
    const itemElement = document.createElement('button');
    itemElement.classList.add('food-button');
    itemElement.innerHTML = `<div><b>${item.description}</b></div><div>${item.brandName ? item.brandName + ' ' : ''}${item.brandOwner ? item.brandOwner : ''}</div>`
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

updateGoalTracker();