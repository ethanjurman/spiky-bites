async function downloadAsCSV() {
  const keys = await idbKeyval.keys();
  const foodItems = (await idbKeyval.getMany(keys.filter(key => key.startsWith('logs-')))).flatMap(i => i);
  const nutritionStrings = [...foodItems.reduce((arr, item) => new Set([...arr, ...item.nutrients.map(n => n.name)]), [])]


  // Define your data as an array of arrays
  const data = [
    ["Name", "Amount (G)", "Time", ...(nutritionStrings.map(ns => ns.replaceAll(',', '')))],
    ...foodItems.map(food => [
      (food.name || "").replaceAll(',', ' - '),
      food.amount,
      food.time,
      ...nutritionStrings.map(nKey => (food.nutrients.find(nutrient => nutrient.name === nKey) || { value: '0' }).value)
    ])
  ];

  // Convert the data to a CSV string
  const csvContent = data.map(row => row.join(",")).join("\n");

  // Create a Blob from the CSV string
  const blob = new Blob([csvContent], { type: 'text/csv' });

  // Create a link element
  const link = document.createElement("a");

  // Set the download attribute with a filename
  link.download = "data.csv";

  // Create a URL for the Blob and set it as the href attribute
  link.href = window.URL.createObjectURL(blob);

  // Append the link to the body (it won't be visible)
  document.body.appendChild(link);

  // Programmatically click the link to trigger the download
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);
}
