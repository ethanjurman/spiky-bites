const { get, set, update } = idbKeyval;

get('background-color').then(color => {
  const value = color || '#40798c';
  document.documentElement.style.setProperty('--color-background', value)
  document.getElementById('background-color').value = value;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', value);
});
get('button-color').then(color => {
  const value = color || '#ffffff';
  document.documentElement.style.setProperty('--color-button', value)
  document.getElementById('button-color').value = value;
});
get('text-color').then(color => {
  const value = color || '#000000';
  document.documentElement.style.setProperty('--color-text', value)
  document.getElementById('text-color').value = value;
});

function saveApiKey() {
  set('api-key', document.getElementById("api-key-input").value);
  document.getElementById('search').value = '';
}

get('api-key').then((value) => {
  document.getElementById("api-key-input").value = value || '';
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
      goalType.placeholder = "Type";
      goalType.onchange = (e) => {
        const closerString = getClosestOption(e.target.value, nutrientsStrings);
        if (closerString !== e.target.value) {
          e.target.value = closerString;
        }
        updateGoalItem(index, 'type', e.target.value)
      };
      const goalRemove = document.createElement("button");
      goalRemove.classList.add("danger");
      goalRemove.onclick = () => removeGoal(index);
      goalRemove.innerHTML = `<img
    src="images/trash_icon.svg"
    alt="remove goal"
    style="filter: brightness(0)"
    />`

      goal.appendChild(goalType);
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

function resetColors() {
  document.getElementById(`background-color`).value = '#40798c'
  document.getElementById(`button-color`).value = '#ffffff'
  document.getElementById(`text-color`).value = '#000000'

  updateColor('background', '#40798c')
  updateColor('button', '#ffffff');
  updateColor('text', '#000000');
}

function updateColor(key) {
  const newValue = document.getElementById(`${key}-color`).value;
  set(`${key}-color`, document.getElementById(`${key}-color`).value)
  document.documentElement.style.setProperty(`--color-${key}`, newValue);
  if (key === 'background') {
    document.querySelector('meta[name="theme-color"]').setAttribute('content', newValue);
  }
}