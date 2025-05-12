const keys = [
  "dt-home",
  "dt-subscriptions",
  "dt-search",
  "dt-playlists",
  "dt-channel",
];

window.onload = () => {
  chrome.storage.sync.get(keys, (result) => {
    keys.forEach((key) => {
      document.getElementById(key).checked = result[key] ?? true;
    });
  });

  keys.forEach((key) => {
    document.getElementById(key).addEventListener("change", (e) => {
      chrome.storage.sync.set({ [key]: e.target.checked });
    });
  });
};

function loadRelaxationRules() {
  chrome.storage.sync.get(["relaxationRules"], (res) => {
    const rules = res.relaxationRules || [];
    const list = document.getElementById("relaxation-list");
    list.innerHTML = "";
    rules.forEach((r, i) => {
      const item = document.createElement("li");
      item.textContent = `${r.days.join(", ")} - ${r.start}  to ${r.end}`;

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.style.marginLeft = "10px";
      delBtn.onclick = () => {
        const updated = [...rules.slice(0, i), ...rules.slice(i + 1)];
        chrome.storage.sync.set(
          { relaxationRules: updated },
          loadRelaxationRules,
        );
      };

      list.appendChild(delBtn);
      list.appendChild(item);
    });
  });
}

document.getElementById("add-relaxation").addEventListener("click", () => {
  const days = Array.from(document.getElementById("days").selectedOptions).map(
    (o) => o.value,
  );
  const start = document.getElementById("start-time").value;
  const end = document.getElementById("end-time").value;

  if (!days.length || !start || !end) {
    alert("Please fill all fields");
    return;
  }

  chrome.storage.sync.get(["relaxationRules"], (res) => {
    const rules = res.relaxationRules || [];
    rules.push({ days, start, end });
    chrome.storage.sync.set({ relaxationRules: rules }, loadRelaxationRules);
  });
});

loadRelaxationRules();
