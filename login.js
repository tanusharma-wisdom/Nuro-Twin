// 1. IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// 2. CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyCaGpHn224hN8BLN5ognGjaC2FQLT-QsRE",
    authDomain: "nurotwin.firebaseapp.com",
    projectId: "nurotwin",
    storageBucket: "nurotwin.firebasestorage.app",
    messagingSenderId: "421221799326",
    appId: "1:421221799326:web:727e7ce802735a8577328f"
};

// 3. INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 4. DOM ELEMENTS
const form = document.querySelector("form"),
    emailField = form.querySelector(".email-field"),
    emailInput = emailField.querySelector(".email"),
    passField = form.querySelector(".create-password"),
    passInput = passField.querySelector(".password");

// NOTE: I removed cPassField (Confirm Password) because Login pages usually don't have this.

// --- VALIDATION FUNCTIONS ---

// Email Validation
function checkEmail() {
    const emaiPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!emailInput.value.match(emaiPattern)) {
        return emailField.classList.add("invalid");
    }
    emailField.classList.remove("invalid");
}

// Password Validation
function createPass() {
    // Note: For login, we keep your regex, but typically you only need to check if it's empty.
    const passPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passInput.value.match(passPattern)) {
        return passField.classList.add("invalid");
    }
    passField.classList.remove("invalid");
}

// Show/Hide Password Logic
const eyeIcons = document.querySelectorAll(".show-hide");
eyeIcons.forEach((eyeIcon) => {
    eyeIcon.addEventListener("click", () => {
        const pInput = eyeIcon.parentElement.querySelector("input");
        if (pInput.type === "password") {
            eyeIcon.classList.replace("bx-hide", "bx-show");
            pInput.type = "text";
        } else {
            eyeIcon.classList.replace("bx-show", "bx-hide");
            pInput.type = "password";
        }
    });
});

// --- SUBMIT / LOGIN HANDLING ---

form.addEventListener("submit", (e) => {
    e.preventDefault(); // Stop page reload
    
    checkEmail();
    createPass();

    // Add listeners for real-time validation
    emailInput.addEventListener("keyup", checkEmail);
    passInput.addEventListener("keyup", createPass);

    if (
        !emailField.classList.contains("invalid") &&
        !passField.classList.contains("invalid")
    ) {
        
        // --- FIREBASE LOGIN STARTS HERE ---
        const email = emailInput.value;
        const password = passInput.value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in successfully
                const user = userCredential.user;
                console.log("Login successful:", user);
                alert("Login successful! Redirecting...");
                
                // Redirect to the dashboard
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;

                // Handle Errors
                if (errorCode === 'auth/invalid-credential') {
                    // This is the generic error for wrong email OR password (security best practice)
                    alert("Incorrect email or password.");
                } else if (errorCode === 'auth/user-not-found') {
                    alert("No account found with this email.");
                } else if (errorCode === 'auth/wrong-password') {
                    alert("Incorrect password.");
                } else {
                    alert(errorMessage);
                }
            });
        // --- FIREBASE LOGIN ENDS HERE ---
    }
});


// --- FORGOT PASSWORD LOGIC ---

// You need an element in your HTML with id="forgot-pass"
const forgotPassBtn = document.getElementById("forgot-pass");

if (forgotPassBtn) {
    forgotPassBtn.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent link from navigating
        
        const email = emailInput.value;
        
        // We need an email address to send the reset link to
        if(!email) {
            alert("Please enter your email address in the email field first.");
            emailField.classList.add("invalid");
            return;
        }

        if(confirm(`Send password reset link to ${email}?`)) {
            sendPasswordResetEmail(auth, email)
                .then(() => {
                    alert("Password reset email sent! Check your inbox.");
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    alert("Error: " + errorMessage);
                });
        }
    });
}