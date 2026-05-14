// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXdv8OHvA1vZeouEMYw45lzE7JDK3ZGxg", // Consider moving to environment variables
    authDomain: "mentorproject-4d84b.firebaseapp.com",
    projectId: "mentorproject-4d84b",
    storageBucket: "mentorproject-4d84b.firebasestorage.app",
    messagingSenderId: "686222030703",
    appId: "1:686222030703:web:2b44f7c49c9081eb3d9a9a",
    measurementId: "G-DYSL048FPR"
};

// Initialize Firebase and Firestore only
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Form validation function
function validateForm(formData) {
    if (!formData.firstname || !formData.lastname || !formData.email) {
        throw new Error('Please fill in all required fields (First Name, Last Name, Email)');
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
        throw new Error('Please enter a valid email address');
    }
    if (!formData.number) {
        throw new Error('Please enter a phone number');
    }
    if (!formData.familyZip) {
        throw new Error('Please enter the ZIP code where your family is located');
    }
    if (!/^\d{5}(-\d{4})?$/.test(formData.familyZip)) {
        throw new Error('Please enter a valid ZIP code (5 digits, or ZIP+4)');
    }
    if (!formData.seeking) {
        throw new Error('Please select your role (what you are seeking)');
    }

    const requiredSurvivorFields = ['age', 'gender', 'gradelevel', 'ethnicity', 'income', 
                           'oldersiblings', 'youngersiblings', 'twin', 'diagnosis', 
                           'DiagnosisAge', 'time'];
    
    for (let field of requiredSurvivorFields) {
        // These fields are only strictly required if not a Parent/Caregiver only role
        // or if they are filled by a survivor being represented by a Parent/Caregiver
        const isMentorCaregiverOnly = formData.seeking === "A Parent/Caregiver seeking to become a mentor for a Parent/Caregiver";
        if (!isMentorCaregiverOnly && !formData[field]) {
             throw new Error(`Please complete all required fields. Missing: ${field}`);
        }
    }
    
    const isParentCaregiverRole = formData.seeking.includes("Parent/Caregiver");
    if (isParentCaregiverRole) {
        const extraSection = document.getElementById("Parent/Caregiver-Extra");
        if (extraSection && extraSection.style.display === "block") { // Check if section is visible
            if (!formData.parentcaregiverage || !formData.parentcaregivergender) {
                 throw new Error('Please complete the Parent/Caregiver information section (Age and Gender).');
            }
        }
    }
    return true;
}

// Helper function to safely get form field value
function getFieldValue(selector) {
    const element = document.querySelector(selector);
    return element ? element.value.trim() : null;
}

// Add this new helper function in app.js
function getSelectedRadioValue(name) {
    const selectedRadio = document.querySelector(`input[name="${name}"]:checked`);
    return selectedRadio ? selectedRadio.value.trim() : null;
}

// Helper function to get checkbox values
function getCheckboxValues(selector) {
    return Array.from(document.querySelectorAll(`${selector}:checked`)).map(cb => cb.value.trim());
}

// Show loading state on submit button
function setSubmitButtonState(loading = false) {
    const submitButton = document.querySelector('input[type="submit"]');
    if (!submitButton) return;
    
    if (loading) {
        submitButton.dataset.originalText = submitButton.value;
        submitButton.value = 'Submitting...';
        submitButton.disabled = true;
        submitButton.style.opacity = '0.6';
    } else {
        submitButton.value = submitButton.dataset.originalText || 'Submit';
        submitButton.disabled = false;
        submitButton.style.opacity = '1';
    }
}

// Generate custom document ID
function generateCustomDocId(firstname, lastname) {
    const cleanFirstname = firstname.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanLastname = lastname.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${cleanFirstname}_${cleanLastname}_${randomNum}`;
}

// Determine collection based on user type
function determineCollection(seeking) {
    const cleanSeeking = seeking.trim();
    let collection = '';
    
    if (cleanSeeking === "Seeking a mentor for a Parent/Caregiver") {
        collection = 'SeekingMentor-Caregiver';
    } else if (cleanSeeking === "Seeking a mentor for a Brain Tumor Survivor") {
        collection = 'SeekingMentor-Survivor';
    } else if (cleanSeeking === "A Parent/Caregiver seeking to become a mentor for a Parent/Caregiver") {
        collection = 'Mentor-Caregiver';
    } else if (cleanSeeking === "A Brain Tumor Survivor seeking to become a mentor for a Brain Tumor Survivor") {
        collection = 'Mentor-Survivor';
    } else {
        // Fallback, though ideally, this shouldn't be hit with correct radio values
        if (cleanSeeking.toLowerCase().includes("seeking a mentor")) {
            collection = (cleanSeeking.toLowerCase().includes("parent") || cleanSeeking.toLowerCase().includes("caregiver")) ? 'SeekingMentor-Caregiver' : 'SeekingMentor-Survivor';
        } else {
            collection = (cleanSeeking.toLowerCase().includes("parent") || cleanSeeking.toLowerCase().includes("caregiver")) ? 'Mentor-Caregiver' : 'Mentor-Survivor';
        }
    }
    return collection;
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    setSubmitButtonState(true);
    let finalDocId; // Will store the ID of the created/set document

    try {
        const selectedIamRadio = document.querySelector('input[name="I-am"]:checked');
        const iamValue = selectedIamRadio ? selectedIamRadio.value.trim() : '';

        // NEW: Special handling for Time Zone to capture the "Other" text field
        const selectedTimezone = getSelectedRadioValue('timezone');
        let finalTimezone = selectedTimezone;
        if (selectedTimezone === 'Other') {
            const otherTimezoneText = getFieldValue('[name="other_timezone"]');
            finalTimezone = otherTimezoneText || 'Other'; // Use the text if provided, otherwise default to 'Other'
        }

        // Populate formData (ensure all necessary fields are here before use)
        const formData = {
            firstname: getFieldValue('[name="first-name"]') || '',
            lastname: getFieldValue('[name="last-name1"]') || '',
            email: getFieldValue('[name="email"]') || '',
            number: getFieldValue('[name="number"]') || '',
            familyZip: (getFieldValue('[name="family-zip"]') || '').trim(),
            // NEW: Add the new fields to the formData object for database storage
            timezone: finalTimezone || '',
            mentorReason: getFieldValue('[name="mentor_reason"]') || '',
            hadMentorBefore: getSelectedRadioValue('had_mentor_before') || '',
            beenMentorBefore: getSelectedRadioValue('been_a_mentor_before') || '',
            // --- End of new fields
            DiagnosisAge: getSelectedRadioValue('diagnosis-age') || '', 
            seeking: iamValue,
            ethnicity: getSelectedRadioValue('ethnicity') || '',         
            schoolperformance: getCheckboxValues('[name="School-performance"]'),
            parentcaregiverage: getSelectedRadioValue('Par/Car-Age') || '', 
            parentcaregivergender: getSelectedRadioValue('Par/Car-Gender') || '', 
            age: getSelectedRadioValue('age') || '',                     
            gender: getSelectedRadioValue('gender') || '',              
            gradelevel: getSelectedRadioValue('grade-level') || '',     
            income: getSelectedRadioValue('income') || '',               
            oldersiblings: getSelectedRadioValue('older-siblings') || '',
            youngersiblings: getSelectedRadioValue('younger-siblings') || '',
            twin: getSelectedRadioValue('twin') || '',                   
            diagnosis: getSelectedRadioValue('diagnosis') || '',         
            time: getSelectedRadioValue('time') || '',                   
            medicalinfo: getCheckboxValues('[name="mi"]'),
            treatment: getCheckboxValues('[name="treatment"]'),
            physicaleffects: getCheckboxValues('[name="physical-Effects"]'),
            cognitiveeffects: getCheckboxValues('[name="Cognitive-effects"]'),
            emotionaleffects: getCheckboxValues('[name="Emotional-effects"]')
        };

        validateForm(formData); // Call after formData is fully populated

        // Calculate responseSet after formData is fully populated
        const responseSet = new Set();
        [
            formData.DiagnosisAge, formData.ethnicity, formData.age, formData.gender,
            formData.gradelevel, formData.income, formData.oldersiblings,
            formData.youngersiblings, formData.twin, formData.diagnosis, formData.time,
            // NEW: Add timezone to the responseSet for similarity calculation
            formData.timezone
        ].forEach(item => {
            if (item && item.length > 0) responseSet.add(item);
        });
        
        // Note: mentorReason, hadMentorBefore, beenMentorBefore, and familyZip are stored on the document but NOT added to responseSet (no effect on similarity).

        const extraSection = document.getElementById("Parent/Caregiver-Extra");
        if (extraSection && extraSection.style.display === "block" && formData.seeking.includes("Parent/Caregiver")) {
             if (formData.parentcaregiverage) responseSet.add(formData.parentcaregiverage);
             if (formData.parentcaregivergender) responseSet.add(formData.parentcaregivergender);
        }
        [
            ...formData.schoolperformance, ...formData.medicalinfo, ...formData.treatment,
            ...formData.physicaleffects, ...formData.cognitiveeffects, ...formData.emotionaleffects
        ].forEach(item => {
            if (item && item.length > 0) responseSet.add(item);
        });
        // --- End of responseSet calculation ---

        const collectionPath = determineCollection(formData.seeking);

        // Generate base custom ID
        const baseCustomDocId = generateCustomDocId(formData.firstname, formData.lastname);
        // Always append a unique component (timestamp) to avoid collisions and the need for a read check
        finalDocId = `${baseCustomDocId}_${Date.now()}`;

        const dataToSubmit = {
            ...formData,
            responseSet: Array.from(responseSet),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            parentcaregiver: formData.seeking.includes("Parent/Caregiver"),
            seekingmentor: formData.seeking.toLowerCase().includes("seeking a mentor"),
            submissionComplete: true,
            documentId: finalDocId // Store the final generated ID in the document itself
        };

        console.log("Attempting to CREATE (set) document:", collectionPath + '/' + finalDocId);
        // Use set() for all collections with the generated unique ID.
        // This is a 'create' operation if the document doesn't exist, or 'overwrite' if it did (unlikely with timestamp).
        await db.collection(collectionPath).doc(finalDocId).set(dataToSubmit);
        console.log("Document CREATED (set) with ID:", finalDocId);


        // Matching logic - only if it was a "seeking a mentor" submission
        if (dataToSubmit.seekingmentor) {
            const mentorCollectionPathToRead = dataToSubmit.parentcaregiver ? 'Mentor-Caregiver' : 'Mentor-Survivor';
            try {
                console.log("Attempting to READ mentors from:", mentorCollectionPathToRead);
                const mentorsSnapshot = await db.collection(mentorCollectionPathToRead).get();
                const mentors = [];
                mentorsSnapshot.forEach(doc => mentors.push({id: doc.id, ...doc.data()}));
                console.log("Successfully READ", mentors.length, "mentors for matching.");

                const matches = [];
                const currentSeekerResponseSet = new Set(dataToSubmit.responseSet);

                mentors.forEach(mentorData => {
                    if (mentorData.responseSet && Array.isArray(mentorData.responseSet)) {
                        const mentorSet = new Set(mentorData.responseSet);
                        const similarity = calculateJaccardSimilarity(currentSeekerResponseSet, mentorSet);
                        if (similarity > 0) {
                             matches.push({
                                mentorId: mentorData.id,
                                similarity: Math.round(similarity * 100) / 100,
                                mentorEmail: mentorData.email,
                                mentorName: `${mentorData.firstname} ${mentorData.lastname}`,
                                mentorPhone: mentorData.number,
                                sharedExperiences: [...currentSeekerResponseSet].filter(x => mentorSet.has(x)),
                                totalMentorExperiences: mentorData.responseSet.length
                            });
                        }
                    }
                });

                matches.sort((a, b) => b.similarity - a.similarity);
                const topMatches = matches.slice(0, 3);

                const updatePayload = {
                    matches: topMatches,
                    totalPotentialMatches: matches.length,
                    matchingCompleted: true,
                    matchingTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                };

                console.log("Attempting to UPDATE document:", collectionPath + '/' + finalDocId, "with data:", updatePayload);
                await db.collection(collectionPath).doc(finalDocId).update(updatePayload);
                console.log("Seeker document UPDATED successfully with matches.");

            } catch (matchingError) {
                console.error('Error during matching process:', matchingError.message, matchingError.stack);
                const errorUpdatePayload = {
                    matchingError: matchingError.message,
                    matchingCompleted: false,
                    matchingTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                console.log("Attempting to UPDATE document with matching error:", collectionPath + '/' + finalDocId, "with data:", errorUpdatePayload);
                await db.collection(collectionPath).doc(finalDocId).update(errorUpdatePayload)
                    .catch(err => console.error("Critical Error: Failed to update matching error status:", err.message, err.stack));
            }
        }
        
        setSubmitButtonState(false);
        window.location.href = 'submitpage.html';

    } catch (error) {
        console.error("Error submitting form:", error.message, error.stack);
        if (error.code) {
            console.error("Firebase Error Code:", error.code);
        }
        setSubmitButtonState(false);
        alert(error.message || "There was an error submitting your form. Please try again.");
        const mentorForm = document.getElementById('Mentor-form');
        if (mentorForm) {
             mentorForm.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Jaccard similarity calculation
function calculateJaccardSimilarity(set1, set2) {
    if (set1.size === 0 && set2.size === 0) return 1;
    if (set1.size === 0 || set2.size === 0) return 0;
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
}

// Wait for DOM to be ready before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('Mentor-form');
    if (form) {
        form.removeAttribute('onsubmit');
        form.addEventListener('submit', handleSubmit);
        
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', function() {
                if (this.type !== 'radio' && this.type !== 'checkbox') {
                    if (!this.value.trim()) {
                        this.style.borderColor = '#ff6b6b';
                    } else {
                        this.style.borderColor = '#28a745';
                    }
                }
            });
        });
    } else {
        console.error('Form with id "Mentor-form" not found'); // Keep for critical error
    }
});