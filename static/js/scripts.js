/*!
 * Start Bootstrap - Scrolling Nav v5.0.6 (https://startbootstrap.com/template/scrolling-nav)
 * Copyright 2013-2023 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-scrolling-nav/blob/master/LICENSE)
 */

// Scripts for navigation and UI functionality
window.addEventListener('DOMContentLoaded', event => {
    
    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    }

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // --- START: CONSOLIDATED FORM LOGIC ---
    
    // Get references to all the elements we need to control
    const roleRadios = document.querySelectorAll('input[name="I-am"]');
    const parentExtraSection = document.getElementById('Parent/Caregiver-Extra');
    const menteeReasonSection = document.getElementById('mentee-reason-section');
    const mentorReasonSection = document.getElementById('mentor-reason-section');
    const commonExperienceSection = document.getElementById('common-experience-section'); // New reference

    // Function to handle all logic when the "I am..." role changes
    function handleRoleChange() {
        // Find the value and ID of the selected radio button
        const selectedRadio = document.querySelector('input[name="I-am"]:checked');
        if (!selectedRadio) return; // Exit if nothing is selected
        
        const selectedValue = selectedRadio.value;
        const selectedId = selectedRadio.id;

        // --- Logic for Parent/Caregiver Extra Info ---
        if (selectedId === 'Par/Car-1' || selectedId === 'Par/Car-2') {
            parentExtraSection.style.display = 'block';
            parentExtraSection.querySelectorAll('input, textarea').forEach(el => el.required = true);
        } else {
            parentExtraSection.style.display = 'none';
            parentExtraSection.querySelectorAll('input, textarea').forEach(el => {
                el.required = false;
                if(el.type === 'radio') el.checked = false;
            });
        }

        // --- Logic for ALL Conditional Questions ---
        
        // First, hide ALL conditional sections and make their fields NOT required
        menteeReasonSection.style.display = 'none';
        menteeReasonSection.querySelectorAll('input, textarea').forEach(el => el.required = false);
        
        mentorReasonSection.style.display = 'none';
        mentorReasonSection.querySelectorAll('input, textarea').forEach(el => {
            el.required = false;
            if(el.type === 'radio') el.checked = false;
        });

        commonExperienceSection.style.display = 'none';
        commonExperienceSection.querySelectorAll('input, textarea').forEach(el => {
            el.required = false;
            if(el.type === 'radio') el.checked = false;
        });
    
        // If any role is selected, show the common experience questions
        if (selectedValue) {
            commonExperienceSection.style.display = 'block';
            commonExperienceSection.querySelectorAll('input, textarea').forEach(el => el.required = true);
        }

        // Then, show the specific reason question (mentee or mentor)
        if (selectedValue.includes('Seeking a mentor')) {
            menteeReasonSection.style.display = 'block';
            menteeReasonSection.querySelectorAll('input, textarea').forEach(el => el.required = true);
        } 
        else if (selectedValue.includes('become a mentor')) {
            mentorReasonSection.style.display = 'block';
            mentorReasonSection.querySelectorAll('input, textarea').forEach(el => el.required = true);
        }
    }

    // Attach the event listener to each radio button in the "I am..." group
    if(roleRadios.length > 0) {
        roleRadios.forEach(radio => {
            radio.addEventListener('change', handleRoleChange);
        });
    }

    // --- END: CONSOLIDATED FORM LOGIC ---

    // Initialize other form UI enhancements
    initializeFormUI();
});


// Initialize form UI enhancements
function initializeFormUI() {
    // Add form validation styling
    addFormValidationStyling();
    
    // Add form section animations
    addSectionAnimations();
    
    // Add field completion indicators
    addCompletionIndicators();
    
    // Add keyboard navigation improvements
    addKeyboardNavigation();

}

// Fix radio button styling issues - NO .is-valid classes on radio buttons
function fixRadioButtonStyling() {
    const form = document.getElementById('Mentor-form');
    if (!form) return;
    
    // Get all radio button groups
    const radioGroups = {};
    form.querySelectorAll('input[type="radio"]').forEach(radio => {
        const name = radio.name;
        if (!radioGroups[name]) {
            radioGroups[name] = [];
        }
        radioGroups[name].push(radio);
    });
    
    // Add change event listeners to each radio group
    Object.values(radioGroups).forEach(group => {
        group.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    // Clear ALL validation classes and styles from all radios AND labels in this group
                    group.forEach(r => {
                        // Remove all validation classes from the radio input
                        r.classList.remove('is-valid', 'is-invalid');
                        
                        // Remove all validation classes and styles from the label
                        const label = r.closest('label');
                        if (label) {
                            label.classList.remove('field-valid', 'field-invalid');
                            // Remove any inline styles that might have been added
                            label.style.borderColor = '';
                            label.style.backgroundColor = '';
                        }
                        
                        // Remove any parent container validation styling
                        const radioGroup = r.closest('.radio-group');
                        if (radioGroup) {
                            radioGroup.classList.remove('is-valid', 'is-invalid');
                        }
                        
                        removeFieldError(r);
                    });
                    
                    // Do NOT add any validation classes to radio buttons
                    // Just ensure errors are cleared
                }
            });
            
            // Also handle blur events to prevent validation styling
            radio.addEventListener('blur', function(e) {
                e.stopPropagation();
                // Prevent any validation from running on radio button blur
            });
        });
    });
    
    // Override any validation attempts on radio buttons
    form.querySelectorAll('input[type="radio"]').forEach(radio => {
        // Create a mutation observer to watch for class changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // If any validation classes are added, remove them immediately
                    if (radio.classList.contains('is-valid') || radio.classList.contains('is-invalid')) {
                        radio.classList.remove('is-valid', 'is-invalid');
                    }
                    
                    // Also check the parent label
                    const label = radio.closest('label');
                    if (label && (label.classList.contains('field-valid') || label.classList.contains('field-invalid'))) {
                        label.classList.remove('field-valid', 'field-invalid');
                        label.style.borderColor = '';
                        label.style.backgroundColor = '';
                    }
                }
            });
        });
        
        // Start observing the radio button for class changes
        observer.observe(radio, { attributes: true, attributeFilter: ['class'] });
        
        // Also observe the parent label if it exists
        const label = radio.closest('label');
        if (label) {
            observer.observe(label, { attributes: true, attributeFilter: ['class'] });
        }
    });
}

// Add visual feedback for form validation
function addFormValidationStyling() {
    const form = document.getElementById('Mentor-form');
    if (!form) return;
    
    // Style required fields - but EXCLUDE radio buttons and checkboxes
    const requiredFields = form.querySelectorAll('[required]:not([type="radio"]):not([type="checkbox"])');
    requiredFields.forEach(field => {
        // Add visual indicator for required fields
        const label = field.closest('.form-group')?.querySelector('label');
        if (label && !label.querySelector('.required-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'required-indicator';
            indicator.innerHTML = ' *';
            indicator.style.color = '#dc3545';
            label.appendChild(indicator);
        }
        
        // Add validation feedback for text inputs only
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearValidation);
    });
    
    // Handle radio button groups separately - only add required indicators, no validation
    const radioGroups = {};
    form.querySelectorAll('input[type="radio"][required]').forEach(radio => {
        if (!radioGroups[radio.name]) {
            radioGroups[radio.name] = true;
            // Add required indicator to the group label (not individual radio labels)
            const groupContainer = radio.closest('.form-group');
            if (groupContainer) {
                const groupLabel = groupContainer.querySelector('label:first-child');
                if (groupLabel && !groupLabel.querySelector('.required-indicator')) {
                    const indicator = document.createElement('span');
                    indicator.className = 'required-indicator';
                    indicator.innerHTML = ' *';
                    indicator.style.color = '#dc3545';
                    groupLabel.appendChild(indicator);
                }
            }
        }
    });
}

// Validate individual field - STRICTLY EXCLUDE radio buttons
function validateField(event) {
    const field = event.target;
    
    // Skip radio buttons and checkboxes completely - don't process them at all
    if (field.type === 'radio' || field.type === 'checkbox') {
        event.stopPropagation();
        return;
    }
    
    const value = field.value.trim();
    
    // Remove existing validation classes
    field.classList.remove('is-valid', 'is-invalid');
    
    if (field.hasAttribute('required') && !value) {
        field.classList.add('is-invalid');
        addFieldError(field, 'This field is required');
    } else if (field.type === 'email' && value && !isValidEmail(value)) {
        field.classList.add('is-invalid');
        addFieldError(field, 'Please enter a valid email address');
    } else if (field.type === 'tel' && value && !isValidPhone(value)) {
        field.classList.add('is-invalid');
        addFieldError(field, 'Please enter a valid phone number');
    } else if (field.name === 'family-zip' && value && !isValidUsZip(value)) {
        field.classList.add('is-invalid');
        addFieldError(field, 'Use 5 digits or ZIP+4 (12345-6789)');
    } else if (value) {
        field.classList.add('is-valid');
        removeFieldError(field);
    }
}

// Clear validation styling when user starts typing - EXCLUDE radio buttons
function clearValidation(event) {
    const field = event.target;
    
    // Skip radio buttons and checkboxes
    if (field.type === 'radio' || field.type === 'checkbox') {
        return;
    }
    
    field.classList.remove('is-invalid');
    removeFieldError(field);
}

// Add error message to field
function addFieldError(field, message) {
    removeFieldError(field); // Remove existing error first
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.875em';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

// Remove error message from field
function removeFieldError(field) {
    const container = field.parentNode;
    const existingError = container.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone validation
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
}

// US ZIP or ZIP+4
function isValidUsZip(zip) {
    return /^\d{5}(-\d{4})?$/.test(zip.trim());
}

// Add section animations
function addSectionAnimations() {
    const sections = document.querySelectorAll('fieldset, .form-section');
    
    // Add intersection observer for fade-in effect
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    sections.forEach(section => {
        section.style.cssText += `
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        `;
        observer.observe(section);
    });
}

// Add completion indicators
function addCompletionIndicators() {
    const fieldsets = document.querySelectorAll('fieldset, .form-section');
    
    fieldsets.forEach(fieldset => {
        const header = fieldset.querySelector('h5, h3');
        if (header) {
            const indicator = document.createElement('span');
            indicator.className = 'section-completion-indicator';
            indicator.style.cssText = `
                display: inline-block;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: #dee2e6;
                margin-left: 10px;
                position: relative;
                top: -2px;
            `;
            header.appendChild(indicator);
        }
    });
    
    // Update completion indicators
    const updateCompletionIndicators = () => {
        fieldsets.forEach(fieldset => {
            const requiredFields = fieldset.querySelectorAll('input[required]');
            const completedFields = Array.from(requiredFields).filter(field => {
                if (field.type === 'radio') {
                    return fieldset.querySelector(`input[name="${field.name}"]:checked`);
                }
                return field.value.trim() !== '';
            });
            
            const indicator = fieldset.querySelector('.section-completion-indicator');
            if (indicator) {
                if (requiredFields.length > 0 && completedFields.length === requiredFields.length) {
                    indicator.style.backgroundColor = '#28a745';
                    indicator.innerHTML = '✓';
                    indicator.style.color = 'white';
                    indicator.style.textAlign = 'center';
                    indicator.style.fontSize = '12px';
                    indicator.style.lineHeight = '20px';
                } else if (completedFields.length > 0) {
                    indicator.style.backgroundColor = '#ffc107';
                } else {
                    indicator.style.backgroundColor = '#dee2e6';
                    indicator.innerHTML = '';
                }
            }
        });
    };
    
    // Add event listeners for completion indicators
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.addEventListener('change', updateCompletionIndicators);
        input.addEventListener('input', updateCompletionIndicators);
    });
}

// Add keyboard navigation improvements
function addKeyboardNavigation() {
    const form = document.getElementById('Mentor-form');
    if (!form) return;
    
    // Add keyboard navigation for radio buttons
    const radioGroups = {};
    form.querySelectorAll('input[type="radio"]').forEach(radio => {
        const name = radio.name;
        if (!radioGroups[name]) {
            radioGroups[name] = [];
        }
        radioGroups[name].push(radio);
    });
    
    // Add arrow key navigation for radio groups
    Object.values(radioGroups).forEach(group => {
        group.forEach((radio, index) => {
            radio.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % group.length;
                    group[nextIndex].focus();
                    group[nextIndex].checked = true;
                    // Trigger change event
                    group[nextIndex].dispatchEvent(new Event('change', { bubbles: true }));
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prevIndex = (index - 1 + group.length) % group.length;
                    group[prevIndex].focus();
                    group[prevIndex].checked = true;
                    // Trigger change event
                    group[prevIndex].dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });
    });
}

// Smooth scroll to form sections
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Form submission feedback
function showSubmissionFeedback(message, type = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `submission-feedback alert alert-${type}`;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
        animation: slideInRight 0.5s ease;
    `;
    feedback.textContent = message;
    
    document.body.appendChild(feedback);
    
    // Remove feedback after 5 seconds
    setTimeout(() => {
        feedback.remove();
    }, 5000);
}

// Add animation styles
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .required-indicator {
        color: #dc3545;
        font-weight: bold;
    }
`;
document.head.appendChild(animationStyles);

// Export functions for external use
// Note: showQuestion and hideQuestion are no longer needed
window.scrollToSection = scrollToSection;
window.showSubmissionFeedback = showSubmissionFeedback;