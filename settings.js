const { get, set, update } = idbKeyval;

function saveApiKey() {
  set('api-key', document.getElementById("api-key-input").value)
}

get('api-key').then((value) => {
  document.getElementById("api-key-input").value = value;
});

function renderGoalSettings() {
  get('goals').then((goals) => {
    const goalsContainer = document.getElementById("goals-settings-container");
    goalsContainer.innerHTML = "";
    (goals || []).forEach((goalData, index) => {
      const goal = document.createElement("div");
      goal.classList.add("goal-input-wrapper");
      const goalType = document.createElement("input");
      goalType.setAttribute('list', 'nutrients');
      goalType.value = goalData.type;
      goalType.placeholder = "Type"
      goalType.onchange = (e) => updateGoalItem(index, 'type', e.target.value)
      const goalMin = document.createElement("input");
      goalMin.type = "number";
      goalMin.value = goalData.min;
      goalMin.placeholder = "Min"
      goalMin.onchange = (e) => updateGoalItem(index, 'min', e.target.value)
      const goalMax = document.createElement("input");
      goalMax.type = "number";
      goalMax.value = goalData.max;
      goalMax.placeholder = "Max"
      goalMax.onchange = (e) => updateGoalItem(index, 'max', e.target.value)
      const goalColor = document.createElement("input");
      goalColor.type = "color";
      goalColor.value = goalData.color;
      goalColor.onchange = (e) => updateGoalItem(index, 'color', e.target.value);
      const goalRemove = document.createElement("button");
      goalRemove.onclick = () => removeGoal(index);
      goalRemove.innerHTML = `<img
    src="images/trash_icon.svg"
    alt="remove goal"
    style="filter: brightness(0)"
    />`

      goal.appendChild(goalType);
      goal.appendChild(goalMin);
      goal.appendChild(goalMax);
      goal.appendChild(goalColor);
      goal.appendChild(goalRemove);
      goalsContainer.appendChild(goal);
    })
  })
}

renderGoalSettings();

function addGoal() {
  update("goals", (goals) => (goals || []).concat({ type: "", min: null, max: null, color: '#000000' }));
  updateGoalTracker();
  renderGoalSettings();
}

function updateGoalItem(index, attribute, newValue) {
  update("goals", (goals) => {
    return goals.map((goal, i) => i === index ? { ...goal, [attribute]: newValue } : goal);
  })
  updateGoalTracker();
}

function removeGoal(index) {
  update("goals", (goals) => (goals || []).filter((_, goalIndex) => goalIndex === index ? false : true));
  updateGoalTracker();
  renderGoalSettings();
}
