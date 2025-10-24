document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message
  activitiesList.innerHTML = "";
  // Reset activity select to avoid duplicate options on re-fetch
  activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML with delete buttons
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = `<ul class=\"participants-list\">` + details.participants.map(participant => {
            // safe-encode email for dataset usage
            const emailEscaped = participant.replace(/"/g, '&quot;');
            const initials = participant.split('@')[0].split(/[._-]/).map(s => s[0]).join('').toUpperCase().slice(0,2);
            return `
              <li>
                <span class=\"participant-avatar\">${initials}</span>
                <span class=\"participant-name\">${participant}</span>
                <button class=\"delete-participant\" data-activity=\"${name}\" data-email=\"${emailEscaped}\" aria-label=\"Remove participant\">✕</button>
              </li>`;
          }).join('') + `</ul>`;
        } else {
          participantsHtml = `<div class=\"participants-empty\">No participants yet</div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Participants:</strong></p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Event delegation for delete buttons
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-participant');
    if (!btn) return;

    const activity = btn.dataset.activity;
    const email = btn.dataset.email;

    if (!activity || !email) return;

    if (!confirm(`Remove ${email} from ${activity}?`)) return;

    try {
      const res = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });

      const result = await res.json();
      if (res.ok) {
        // refresh list
        fetchActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = 'message success';
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 4000);
      } else {
        messageDiv.textContent = result.detail || 'Failed to remove participant';
        messageDiv.className = 'message error';
        messageDiv.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Error removing participant:', err);
      messageDiv.textContent = 'Failed to remove participant. Try again.';
      messageDiv.className = 'message error';
      messageDiv.classList.remove('hidden');
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 4 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 4000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
