const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {defineString} = require("firebase-functions/params");
const admin = require("firebase-admin");
const Mailjet = require("node-mailjet");

// Mailjet requires two keys
const mjApiKey = defineString("MAILJET_API_KEY");
const mjApiSecret = defineString("MAILJET_API_SECRET");

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Use onDocumentCreated for v2 functions
exports.onNewApplication = onDocumentCreated(
    "{collectionId}/{docId}",
    async (event) => {
      // Initialize Mailjet with the keys
      const mailjet = Mailjet.apiConnect(
          mjApiKey.value(),
          mjApiSecret.value(),
      );

      if (!event.data) {
        console.log("Event triggered without data, exiting.");
        return;
      }

      // Get the collection and document ID
      const collectionId = event.params.collectionId;
      const docId = event.params.docId;

      const monitoredCollections = [
        "SeekingMentor-Caregiver",
        "SeekingMentor-Survivor",
        "Mentor-Caregiver",
        "Mentor-Survivor",
      ];

      // If the document was created in a collection we don't care about, exit.
      if (!monitoredCollections.includes(collectionId)) {
        console.log(`Ignoring creation 
          in unmonitored collection: ${collectionId}`);
        return;
      }

      // Get the data from the newly created document
      const applicationData = event.data.data();
      const applicantName = `${applicationData.firstname} 
      ${applicationData.lastname}`;
      const applicantEmail = applicationData.email;

      console.log(`New application by ${applicantName} in ${collectionId}`);
      console.log(
          "familyZip on created document:",
          applicationData.familyZip !== undefined && applicationData.familyZip !== null
            ? applicationData.familyZip
            : "(field missing from write)",
      );

      // Construct the Mailjet request
      const request = mailjet.post("send", {version: "v3.1"}).request({
        Messages: [
          {
            From: {
              Email: "trevorconnolly616@gmail.com",
              Name: "CBTF Mentor Project",
            },
            To: [
              {
                Email: "sfreeman@cbtf.org", // Admin email
                Name: "Admin",
              },
              {
                Email: "rkarchner@cbtf.org", // Admin email
                Name: "Admin",
              },
            ],
            Subject: `New Mentor Application Received: ${applicantName}`,
            HTMLPart: `
              <p>A new application was submitted to the 
              CBTF Mentoring System.</p>
              <hr>
              <h3>Applicant Details:</h3>
              <ul>
                  <li><strong>Name:</strong> ${applicantName}</li>
                  <li><strong>Email:</strong> ${applicantEmail}</li>
                  <li><strong>Applying For:</strong> ${applicationData.seeking}
                  </li>
                  <li><strong>Collection:</strong> ${collectionId}</li>
                  <li><strong>Document ID:</strong> ${docId}</li>
              </ul>
              <hr>
              <p>You can view the full submission in the Firestore database.</p>
            `,
          },
        ],
      });

      // Send the email
      try {
        const result = await request;
        console.log("Notification email sent successfully:", result.body);
      } catch (error) {
        console.error("Error sending email:", error.statusCode);
        if (error.originalMessage) {
          console.error(error.originalMessage);
        }
      }
    },
);
