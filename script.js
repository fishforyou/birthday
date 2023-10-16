document.addEventListener('DOMContentLoaded', function () {
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(function (button) {
    button.addEventListener('click', function (e) {
      // Remove 'active' from other buttons and contents
      buttons.forEach(function (btn) {
        btn.classList.remove('active');
        document.getElementById('content' + btn.id.replace('tab', '')).classList.remove('active');
      });

      // Add 'active' to clicked button and its content
      e.target.classList.add('active');
      document.getElementById('content' + e.currentTarget.id.replace('tab', '')).classList.add('active');
    });
  });
});

function populateDropdown(data) {
  const dropdown = document.getElementById('name');

  data.forEach((person) => {
    const option = document.createElement('option');
    option.value = person.firstName.toLowerCase();
    option.textContent = person.fullName;
    dropdown.appendChild(option);
  });
}

function populateList(tab, data) {
  const container = document.getElementById(tab);
  container.innerHTML = '';

  data.forEach((person) => {
    const personDiv = document.createElement('div');
    personDiv.classList.add('person');

    const img = document.createElement('img');
    img.src = `people/${person.firstName.toLowerCase()}.png`;
    img.alt = person.name;

    const span = document.createElement('span');
    span.textContent = person.firstName;

    personDiv.appendChild(img);
    personDiv.appendChild(span);
    container.appendChild(personDiv);
  });
}

function addCount(data) {
  const comingCount = document.getElementById('coming-count');
  const absentCount = document.getElementById('absent-count');
  const pendingCount = document.getElementById('pending-count');

  comingCount.textContent = data.filter((person) => person.status === 'coming').length;
  absentCount.textContent = data.filter((person) => person.status === 'absent').length;
  pendingCount.textContent = data.filter((person) => person.status === 'pending').length;
}

const loadingEls = document.querySelectorAll('.loading');
const scrollableEls = document.querySelectorAll('.scrollable-container');

function loadData() {
  loadingEls.forEach((el) => (el.style.display = 'block'));
  fetch('https://api.jsonbin.io/v3/b/652d775212a5d376598c8628/latest?meta=false')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      sessionStorage.setItem('attendanceData', JSON.stringify(data));
      populateDropdown(data);
      loadingEls.forEach((el) => (el.style.display = 'none'));
      populateList(
        'coming',
        data.filter((person) => person.status === 'coming')
      );
      populateList(
        'absent',
        data.filter((person) => person.status === 'absent')
      );
      populateList(
        'pending',
        data.filter((person) => person.status === 'pending')
      );
      addCount(data);
      scrollableEls.forEach((el) => (el.style.display = 'flex'));
    })
    .catch((error) => {
      console.log('There has been a problem with your fetch operation: ' + error.message);
    });
}

loadData();

function updateAttendance(formOutput) {
  loadingEls.forEach((el) => (el.style.display = 'block'));
  scrollableEls.forEach((el) => (el.style.display = 'none'));
  const currentData = JSON.parse(sessionStorage.getItem('attendanceData'));
  const updatedData = currentData.map((person) => {
    if (person.firstName.toLowerCase() === formOutput.name) {
      person.status = formOutput.attend === 'yes' ? 'coming' : 'absent';
    }
    return person;
  });
  fetch('https://api.jsonbin.io/v3/b/652d775212a5d376598c8628', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedData),
  }).then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    loadData();
  });
}

const form = document.getElementById('attendance-form');
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(form);
  const formOutput = Object.fromEntries(formData);
  updateAttendance(formOutput);
});
