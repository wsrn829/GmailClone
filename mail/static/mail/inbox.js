document.addEventListener('DOMContentLoaded', function () {
  // Use constants for DOM selectors
  const inboxButton = document.querySelector('#inbox');
  const composeButton = document.querySelector('#compose');
  const sentButton = document.querySelector('#sent');
  const archivedButton = document.querySelector('#archived');
  const composeForm = document.querySelector('#compose-form');

   // Style mailbox buttons
   const buttons = [inboxButton, sentButton, archivedButton];
   buttons.forEach(button => {
     button.classList.remove('btn-primary', 'btn-secondary', 'btn-success');
     button.classList.add('btn-outline-primary');
   });

  // Use buttons to toggle between views
  inboxButton.addEventListener('click', () => load_mailbox('inbox'));
  composeButton.addEventListener('click', compose_email);
  sentButton.addEventListener('click', () => load_mailbox('sent'));
  archivedButton.addEventListener('click', () => load_mailbox('archive'));

  // Actions when submitting compose email form
  composeForm.onsubmit = async () => {
    // retrieve data entered by the user
    const recipients = document.querySelector('#compose-recipients').value
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    // Send POST request to /emails
    try {
      const response = await fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({recipients, subject, body})
      });
      const result = await response.json();
      if (result.error) {
        console.log(`${result.error}`);
      } else {
        load_mailbox('sent');
      }
    } catch (err) {
      console.log(err);
      // Display error message to user
    }

    return false;
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

// Define compose_email function globally
function compose_email(event, recipients = '', subject = '', body = '') {
  // Show compose view and hide other views
  const emailsView = document.querySelector('#emails-view');
  const composeView = document.querySelector('#compose-view');
  const emailView = document.querySelector('#email-view');
  const composeRecipients = document.querySelector('#compose-recipients');
  const composeSubject = document.querySelector('#compose-subject');
  const composeBody = document.querySelector('#compose-body');

  emailsView.style.display = 'none';
  composeView.style.display = 'block';
  emailView.style.display = 'none';

  composeRecipients.value = recipients;
  composeSubject.value = subject;
  composeBody.value = body;

  (body.length > 0 ? composeBody : composeRecipients).focus();
}

async function load_mailbox(mailbox) {
  // Use constants for DOM selectors
  const emailsView = document.querySelector('#emails-view');
  const composeView = document.querySelector('#compose-view');
  const emailView = document.querySelector('#email-view');
  const inboxButton = document.querySelector('#inbox');
  const sentButton = document.querySelector('#sent');
  const archivedButton = document.querySelector('#archived');

  // Show the mailbox and hide other views
  emailsView.style.display = 'block';
  composeView.style.display = 'none';
  emailView.style.display = 'none';

  // Style mailbox buttons
  if (mailbox === "inbox") {
    inboxButton.classList.remove('btn-outline-primary');
    inboxButton.classList.add('btn-primary');
  } else if (mailbox === "sent") {
    sentButton.classList.remove('btn-outline-primary');
    sentButton.classList.add('btn-secondary');
  } else {
    archivedButton.classList.remove('btn-outline-primary');
    archivedButton.classList.add('btn-success');
  }

  // Show the mailbox name
  emailsView.innerHTML = `<h2 class="mailbox-title">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h2>`;

  // Request for emails from the specified mailbox
  const response = await fetch(`/emails/${mailbox}`);
  const emails = await response.json();

  emails.forEach(async (email) => {
    // Ensure the read status is set to false if not provided by the server
    if (email.read === undefined) {
      email.read = false;
    } else {
      email.read = email.read;
    }
    // Create email div
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="far fa-square email-icon"></div>
      <span class="email-sender">${email.sender}</span>
      <span class="email-subject">${email.subject}</span>
      <span class="email-timestamp">${email.timestamp}</span>`;
    div.className = "mailbox-email";
    if (email.read) {
      div.classList.add('read');
    }

    // Display the contents of the specific email that was clicked
    console.log("Attaching event listener to email:", email.id);
    // Display the contents of the specific email that was clicked
    div.addEventListener('click', async function() {
      console.log("Email clicked:", email.id);
      const emailResponse = await fetch(`/emails/${email.id}`);
      const emailData = await emailResponse.json();

      console.log("Email read status before PUT request:", emailData.read);

      // Set this email to read by sending a PUT request
      if (!emailData.read) {
        console.log("Attempting to mark email as read...");
        const putResponse = await fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({read: true})
        });
        console.log(`PUT status for updating read state returned status code ${putResponse.status}`);

        // Update the email.read property
        emailData.read = true;
        console.log("Email read status after PUT request:", emailData.read);
      }

      // Change background color of email if it has been read already
      if (emailData.read) {
        div.classList.add('read');
      } else {
        div.classList.remove('read');
      }
      // Load the details of the email onto the page
      loadEmail(emailData, mailbox);
    });

    // Append the div to emailsView after the click event listener has been added to it
    emailsView.append(div);
  });
}

  function loadEmail(emailData, fromMailbox) {
    const emailsView = document.querySelector('#emails-view');
    const composeView = document.querySelector('#compose-view');
    const emailView = document.querySelector('#email-view');

    emailsView.style.display = 'none';
    composeView.style.display = 'none';
    emailView.style.display = 'block';

    const subjectTitle = document.createElement("div");
    subjectTitle.innerHTML = emailData.subject;
    subjectTitle.className = 'subject-title';

    const detailedInfo = document.createElement("div");
    detailedInfo.className = 'detailed-info';
    detailedInfo.innerHTML = `
        <div>
            <span class="text-muted">From: </span>${emailData.sender}
            <span class="text-muted timestamp">${emailData.timestamp}<i class="far fa-star star-icon"></i></span>
        </div>
        <div>
            <span class="text-muted">To: </span>${emailData.recipients.join()}
        </div>
        <div>
            <span class="text-muted">Subject: </span>${emailData.subject}
        </div>
    `;

    const bodySection = document.createElement("div");
    bodySection.innerText = emailData.body;
    bodySection.className = 'body-section';

    const replyButton = createButton("<i class=\"fas fa-arrow-circle-left\" style='margin-right: 5px'></i>Reply", "email-btns btn btn-sm btn-outline-secondary", function(event) {
        let subject = emailData.subject.startsWith("Re: ") ? emailData.subject : `Re: ${emailData.subject}`;
        let body = `On ${emailData.timestamp} <${emailData.sender}> wrote:\n${emailData.body}\n--------\n`;
        let recipient = emailData.sender;
        compose_email(event, recipient, subject, body);
    });

    emailView.innerHTML = "";
    emailView.append(subjectTitle, detailedInfo, replyButton);

    if (fromMailbox === "inbox") {
        const archiveButton = createButton("<i class=\"fas fa-archive\" style=\"margin-right: 5px\"></i>Archive", "email-btns btn btn-sm btn-outline-warning", function() {
            updateEmailState(emailData.id, {archived: true}, "inbox");
        });
        emailView.append(archiveButton);
    } else if (fromMailbox === "archive") {
        const unarchiveButton = createButton("<i class=\"fas fa-inbox\" style=\"margin-right: 5px\"></i>Move to inbox", "email-btns btn btn-sm btn-outline-danger", function() {
            updateEmailState(emailData.id, {archived: false}, "inbox");
        });
        emailView.append(unarchiveButton);
    }

    emailView.append(bodySection);
  }

  function createButton(innerHtml, className, clickHandler) {
    const button = document.createElement("button");
    button.innerHTML = innerHtml;
    button.className = className;
    button.addEventListener('click', clickHandler);
    return button;
  }

  function updateEmailState(emailId, state, mailbox) {
    fetch(`/emails/${emailId}`, {
        method: 'PUT',
        body: JSON.stringify(state)
    })
    .then(response => {
        console.log(`${response.status}`);
        load_mailbox(mailbox);
    });
  }