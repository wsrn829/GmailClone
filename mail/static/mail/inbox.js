document.addEventListener('DOMContentLoaded', function () {
  // Function to select DOM elements
  function selectElement(id) {
    return document.querySelector(`#${id}`);
  }

  // Function to add event listeners to buttons
  function addButtonListener(button, event, handler) {
    button.addEventListener(event, handler);
  }

  // Function to style mailbox buttons
  function styleButton(button, removeClasses, addClass) {
    removeClasses.forEach(removeClass => {
      button.classList.remove(removeClass);
    });
    button.classList.add(addClass);
  }

  // Helper function to capitalize the first letter of a string
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Use constants for DOM selectors
  const inboxButton = selectElement('inbox');
  const composeButton = selectElement('compose');
  const sentButton = selectElement('sent');
  const archivedButton = selectElement('archived');
  const composeForm = selectElement('compose-form');

  // Style mailbox buttons
  const buttons = [inboxButton, sentButton, archivedButton];
  buttons.forEach(button => {
    styleButton(button, ['btn-primary', 'btn-secondary', 'btn-info'], 'btn-outline-primary');
  });

  // Use buttons to toggle between views
  addButtonListener(inboxButton, 'click', () => load_mailbox('inbox'));
  addButtonListener(sentButton, 'click', () => load_mailbox('sent'));
  addButtonListener(archivedButton, 'click', () => load_mailbox('archive'));
  addButtonListener(composeButton, 'click', compose_email);

  selectElement('compose-form').onsubmit = async function(event) {
    event.preventDefault();

    // Gather data from form
    const recipients = selectElement('compose-recipients').value;
    const subject = selectElement('compose-subject').value;
    const body = selectElement('compose-body').value;

    // Send email
    try {
      const response = await fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
        })
      });
      const result = await response.json();

    // Print result
    console.log(result);

      // Load the sent mailbox
      load_mailbox('sent');
    } catch (error) {
      console.error("Error:", error);
    }
  };

// Load the inbox by default when the page loads
load_mailbox('inbox');


// Define compose_email function globally
function compose_email(event, recipients = '', subject = '', body = '') {
  // Define a function to hide or show an element
  const displayElement = (element, display) => {
    element.style.display = display;
  };

  // Store the elements in an object
  const elements = {
    emailsView: selectElement('emails-view'),
    composeView: selectElement('compose-view'),
    emailView: selectElement('email-view'),
    composeRecipients: selectElement('compose-recipients'),
    composeSubject: selectElement('compose-subject'),
    composeBody: selectElement('compose-body')
  };

  // Show compose view and hide other views
  displayElement(elements.emailsView, 'none');
  displayElement(elements.composeView, 'block');
  displayElement(elements.emailView, 'none');

  // Set the values of the compose form
  elements.composeRecipients.value = recipients;
  elements.composeSubject.value = subject;
  elements.composeBody.value = body;

  // Focus on the body if it's not empty, otherwise focus on the recipients
  (body.length > 0 ? elements.composeBody : elements.composeRecipients).focus();
}

async function load_mailbox(mailbox) {
  // Use constants for DOM selectors
  const emailsView = selectElement('emails-view');
  const composeView = selectElement('compose-view');
  const emailView = selectElement('email-view');
  const inboxButton = selectElement('inbox');
  const sentButton = selectElement('sent');
  const archivedButton = selectElement('archived');

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
    archivedButton.classList.add('btn-info');
  }

  // Show the mailbox name
  emailsView.innerHTML = `<h2 class="mailbox-title">${capitalizeFirstLetter(mailbox)}</h2>`;

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
    const { subject, timestamp, sender, body, recipients, id } = emailData;

    const emailsView = selectElement('emails-view');
    const composeView = selectElement('compose-view');
    const emailView = selectElement('email-view');

    emailsView.style.display = 'none';
    composeView.style.display = 'none';
    emailView.style.display = 'block';

    const subjectTitle = document.createElement("div");
    subjectTitle.textContent = subject;
    subjectTitle.className = 'subject-title';

    const detailedInfo = document.createElement("div");
    detailedInfo.className = 'detailed-info';
    detailedInfo.innerHTML = `
        <div>
            <span class="text-muted">From: </span>${sender}
            <span class="text-muted timestamp">${timestamp}</span>
        </div>
        <div>
            <span class="text-muted">To: </span>${recipients.join()}
        </div>
        <div>
            <span class="text-muted">Subject: </span>${subject}
        </div>
    `;

    const bodySection = document.createElement("div");
    bodySection.textContent = body;
    bodySection.className = 'body-section';

    const replyButton = createButton(`Reply`, "email-btns btn btn-sm btn-outline-secondary", function(event) {
        let replySubject = subject.startsWith("Re: ") ? subject : `Re: ${subject}`;
        let replyBody = `On ${timestamp} <${sender}> wrote:\n${body}\n-------------------------\n`;
        compose_email(event, sender, replySubject, replyBody);
    });

    emailView.innerHTML = "";
    emailView.append(subjectTitle, detailedInfo, replyButton);

    if (fromMailbox === "inbox") {
        const archiveButton = createButton(`Archive`, "email-btns btn btn-sm btn-outline-info", function() {
            updateEmailState(id, {archived: true}, "inbox");
        });
        emailView.append(archiveButton);
    } else if (fromMailbox === "archive") {
        const unarchiveButton = createButton("Move to inbox", "email-btns btn btn-sm btn-outline-info", function() {
            updateEmailState(id, {archived: false}, "inbox");
        });
        emailView.append(unarchiveButton);
    }

    emailView.append(bodySection);
}

function createButton(textContent, className, clickHandler) {
  const button = document.createElement("button");
  button.textContent = textContent;
  button.className = className;
  addButtonListener(button, 'click', clickHandler);
  return button;
}

async function updateEmailState(emailId, state, mailbox) {
  try {
    const response = await fetch(`/emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify(state)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`${response.status}`);
    await load_mailbox(mailbox);
  } catch (error) {
    console.error("Error:", error);
  }
}
});