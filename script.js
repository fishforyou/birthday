document.addEventListener('DOMContentLoaded', function () {
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(function (button) {
    button.addEventListener('click', function (e) {
      buttons.forEach(function (btn) {
        btn.classList.remove('active');
        document.getElementById('content' + btn.id.replace('tab', '')).classList.remove('active');
      });

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
    option.textContent = person.emoji + ' ' + person.fullName;
    dropdown.appendChild(option);
  });
}

function updateCharacterCount() {
  const textarea = document.getElementById('comment');
  const charCount = document.getElementById('charCount');
  const maxLength = parseInt(textarea.getAttribute('maxlength'), 10);

  charCount.textContent = `${textarea.value.length}/${maxLength}`;
}

function populateAttendance(tab, data) {
  const container = document.getElementById(tab);
  container.innerHTML = '';

  data.forEach((person) => {
    const personDiv = document.createElement('div');
    personDiv.classList.add('person');

    const img = document.createElement('img');
    img.loading = 'lazy';
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
  const maybeCount = document.getElementById('maybe-count');

  comingCount.textContent = data.filter((person) => person.status === 'coming').length;
  absentCount.textContent = data.filter((person) => person.status === 'absent').length;
  maybeCount.textContent = data.filter((person) => person.status === 'maybe').length;
}

const scrollableEls = document.querySelectorAll('.scrollable-container');

async function loadAttendanceData() {
  fetch('https://api.jsonbin.io/v3/b/66cdffdaacd3cb34a87a51ba/latest?meta=false')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      sessionStorage.setItem('attendanceData', JSON.stringify(data));
      populateDropdown(data);
      populateAttendance(
        'coming',
        data.filter((person) => person.status === 'coming')
      );
      populateAttendance(
        'absent',
        data.filter((person) => person.status === 'absent')
      );
      populateAttendance(
        'maybe',
        data.filter((person) => person.status === 'maybe')
      );
      addCount(data);
      scrollableEls.forEach((el) => (el.style.display = 'flex'));
    })
    .catch((error) => {
      console.log('There has been a problem with your fetch operation: ' + error.message);
    });
}

loadAttendanceData();

function populateActivity(activityData) {
  const activityList = document.getElementById('activity-list');
  activityList.innerHTML = '';

  activityData.forEach((item) => {
    const newActivityContainer = document.createElement('div');
    newActivityContainer.classList.add('activity-container');

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.textContent = item.emoji;

    const activityText = document.createElement('div');
    activityText.classList.add('activity-text');

    const activityHeader = document.createElement('div');
    activityHeader.classList.add('activity-header');

    const activityName = document.createElement('p');
    activityName.classList.add('activity-name');
    activityName.textContent = item.header;

    const activityBody = document.createElement('p');
    activityBody.classList.add('activity-body');
    activityBody.textContent = item.message;

    activityHeader.appendChild(activityName);
    activityText.appendChild(activityHeader);
    item.message && activityText.appendChild(activityBody);
    newActivityContainer.appendChild(avatar);
    newActivityContainer.appendChild(activityText);
    activityList.appendChild(newActivityContainer);
  });
}

async function loadActivityData() {
  fetch('https://api.jsonbin.io/v3/b/66cdfff7ad19ca34f89bd697/latest?meta=false')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      sessionStorage.setItem('activityData', JSON.stringify(data));
      populateActivity(data);
    })
    .catch((error) => {
      console.log('There has been a problem with your fetch operation: ' + error.message);
    });
}

loadActivityData();

async function updateAttendance(formOutput) {
  const currentData = JSON.parse(sessionStorage.getItem('attendanceData'));
  const updatedData = currentData.map((person) => {
    if (person.firstName.toLowerCase() === formOutput.name) {
      person.status = formOutput.attend === 'yes' ? 'coming' : formOutput.attend === 'tbd' ? 'maybe' : 'absent';
    }
    return person;
  });
  await fetch('https://api.jsonbin.io/v3/b/66cdffdaacd3cb34a87a51ba', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedData),
  }).then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    loadAttendanceData();
  });
  return 'done';
}

async function updateActivity(formOutput) {
  const currentData = JSON.parse(sessionStorage.getItem('activityData'));
  const attendanceData = JSON.parse(sessionStorage.getItem('attendanceData'));
  const sender = formOutput.name.charAt(0).toUpperCase() + formOutput.name.slice(1);
  const attendee = attendanceData.find((person) => person.firstName.toLowerCase() === formOutput.name);
  const rsvp = formOutput.attend === 'yes' ? 'Coming 👍' : formOutput.attend === 'tbd' ? 'Maybe 🤔' : 'Absent 🖕';
  const entryHeader = `${sender} rsvped ${rsvp}`;
  const newEntry = {
    attendee: formOutput.name,
    event: 'attendance',
    emoji: attendee.emoji,
    header: entryHeader,
    timestamp: new Date().toISOString(),
    message: formOutput.comment,
  };
  const updatedData = [newEntry, ...currentData];
  await fetch('https://api.jsonbin.io/v3/b/66cdfff7ad19ca34f89bd697', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedData),
  }).then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    loadActivityData();
  });
  return 'done';
}

function lockForm() {
  const form = document.getElementById('attendance-form');
  const submitButton = document.getElementById('submitButton');
  const formElements = form.querySelectorAll('input, select, textarea, button');
  formElements.forEach((element) => {
    element.disabled = true;
  });
  submitButton.innerHTML = '<span class="spinner"></span>';
}

function unlockForm() {
  const form = document.getElementById('attendance-form');
  const submitButton = document.getElementById('submitButton');
  const formElements = form.querySelectorAll('input, select, textarea, button');
  formElements.forEach((element) => {
    element.disabled = false;
  });
  submitButton.innerHTML = 'Send';
  form.querySelector('input').checked = false;
  form.querySelector('select').selectedIndex = 0;
  form.querySelector('textarea').value = '';
  const charCount = document.getElementById('charCount');
  charCount.textContent = '0/256';
}

const form = document.getElementById('attendance-form');
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const formData = new FormData(form);
  const formOutput = Object.fromEntries(formData);
  lockForm();
  try {
    await Promise.all([updateAttendance(formOutput), updateActivity(formOutput)]);
  } catch (error) {
    console.error('Error updating data:', error);
  } finally {
    unlockForm();
  }
});
