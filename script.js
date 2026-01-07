/* PROPERTY OF CHARITH NERANGA 
   This script is protected against unauthorized copying.
*/
let lastRaces = [];

document.getElementById("password").addEventListener("keypress", function (e) {
  if (e.key === "Enter") checkPassword();
});

function checkPassword() {
  const entered = document.getElementById("password").value;
  if (entered === "lal1234") { // Password remains the same
    document.getElementById("passwordScreen").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
  } else {
    alert("Incorrect password!");
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;");
}

function clearAll() {
  document.getElementById('raceText').value = '';
  for (let i = 1; i <= 10; i++) {
    const el = document.getElementById('raceFile' + i);
    if (el) el.value = '';
  }
  document.getElementById('meetingsInput').value = '';
  document.getElementById('minPrize').value = '';
  document.getElementById('maxPrize').value = '';
  document.getElementById('output').innerHTML = '';
  lastRaces = [];
}

// File listener logic
for (let i = 1; i <= 10; i++) {
  const el = document.getElementById('raceFile' + i);
  if (!el) continue;
  el.addEventListener('change', function(e){
    const files = e.target.files;
    if (!files.length) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(evt){
        document.getElementById('raceText').value += evt.target.result + '\n';
      };
      reader.readAsText(file);
    });
  });
}

function processText() {
  const text = document.getElementById('raceText').value;
  const output = document.getElementById('output');
  const minPrize = parseInt(document.getElementById('minPrize').value || 0);
  const maxPrize = parseInt(document.getElementById('maxPrize').value || 900000000);

  const meetingsRaw = document.getElementById('meetingsInput').value;
  const meetingsFilter = meetingsRaw
    ? meetingsRaw.split(',').map(m => m.trim().toUpperCase()).filter(m => m.length > 0)
    : [];

  if (!text.trim()) {
    alert('Please paste race card text or upload a file first.');
    return;
  }

  const lines = text.split(/\r?\n/);
  let races = [];
  let currentMeeting = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('@Cour:')) {
      const courMatch = line.match(/@Cour:([^\d]+)/);
      currentMeeting = courMatch ? courMatch[1].trim() : '';
    }
    if (line.startsWith('@Race:')) {
      const raceLine = line.replace('@Race:', '').trim();
      const raceMatch = raceLine.match(/^(\S+)\s+(\d{1,2}:\d{2})\s*\(?(\d{1,2}:\d{2})?\)?\s*(.+)\s+\$([\d,]+)/);
      if (!raceMatch) continue;
      const raceNumber = raceMatch[1];
      const AusiTime = raceMatch[2];
      const slTime = raceMatch[3] || 'N/A';
      const raceName = raceMatch[4];
      const prize = parseInt(raceMatch[5].replace(/,/g, ''));
      if (meetingsFilter.length && !meetingsFilter.includes(currentMeeting.toUpperCase())) continue;
      if (prize < minPrize || prize > maxPrize) continue;
      races.push({ meeting: currentMeeting, raceNumber, AusiTime, rawSLTime: slTime, raceName, prize });
    }
  }

  if (!races.length) {
    output.innerHTML = '<p class="text-warning">No races found for the selected criteria.</p>';
    lastRaces = [];
    return;
  }

  races.sort((a, b) => {
    const timeToMinutes = t => {
      if (t === 'N/A') return 9999;
      const parts = t.split(/[:.]/).map(Number);
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    };
    return timeToMinutes(a.rawSLTime) - timeToMinutes(b.rawSLTime);
  });

  lastRaces = races; 
  displayRaces(races);
}

function showTop5() {
  if (!lastRaces.length) {
    alert("Please process races first.");
    return;
  }
  const top5 = [...lastRaces].sort((a, b) => b.prize - a.prize).slice(0, 5);
  displayRaces(top5);
}

function showTop15() {
  if (!lastRaces.length) {
    alert("Please process races first.");
    return;
  }
  const top15 = [...lastRaces].sort((a, b) => b.prize - a.prize).slice(0, 15);
  displayRaces(top15);
}

function showTop40() {
  if (!lastRaces.length) {
    alert("Please process races first.");
    return;
  }
  const top40 = [...lastRaces].sort((a, b) => b.prize - a.prize).slice(0, 40);
  displayRaces(top40);
}

function showTop10Meetings() {
  if (!lastRaces.length) {
    alert("Please process races first.");
    return;
  }
  const bestRacesByMeeting = {};
  lastRaces.forEach(race => {
    const meetingKey = (race.meeting || '').toString().trim() || 'Unknown';
    if (!bestRacesByMeeting[meetingKey] || race.prize > bestRacesByMeeting[meetingKey].prize) {
      bestRacesByMeeting[meetingKey] = Object.assign({}, race, { meeting: meetingKey });
    }
  });
  const bestRaces = Object.values(bestRacesByMeeting).sort((a, b) => b.prize - a.prize);
  const top10Meetings = bestRaces.slice(0, 10);
  displayRaces(top10Meetings);
}

function showAllMeetingsBest() {
  if (!lastRaces.length) {
    alert("Please process races first.");
    return;
  }
  const bestRacesByMeeting = {};
  lastRaces.forEach(race => {
    const meetingKey = (race.meeting || '').toString().trim() || 'Unknown';
    if (!bestRacesByMeeting[meetingKey] || race.prize > bestRacesByMeeting[meetingKey].prize) {
      bestRacesByMeeting[meetingKey] = Object.assign({}, race, { meeting: meetingKey });
    }
  });
  const bestRaces = Object.values(bestRacesByMeeting).sort((a, b) => b.prize - a.prize);
  displayRaces(bestRaces);
}

function displayRaces(races) {
  const output = document.getElementById('output');
  output.innerHTML = races.map(r => `
    <div class="race-block">
      <div class="race-meeting">Race Course: ${r.meeting}</div>
      <div class="race-number">Race Number: ${r.raceNumber}</div>
      <div class="race-time">Ausi Time: ${r.AusiTime}</div>
      <div class="race-time">SL Time: ${r.rawSLTime}</div>
      <div>Race Name: ${escapeHtml(r.raceName)}</div>
      <div class="race-prize">Prize Money: $${r.prize.toLocaleString()}</div>
    </div>
  `).join('');
}
